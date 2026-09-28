#!/usr/bin/env node
// Computes which workspace packages a release tag should publish, and
// checks that against what the tag itself says it releases. A single `v*`
// tag no longer maps to one package's version (three packages version
// independently), so the tag's own message is the release's record of
// intent — this script is what holds it to that, before anything is
// actually built or published. It also writes the checked list of package
// names to `GITHUB_OUTPUT`, so the publish step can be filtered to exactly
// what this gate approved, rather than trusting `pnpm -r publish` to agree
// with a separately-computed decision.

import { readFileSync, readdirSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_REGISTRY = 'https://npm.pkg.github.com';

/**
 * Reads every `packages/*` workspace member's `package.json`, plus the
 * workspace root's own (included so a private, unversioned root is
 * something the selection logic explicitly has to exclude, not something
 * that's simply never offered to it).
 */
export function readWorkspacePackages(rootDir) {
  const packagesDir = path.join(rootDir, 'packages');
  const memberDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDir, entry.name));

  return [rootDir, ...memberDirs].map((dir) => {
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return {
      name: pkg.name,
      version: pkg.version,
      private: Boolean(pkg.private),
      registry: pkg.publishConfig?.registry ?? DEFAULT_REGISTRY,
      dir,
    };
  });
}

/**
 * Looks up whether `name@version` already exists on `registry`, using the
 * npm-registry-compatible metadata endpoint GitHub Packages exposes. A 404
 * means the package name has never been published at all; a 2xx with the
 * version absent from `versions` means published, but not this version.
 * Anything else (auth failure, 5xx, network error) is a lookup failure and
 * throws — the caller must not treat "I couldn't tell" as "skip it".
 */
export async function isPublishedOnRegistry(name, version, { registry, token, fetchImpl = fetch }) {
  const url = `${registry}/${encodeURIComponent(name)}`;
  let response;
  try {
    response = await fetchImpl(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (cause) {
    throw new Error(`registry lookup for ${name} failed: ${cause.message}`, { cause });
  }

  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`registry lookup for ${name} failed: HTTP ${response.status}`);
  }

  const body = await response.json();
  return Boolean(body.versions && Object.prototype.hasOwnProperty.call(body.versions, version));
}

/**
 * Selects which of `packages` should be published: skips a private or
 * unversioned package without ever calling `isPublished` for it, publishes
 * one `isPublished` reports as absent, skips one it reports as present, and
 * propagates (rather than swallows) any error `isPublished` throws — a
 * registry lookup failure must fail the whole selection, never silently
 * fall back to "already published, leave it alone".
 */
export async function selectPackagesToPublish(packages, isPublished) {
  const toPublish = [];
  for (const pkg of packages) {
    if (pkg.private || !pkg.version) {
      continue;
    }
    const alreadyPublished = await isPublished(pkg);
    if (!alreadyPublished) {
      toPublish.push(pkg);
    }
  }
  return toPublish;
}

const RELEASE_LINE = /^(.+)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/;

/**
 * Parses a signed tag's message for `name@version` lines — one per package
 * it releases, per RELEASING.md's tag-message rule. Everything else in the
 * message (the subject line, blank lines, prose) is ignored, not treated as
 * an error: the message can carry human context alongside the machine-read
 * lines.
 */
export function parseReleaseTagMessage(message) {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const match = RELEASE_LINE.exec(line);
      return match ? [{ name: match[1], version: match[2] }] : [];
    });
}

function releaseKey(pkg) {
  return `${pkg.name}@${pkg.version}`;
}

/**
 * Compares the tag's declared release list (`expected`) against the
 * actually-computed set of packages due for release (`actual`). `ok` is
 * true only when the two sets are identical — a package due for release
 * but missing from the tag message, or named in the tag message but not
 * actually due for release, both fail it. Order doesn't matter.
 */
export function compareReleaseSets(expected, actual) {
  const expectedKeys = new Set(expected.map(releaseKey));
  const actualKeys = new Set(actual.map(releaseKey));

  const missingFromTag = actual.filter((pkg) => !expectedKeys.has(releaseKey(pkg)));
  const extraInTag = expected.filter((pkg) => !actualKeys.has(releaseKey(pkg)));

  return {
    ok: missingFromTag.length === 0 && extraInTag.length === 0,
    missingFromTag,
    extraInTag,
  };
}

/**
 * Strips every inherited `GIT_*` environment variable and instead points
 * `--git-dir`/`--work-tree` explicitly at `repoDir` — belt and braces, not
 * either alone: when this process is itself invoked from inside a git hook
 * (a pre-commit run, for one), git has already set `GIT_DIR`/`GIT_WORK_TREE`/
 * `GIT_INDEX_FILE` in the environment for that hook, and a plain
 * `execFileSync` inherits them, silently pointing every `git` call below at
 * the *hook's* repository instead of `repoDir` — no error, just the wrong
 * repository read from or written to.
 */
