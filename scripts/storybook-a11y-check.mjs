#!/usr/bin/env node
// Loads the built Storybook (storybook-static/) in a real Chromium, once per
// entry (every story AND every autodocs page) x per theme (dark/light — the
// "theme" toolbar global .storybook/preview.tsx defines), and runs axe's
// `color-contrast` rule against each. A story/doc that paints text one
// colour and its own background another, with a ratio below WCAG AA, is
// exactly the class of defect a screenshot review reliably misses (see the
// PR body this shipped with) but axe never does.
//
// Deliberately a plain Node script, not a Vitest suite: jsdom cannot resolve
// computed colours (this repo's own `test-utils/axe.ts` disables
// `color-contrast` for exactly that reason), so this needs a real browser —
// Playwright + a static file server, not jsdom.
//
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

async function serveStatic() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(STATIC_DIR, urlPath === '/' ? '/index.html' : urlPath);
      const st = await stat(filePath).catch(() => null);
      if (!st || st.isDirectory()) {
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
      res.end('not found');
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
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
      for (const entry of entries) {
        const viewMode = entry.type === 'docs' ? 'docs' : 'story';
        const url = `http://localhost:${PORT}/iframe.html?id=${entry.id}&viewMode=${viewMode}&globals=theme:${theme}`;
        const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', (err) => pageErrors.push(String(err)));

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
          await page.waitForTimeout(150);

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
          await context.close();
        }
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

await main();
