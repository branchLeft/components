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

// Backstop for a hang: every page load/wait has its own bounded timeout, but if the run still exceeds this (a browser
// that stops responding, a hung close()) the process is killed rather than left running. Sized well above the worst
// case (entries x themes x per-entry timeout) with headroom for growth.
const OVERALL_TIMEOUT_MS = 10 * 60 * 1000;

// The bound the DOM-quiet wait enforces: watch each story's root for the full DOM_QUIET_CAP_MS after first render (no early
// exit), then check for a mutation in the last QUIET_MS. Quiet: scanned as rendered; still mutating: `still-mutating`
// failure. A story whose content appears only after DOM_QUIET_CAP_MS is not covered.
const QUIET_MS = 300;
const DOM_QUIET_CAP_MS = 1500;

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
 * Resolves a request path under `root`, refusing `../`, encoded `../`, absolute paths and NUL (returns
 * `null`; else an absolute path, existence unchecked). Pure, so a unit test exercises the guard itself.
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
  // Reject up front, before resolution, rather than rely only on the containment check below: a NUL byte, a `..` segment,
  // a Windows drive letter (`C:`) and a backslash (meaningless to `path.posix`) are refused on sight.
  if (
    urlPath.includes('\0') ||
    urlPath.includes(':') ||
    urlPath.includes('\\') ||
    urlPath.split('/').includes('..')
  ) {
    return null;
  }

  const resolvedRoot = path.resolve(root);
  // The leading `.${sep}` is load-bearing: without it `path.resolve` treats a `urlPath` starting with `/` as an ABSOLUTE
  // second argument and returns it unchanged, discarding `resolvedRoot`: this, not the `..` check above, neutralises an absolute path.
  const resolved = path.resolve(
    resolvedRoot,
    `.${path.sep}${urlPath === '/' ? 'index.html' : urlPath}`
  );
  const boundary = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (resolved !== resolvedRoot && !resolved.startsWith(boundary)) return null;

  return resolved;
}

const STATIC_DIR_BOUNDARY = path.resolve(STATIC_DIR) + path.sep;

/**
 * `@storybook/addon-a11y` runs its own axe pass on every story on a timer this script doesn't control, sometimes
 * still in flight when `analyze()` starts (axe-core rejects rather than queues). Retried: there is no way to skip it.
 */
async function analyzeColorContrast(page) {
  const ALREADY_RUNNING = 'Axe is already running';
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      // `analyze()` runs axe-core inside the page and has no timeout of its
      // own — raced from the Node side so a stuck evaluation can't hang
      // this script indefinitely either.
      return await Promise.race([
        new AxeBuilder({ page }).withRules(['color-contrast']).analyze(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('axe-core analyze() timed out after 20s')), 20_000)
        ),
      ]);
    } catch (err) {
      if (attempt === 5 || !String(err).includes(ALREADY_RUNNING)) throw err;
      await page.waitForTimeout(300 * attempt);
    }
  }
  throw new Error('unreachable');
}

