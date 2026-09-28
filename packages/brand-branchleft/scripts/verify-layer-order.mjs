#!/usr/bin/env node
// Manual verification for the README's "Layer order in a Tailwind v4 app"
// section — NOT run in CI. CSS Cascade Layers priority depends on how a
// real browser resolves competing rules across layers; jsdom does not
// implement this correctly, and this repo has no sibling app to compile
// Tailwind against, so this is a documented script rather than a gate.

// Requires a real Tailwind v4 install and a real Chromium binary — this
// repo has neither. Point it at a sibling checkout that does (e.g.
// `website/`, which already installs both for its own e2e suite):
//
//   node scripts/verify-layer-order.mjs /path/to/website/node_modules/.pnpm

// It builds this package's own `dist/branchleft.css` (run `pnpm build`
// first) into three small Tailwind v4 fixtures — the recommended explicit
// `@layer` order, and both directions of a plain import order with no
// explicit statement (package first, and Tailwind first) — and prints
// real computed styles from a headless Chromium page for each. Exits
// non-zero if the recommended variant doesn't match EXPECTED below. Run
// this again whenever elements.css's layer structure changes, and paste
// the new numbers into the README/PR body.
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
  // No explicit @layer statement — this package's stylesheet imported
  // BEFORE Tailwind's own `@import 'tailwindcss'`. Both of this package's
  // layers register first, so BOTH sit below Tailwind's four (including
  // `theme`), never interleaved with them.
  'import order only, package first (NOT recommended — control)': `@import '${builtCss}';\n@import 'tailwindcss';\n${siteBase}`,
  // No explicit @layer statement — Tailwind imported first. Both of this
  // package's layers register AFTER all four of Tailwind's, so both sit
  // above `utilities`, never interleaved with them.
  'import order only, Tailwind first (NOT recommended — control)': `@import 'tailwindcss';\n@import '${builtCss}';\n${siteBase}`,
};

// The app root two levels above its own `node_modules/.pnpm` — where
// `compile`'s module resolution (for the bare `'tailwindcss'` specifier)
// needs to run from.
const appRoot = path.resolve(pnpmStoreArg, '..', '..');

// Only the recommended variant is expected to get every case right — the
// two import-order controls are measured but not asserted against these
// (their whole point is to demonstrate that they DON'T satisfy the
// requirement; see the README's "no working import-order fallback").
const EXPECTED = {
  bareH1: '48px / serif',
  hero: '60px / Syne',
  tableCell: '14px / "IBM Plex Sans"',
  label: '14px / "IBM Plex Sans"',
  blockquote: '14px / "IBM Plex Sans"',
};

let ok = true;
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

  if (name.startsWith('recommended')) {
    for (const [key, expected] of Object.entries(EXPECTED)) {
      const actual = computed[key];
      if (!actual.startsWith(expected)) {
        console.error(
          `FAIL: ${name} — ${key} expected to start with "${expected}", got "${actual}"`
        );
        ok = false;
      }
    }
  }
  await page.close();
}
await browser.close();

if (!ok) {
  console.error(
    '\nverify-layer-order: one or more measured values do not match EXPECTED — see FAIL lines above.'
  );
  process.exit(1);
}
console.log('\nverify-layer-order: all EXPECTED values matched for the recommended order.');
