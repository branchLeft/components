/**
 * CSS-only entry point, published as `@branchleft/brand-branchleft/css` and
 * built to `dist/branchleft.css` (see `vite.config.ts`'s `styles` entry and
 * `assetFileNames`).
 *
 * Import once in any new branchLeft-branded app:
 *
 *   import '@branchleft/brand-branchleft/css';
 *
 * Order matters: tokens before fonts before element defaults, so
 * `elements.css`'s rules can read the `--bl-*` custom properties
 * `tokens.css` declares.
 */
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/elements.css';
