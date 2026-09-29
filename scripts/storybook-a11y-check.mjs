#!/usr/bin/env node
// Loads the built Storybook (storybook-static/) in a real Chromium, once per
// entry (every story AND every autodocs page) x per theme (dark/light —
// .storybook/preview.tsx's "theme" toolbar global), and runs axe's
// `color-contrast` rule against each.

// A plain Node script, not a Vitest suite: jsdom cannot resolve computed
// colours (see `test-utils/axe.ts`), so this needs a real browser.

// Usage: pnpm build:storybook && node scripts/storybook-a11y-check.mjs
// (or the one-command form: pnpm test:storybook-a11y)

import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_DIR = path.join(ROOT, 'storybook-static');
const PORT = 6474;
const THEMES = ['dark', 'light'];

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
};

/**
 * Resolves a request path against `root`, refusing anything that would
 * escape it (`../`, an encoded `../`, an absolute path, a NUL byte). Pure
 * and synchronous so the path guard itself — not the filesystem access
 * around it — is what a unit test exercises.
 *
 * Returns `null` for a rejected path, otherwise an absolute path under
 * `root` (not yet checked for existence).
 */
export function resolveStaticPath(root, requestUrl) {
  const rawPath = requestUrl.split('?')[0];
  if (rawPath.includes('\0')) return null;

  let urlPath;
  try {
    urlPath = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  // Reject up front, before resolution, rather than relying solely on the
  // final containment check below: a NUL byte, a literal `..` segment, a
  // Windows drive letter (`C:`) and a backslash (a Windows path separator,
  // meaningless to `path.posix` but still worth refusing outright) are all
  // rejected on sight.
  if (
    urlPath.includes('\0') ||
    urlPath.includes(':') ||
    urlPath.includes('\\') ||
    urlPath.split('/').includes('..')
  ) {
    return null;
  }

  const resolvedRoot = path.resolve(root);
  // The leading `.${sep}` is load-bearing: without it, `path.resolve`
  // treats a `urlPath` that starts with `/` as an ABSOLUTE second argument
  // and returns it unchanged, discarding `resolvedRoot` entirely — this is
  // what actually neutralises an absolute-path request, not the `..`
  // check above.
  const resolved = path.resolve(
    resolvedRoot,
    `.${path.sep}${urlPath === '/' ? 'index.html' : urlPath}`
  );
  const boundary = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (resolved !== resolvedRoot && !resolved.startsWith(boundary)) return null;

  return resolved;
}

async function serveStatic() {
  const server = createServer(async (req, res) => {
    const requestedPath = resolveStaticPath(STATIC_DIR, req.url);
    if (requestedPath === null) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('bad request');
      return;
    }

    try {
      const st = await stat(requestedPath).catch(() => null);

      // Only a genuinely missing, extensionless path (client-side routing,
      // e.g. Storybook's manager deep links) falls back to index.html. A
      // missing file that DOES have an extension — a JS/CSS chunk, a font —
      // is a real 404, never masked as HTML: serving index.html's markup
      // back with a `Content-Type: text/javascript` (guessed from the
      // requested path) is exactly how a single missing/mis-cased asset
      // turns into a "Failed to parse/execute script" error inside the
      // page, not a clean failure this script can see and report.
      let filePath = requestedPath;
      if (!st || st.isDirectory()) {
        if (path.extname(requestedPath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('not found');
          return;
        }
        filePath = path.join(STATIC_DIR, 'index.html');
      }

      const body = await readFile(filePath);
      res.setHeader(
        'Content-Type',
        CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream'
      );
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('not found');
    }
  });
  // Loopback only — this is a throwaway fixture server for a local/CI check,
  // never meant to be reachable off-host.
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  return server;
}

async function main() {
  const indexRaw = await readFile(path.join(STATIC_DIR, 'index.json'), 'utf8').catch(() => null);
  if (!indexRaw) {
    console.error(
      `Could not read ${path.join('storybook-static', 'index.json')} — run "pnpm build:storybook" first.`
    );
    process.exitCode = 1;
    return;
  }
  const entries = Object.values(JSON.parse(indexRaw).entries);

  const server = await serveStatic();
  const browser = await chromium.launch();
  const failures = [];

  try {
    for (const theme of THEMES) {
      // One context per theme, not per entry (116 short-lived contexts
      // exhausted file descriptors on a constrained CI runner and surfaced
      // as an in-page Storybook error rather than a script failure) — a
      // fresh page per entry is enough isolation for a read-only visit.
      const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
      try {
        for (const entry of entries) {
          const viewMode = entry.type === 'docs' ? 'docs' : 'story';
          const url = `http://127.0.0.1:${PORT}/iframe.html?id=${entry.id}&viewMode=${viewMode}&globals=theme:${theme}`;
          const page = await context.newPage();
          const pageErrors = [];
          page.on('pageerror', (err) => pageErrors.push(String(err)));
          page.on('console', (msg) => {
            if (msg.type() === 'error') pageErrors.push(msg.text());
          });

          try {
            await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
            await page.waitForTimeout(250);

            if (pageErrors.length > 0) {
              failures.push({ id: entry.id, theme, kind: 'render-error', detail: pageErrors });
            }

            const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
            if (results.violations.length > 0) {
              failures.push({
                id: entry.id,
                theme,
                kind: 'color-contrast',
                detail: results.violations.map((v) => ({
                  targets: v.nodes.map((n) => n.target.join(' ')),
                })),
              });
            }
          } catch (err) {
            failures.push({ id: entry.id, theme, kind: 'navigation-error', detail: String(err) });
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failures.length > 0) {
    console.error(`Storybook a11y check found ${failures.length} problem(s):\n`);
    for (const f of failures) {
      console.error(`- [${f.theme}] ${f.id} (${f.kind})`);
      console.error(`  ${JSON.stringify(f.detail)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Storybook a11y check: ${entries.length} entries x ${THEMES.length} themes, no color-contrast violations or render errors.`
  );
}

// Only runs when executed directly — `resolveStaticPath` is also imported
// by this script's own unit test, which must not trigger a real browser run.
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
