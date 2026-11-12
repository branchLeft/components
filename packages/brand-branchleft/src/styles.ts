/**
 * CSS-only entry point, published as `@branchleft/brand-branchleft/css`.
 * Import once in a branchLeft-branded app: `import '@branchleft/brand-branchleft/css';`
 *
 * Order matters: tokens, then fonts, then element defaults, so `elements.css`
 * can read the `--bl-*` properties `tokens.css` declares.
 */
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/elements.css';
