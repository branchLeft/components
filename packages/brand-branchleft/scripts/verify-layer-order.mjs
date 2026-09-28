#!/usr/bin/env node
// Manual verification for the README's "Layer order in a Tailwind v4 app"
// section — NOT run in CI. CSS Cascade Layers priority depends on how a
// real browser resolves competing rules across layers; jsdom does not
// implement this correctly, and this repo has no sibling app to compile
// Tailwind against, so this is a documented script rather than a gate.
//
// Requires a real Tailwind v4 install and a real Chromium binary — this
// repo has neither. Point it at a sibling checkout that does (e.g.
// `website/`, which already installs both for its own e2e suite):
//
//   node scripts/verify-layer-order.mjs /path/to/website/node_modules/.pnpm
//
// It builds this package's own `dist/branchleft.css` (run `pnpm build`
// first) into two small Tailwind v4 fixtures — this package's recommended
// explicit `@layer` order, and a plain-import-order fallback with no
// explicit statement — and prints real computed styles from a headless
// Chromium page for each. Run this again whenever elements.css's layer
// structure changes, and paste the new numbers into the README/PR body.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pnpmStoreArg = process.argv[2];
if (!pnpmStoreArg) {
  console.error(
    'Usage: node verify-layer-order.mjs <path-to-a-checkout>/node_modules/.pnpm\n' +
      '(a sibling app that already installs tailwindcss@^4 and playwright, e.g. website/)'
  );
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const builtCss = path.join(packageRoot, 'dist', 'branchleft.css');
if (!fs.existsSync(builtCss)) {
  console.error(`Not found: ${builtCss} — run "pnpm build" in this package first.`);
  process.exit(2);
}

function findStoreDir(prefix) {
  const entries = fs.readdirSync(pnpmStoreArg).filter((name) => name.startsWith(prefix));
  if (entries.length === 0) {
    throw new Error(`No "${prefix}*" directory found under ${pnpmStoreArg}`);
  }
  // Prefer the highest-sorting (usually latest) match if more than one.
  entries.sort();
  return path.join(pnpmStoreArg, entries[entries.length - 1]);
}

const tailwindNodeDir = findStoreDir('@tailwindcss+node@');
const playwrightDir = findStoreDir('playwright@');

const { compile, optimize } = await import(
  path.join(tailwindNodeDir, 'node_modules/@tailwindcss/node/dist/index.mjs')
);
const { chromium } = await import(path.join(playwrightDir, 'node_modules/playwright/index.mjs'));

// A minimal stand-in for the site's own base.css: an `h1` rule with values
// deliberately unlike the package's own hero wordmark tokens, so the two
// are trivially distinguishable in computed style output.
const siteBase = `@layer base { h1 { font-size: 3rem; font-family: serif; line-height: 1.1 } p { line-height: 1.6 } li { line-height: 1.6 } }`;

const html = `
<h1 id="bareH1">bare</h1>
<h1 id="hero" class="bl-wordmark bl-wordmark--hero">hero</h1>
<div class="text-sm text-red-500"><p id="p">para</p><ul><li id="li">item</li></ul></div>
<p id="pXs" class="text-xs">xs</p>
<div class="text-sm"><table id="table"><tr><td id="td">cell</td></tr></table><label id="label">l</label><blockquote id="bq">q</blockquote></div>`;

const variants = {
  'recommended (explicit @layer order, flat names)': `@layer theme, branchleft-base, base, branchleft-components, components, utilities;\n@import 'tailwindcss';\n@import '${builtCss}';\n${siteBase}`,
  'import-order only (no explicit statement — NOT recommended, kept as a control)': `@import 'tailwindcss';\n@import '${builtCss}';\n${siteBase}`,
};

// The app root two levels above its own `node_modules/.pnpm` — where
// `compile`'s module resolution (for the bare `'tailwindcss'` specifier)
// needs to run from.
const appRoot = path.resolve(pnpmStoreArg, '..', '..');

const browser = await chromium.launch();
for (const [name, src] of Object.entries(variants)) {
  const compiler = await compile(src, { base: appRoot, onDependency() {} });
  const candidates = [...new Set(html.match(/[a-z0-9-]+/g))];
  const css = compiler.build(candidates);
  const { code: opt } = optimize(css, { minify: true });
  const layerStatements = opt.match(/@layer [a-z0-9.,-]+[;{]/g);

  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html><head><style>${opt}</style></head><body>${html}</body></html>`
  );
  const computed = await page.evaluate(() => {
    const style = (id) => {
      const s = getComputedStyle(document.getElementById(id));
      return `${s.fontSize} / ${s.fontFamily.split(',')[0]} / ${s.color}`;
    };
    return {
      bareH1: style('bareH1'),
      hero: style('hero'),
      pInTextSmRed: style('p'),
      liInTextSmRed: style('li'),
      pXs: style('pXs'),
      tableCell: style('td'),
      label: style('label'),
      blockquote: style('bq'),
    };
  });
  console.log(`\n== ${name}`);
  console.log('layer order in built CSS:', JSON.stringify(layerStatements));
  console.log(JSON.stringify(computed, null, 1));
  await page.close();
}
await browser.close();