async function serveStatic() {
  const server = createServer(async (req, res) => {
    const requestedPath = resolveStaticPath(STATIC_DIR, req.url);
    // Re-checked here, immediately guarding the two filesystem calls below,
    // rather than trusted as already-safe from resolveStaticPath's return
    // value alone.
    if (requestedPath === null || !requestedPath.startsWith(STATIC_DIR_BOUNDARY)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('bad request');
      return;
    }

    try {
      const st = await stat(requestedPath).catch(() => null);

      // Only a missing, extensionless path (client-side routing, e.g. Storybook's manager deep links) falls back to
      // index.html. A missing file WITH an extension (a JS/CSS chunk, a font) is a real 404: serving HTML as
      // `text/javascript` turns one missing asset into a "Failed to parse/execute script" error nobody can read.
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
  // STORYBOOK_A11Y_ONLY narrows a local run to ids containing that text;
  // CI never sets it, so CI always checks every entry.
  const only = process.env.STORYBOOK_A11Y_ONLY;
  const entries = Object.values(JSON.parse(indexRaw).entries).filter(
    (entry) => !only || entry.id.includes(only)
  );
  if (entries.length === 0) {
    throw new Error(`No Storybook entries match STORYBOOK_A11Y_ONLY=${only}`);
  }

  const server = await serveStatic();
  const browser = await chromium.launch();
  const failures = [];

  // The backstop described above `OVERALL_TIMEOUT_MS`: fires regardless of
  // what the try/finally below is doing, since nothing inside it can clear
  // or delay a `setTimeout` it never touches. Cleared once `main()` returns
  // normally (or throws) via the `clearTimeout` in the outer `finally`.
  const watchdog = setTimeout(() => {
    console.error(
      `Storybook a11y check: exceeded the overall ${OVERALL_TIMEOUT_MS}ms timeout — killing the process rather than hanging.`
    );
    process.exit(1);
  }, OVERALL_TIMEOUT_MS);

  try {
    for (const theme of THEMES) {
      // One context per theme, not per entry (116 short-lived contexts
      // exhausted file descriptors on a constrained CI runner and surfaced
      // as an in-page Storybook error rather than a script failure) — a
      // fresh page per entry is enough isolation for a read-only visit.
      const context = await browser.newContext({
        viewport: { width: 1024, height: 900 },
        reducedMotion: 'reduce',
      });
      try {
        for (const [entryIndex, entry] of entries.entries()) {
          const viewMode = entry.type === 'docs' ? 'docs' : 'story';
          const url = `http://127.0.0.1:${PORT}/iframe.html?id=${entry.id}&viewMode=${viewMode}&globals=theme:${theme}`;
          // Printed before the visit, not just on failure — the one signal
          // that tells a human watching a hung run where it stopped,
          // without waiting for the (bounded, but real) per-entry timeouts
          // to actually expire.
          console.log(`[${theme}] (${entryIndex + 1}/${entries.length}) ${entry.id} — visiting…`);
          const page = await context.newPage();
          const pageErrors = [];
          page.on('pageerror', (err) => pageErrors.push(String(err)));
          page.on('console', (msg) => {
            if (msg.type() === 'error') pageErrors.push(msg.text());
          });

          try {
            await page.goto(url, { waitUntil: 'load', timeout: 30_000 });

            const rootSelector = viewMode === 'docs' ? '#storybook-docs' : '#storybook-root';
            let rendered = true;
            try {
              // A real "the story is on screen" signal, not a delay tuned to one animation: Storybook's mount root has a child.
              // Reduced motion (this context's setting) makes framer-motion skip to its end state, so a working story resolves at once.
              await page.waitForFunction(
                (selector) => {
                  const root = document.querySelector(selector);
                  return Boolean(root && root.childElementCount > 0);
                },
                rootSelector,
                { timeout: 10_000 }
              );
              // Raced against a hard timeout INSIDE the page, not just awaited from Node: `document.fonts.ready` is not under
              // this script's control, and a stalled font fetch would leave this `evaluate` pending forever (the gap that hung a run).
              await page.evaluate(
                () =>
                  new Promise((resolve) => {
                    const timer = setTimeout(resolve, 5000);
                    document.fonts.ready.then(() => {
                      clearTimeout(timer);
                      resolve();
                    });
                  })
              );
            } catch {
              rendered = false;
            }

            if (!rendered) {
              failures.push({
                id: entry.id,
                theme,
                kind: 'empty-render',
                detail: [`${rootSelector} has no children after 10s — the story never rendered`],
              });
            }

            // "Has children" alone only proves an INITIAL render: a story whose content lands later (a timer, a delayed
            // fetch) would still be scanned showing a placeholder. No early exit on first sight of quiet, as a later mutation
            // would not have happened yet; watches the full bound. See DOM_QUIET_CAP_MS above for what that covers.
            if (rendered) {
              const quiet = await page.evaluate(
                ({ quietMs, capMs }) =>
                  new Promise((resolve) => {
                    const root = document.querySelector('#storybook-root, #storybook-docs');
                    if (!root) {
                      resolve({ settled: true });
                      return;
                    }
                    let lastMutationAt = 0;
                    const observer = new MutationObserver(() => {
                      lastMutationAt = Date.now();
                    });
                    observer.observe(root, { childList: true, subtree: true, attributes: true });
                    setTimeout(() => {
                      observer.disconnect();
                      const quietForMs = lastMutationAt === 0 ? capMs : Date.now() - lastMutationAt;
                      resolve({ settled: quietForMs >= quietMs });
                    }, capMs);
                  }),
                { quietMs: QUIET_MS, capMs: DOM_QUIET_CAP_MS }
              );
              if (!quiet.settled) {
                rendered = false;
                failures.push({
                  id: entry.id,
                  theme,
                  kind: 'still-mutating',
                  detail: [
                    `${rootSelector} was still mutating ${DOM_QUIET_CAP_MS}ms after ` +
                      `initial render (story ${entry.id}) — failing rather than scanning ` +
                      `content that may not be its final state`,
                  ],
                });
              }
            }

            if (pageErrors.length > 0) {
              failures.push({ id: entry.id, theme, kind: 'render-error', detail: pageErrors });
            }

            if (rendered) {
              const results = await analyzeColorContrast(page);
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
    clearTimeout(watchdog);
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