export function isolatedGitArgs(repoDir, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_')) delete env[key];
  }
  return {
    args: [`--git-dir=${path.join(repoDir, '.git')}`, `--work-tree=${repoDir}`, ...args],
    env,
  };
}

/**
 * Reads a local tag's own message via `%(contents)`, deliberately not
 * `%(subject)` — a signed tag's message is the subject line, a blank line,
 * then the `name@version` lines RELEASING.md asks for, and `%(subject)`
 * returns only that first line, silently discarding every package line
 * after it. `git tag -l` (not `cat-file`/`for-each-ref`) works the same way
 * whether the tag arrived as a full clone or the shallow, tag-only fetch
 * the tag-push event actually gives CI.
 */
export function readTagMessageFromGit(tagName, { cwd } = {}) {
  const { args, env } = isolatedGitArgs(cwd, ['tag', '-l', '--format=%(contents)', tagName]);
  return execFileSync('git', args, { cwd, encoding: 'utf8', env });
}

function writeJobSummary(text) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    appendFileSync(summaryPath, `${text}\n`);
  } else {
    console.log(text);
  }
}

function formatPackage(pkg) {
  return `${pkg.name}@${pkg.version}`;
}

/**
 * The release-plan gate itself: computes which packages are actually due
 * for release, compares that against what the tag's message declares, and
 * throws on any mismatch — in either direction — before returning the
 * approved list. This is the one function a tag-triggered release must
 * never get past on a mismatch, so it takes its registry lookup and its tag
 * reader as parameters rather than reaching for the network or `git`
 * itself, and is exercised end to end (real git tag, stubbed registry) in
 * release-plan.test.mjs rather than only through `compareReleaseSets`'s own
 * unit tests.
 */
export async function runReleasePlan({
  packages,
  tagName,
  isPublished,
  readTagMessage,
  writeSummary = writeJobSummary,
}) {
  const toPublish = await selectPackagesToPublish(packages, isPublished);
  const actual = toPublish.map((pkg) => ({ name: pkg.name, version: pkg.version }));

  const tagMessage = readTagMessage(tagName);
  const expected = parseReleaseTagMessage(tagMessage);
  const comparison = compareReleaseSets(expected, actual);

  const summaryLines = [`## Release plan for \`${tagName}\``, ''];
  if (actual.length > 0) {
    summaryLines.push(...actual.map((pkg) => `- \`${formatPackage(pkg)}\``));
  } else {
    summaryLines.push(
      '_Nothing to publish — every workspace package is already on the registry at its current version._'
    );
  }
  writeSummary(summaryLines.join('\n'));

  if (!comparison.ok) {
    for (const pkg of comparison.missingFromTag) {
      console.error(
        `::error::${formatPackage(pkg)} is due for release but the tag message doesn't list it`
      );
    }
    for (const pkg of comparison.extraInTag) {
      console.error(
        `::error::the tag message lists ${formatPackage(pkg)}, but that version is already on the registry, unversioned, or private`
      );
    }
    throw new Error(
      `${tagName}'s message does not match the computed release plan — see the errors above`
    );
  }

  return { toPublish, actual };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const token = process.env.NODE_AUTH_TOKEN ?? process.env.GITHUB_TOKEN;
  const tagName = process.env.GITHUB_REF_NAME ?? process.argv[2];
  if (!tagName) {
    throw new Error('no tag name given: set GITHUB_REF_NAME or pass one as an argument');
  }

  const packages = readWorkspacePackages(rootDir);

  const { toPublish, actual } = await runReleasePlan({
    packages,
    tagName,
    isPublished: (pkg) =>
      isPublishedOnRegistry(pkg.name, pkg.version, { registry: pkg.registry, token }),
    readTagMessage: (tag) => readTagMessageFromGit(tag, { cwd: rootDir }),
  });

  console.log(
    actual.length > 0
      ? `Tag message matches the release plan: ${actual.map(formatPackage).join(', ')}`
      : 'Tag message matches the release plan: nothing to publish.'
  );

  // Names only, comma-joined, so the workflow's publish step can build one
  // `--filter <name>` per package and bind `pnpm -r publish` to exactly this
  // gate's decision — never to whatever pnpm's own registry check would
  // otherwise have picked.
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    appendFileSync(githubOutput, `packages=${toPublish.map((pkg) => pkg.name).join(',')}\n`);
  }
}

/**
 * True when this module is the process's actual entry point. Comparing
 * `import.meta.url` against a hand-built `file://${argv1}` string breaks
 * silently for any path needing URL-encoding (a space, for one) — `main()`
 * would then just never run, and the process would exit 0 having done
 * nothing. `pathToFileURL` builds the same kind of URL `import.meta.url`
 * actually is, so the comparison holds regardless of what characters the
 * path contains.
 */
export function isEntryPoint(metaUrl, argv1) {
  return Boolean(argv1) && metaUrl === pathToFileURL(argv1).href;
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
