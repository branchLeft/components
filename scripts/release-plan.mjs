#!/usr/bin/env node
// Computes which workspace packages a release tag should publish and checks it against what the tag's message
// says it releases (three packages version independently, so the message is the record of intent). Writes the
// checked names to `GITHUB_OUTPUT` so the publish step is filtered to exactly what this gate approved.

import { readFileSync, readdirSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_REGISTRY = 'https://npm.pkg.github.com';

/**
 * Reads every `packages/*` workspace member's `package.json`, plus the root's own: included so a private, unversioned
 * root is something the selection logic must explicitly exclude, not something never offered to it.
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
 * Looks up whether `name@version` exists on `registry` (GitHub Packages' npm-compatible metadata endpoint): 404 means
 * never published, 2xx without the version means published but not this one. Anything else throws: never read as "skip it".
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
 * Selects which of `packages` to publish: skips a private or unversioned package without calling `isPublished`, and
 * propagates any error it throws: a lookup failure must fail the whole selection, never read as "already published".
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
 * Parses a signed tag's message for `name@version` lines, one per package released (RELEASING.md). Everything else
 * (subject, blank lines, prose) is ignored, not an error: the message can carry human context beside the machine-read lines.
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
 * Compares the tag's declared release list (`expected`) with the computed set due for release (`actual`). `ok` only when
 * identical: a package due but missing from the tag message, or named but not due, both fail. Order doesn't matter.
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
 * Strips inherited `GIT_*` variables and points `--git-dir`/`--work-tree` at `repoDir`: under a git hook,
 * git's own `GIT_DIR` would otherwise silently redirect every call to the hook's repository.
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
 * Reads a local tag's message via `%(contents)`, not `%(subject)`, which silently drops every `name@version` line after
 * the first. `git tag -l` behaves the same on a full clone or the shallow, tag-only fetch the tag-push event gives CI.
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
 * The release-plan gate: computes which packages are due, compares that with the tag's declared list, and throws on a
 * mismatch either way. The registry lookup and tag reader are parameters, so tests need no network or git (release-plan.test.mjs).
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
 * True when this module is the process's entry point. A hand-built `file://${argv1}` breaks silently for a path needing
 * URL-encoding (a space), so `main()` never runs and the process exits 0; `pathToFileURL` builds the matching URL.
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
