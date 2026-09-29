/**
 * CSS-only entry point, published as `@branchleft/brand-publicpress/css` and
 * built to `dist/publicpress.css` (see `vite.config.ts`'s `styles` entry and
 * `assetFileNames`).
 *
 * PublicPress has no element stylesheet yet (see the workspace CLAUDE.md) —
 * this entry ships only the two self-hosted typefaces (`fonts.css`) so a
 * consumer or Storybook can load them:
 *
 *   import '@branchleft/brand-publicpress/css';
 */
import './styles/fonts.css';
