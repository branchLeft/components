/**
 * Shared design-token structure for both brands. `provisional: true` on a leaf is a best-effort
 * placeholder pending the brand owner's ruling; see each brand file for which and why.
 */

export interface ColourValue {
  light: string;
  dark: string;
  /**
   * True when NEITHER `light` nor `dark` is settled. `lightProvisional`/`darkProvisional` take precedence for
   * their own side, so a token with one ruled mode needn't call that side provisional.
   */
  provisional?: boolean;
  /** True when specifically `light` is a guess, not a ruling. */
  lightProvisional?: boolean;
  /** True when specifically `dark` is a guess, not a ruling. */
  darkProvisional?: boolean;
  /**
   * A usage rule that belongs on the rendered token, not only in source (e.g. a ruled colour restricted to a fill,
   * never text). Shown under the token's swatches in the docs page.
   */
  note?: string;
}

export interface ColourTokens {
  background: ColourValue;
  foreground: ColourValue;
  /** Primary brand colour. */
  brand: ColourValue;
  /** Secondary/bright brand colour, used for links and accents. */
  brandAccent: ColourValue;
  /** De-emphasised text/border colour. */
  muted: ColourValue;
  /** Hairline border/divider colour. */
  hairline: ColourValue;
  /**
   * Active/accent colour (links, hover, focus). Optional: a brand may still fold this role into `brandAccent`,
   * but a brand that HAS ruled one (see `publicPressTokens`) shouldn't need its own one-off key.
   */
  active?: ColourValue;
}

export interface TypeFace {
  /** CSS `font-family` name. */
  family: string;
  /** Full fallback stack, as written in the source `--font-*` token. */
  fallbackStack: string;
  /** Weights the source actually loads/uses for this face. */
  weights: number[];
  /** Where the font file/service comes from. */
  source: string;
  provisional?: boolean;
}

export interface TypeFaces {
  /** Headings. */
  display: TypeFace;
  /** Hero/brand wordmark treatment. */
  wordmark: TypeFace;
  /** Body/reading copy. */
  body: TypeFace;
  /** Labels, CTAs, code — "machine voice". */
  mono: TypeFace;
}

export interface TypeScaleStep {
  name: string;
  fontSize: string;
  lineHeight: string;
  provisional?: boolean;
}

export interface TypeTokens {
  faces: TypeFaces;
  scale: TypeScaleStep[];
}

export interface SpacingStep {
  name: string;
  value: string;
  provisional?: boolean;
}

export interface RadiusStep {
  name: string;
  value: string;
  provisional?: boolean;
}

export interface ShadowStep {
  name: string;
  value: string;
  provisional?: boolean;
}

export interface MotionTokens {
  duration: { name: string; value: string; provisional?: boolean }[];
  easing: { name: string; value: string; provisional?: boolean }[];
}

/**
 * The structure every brand's token set must provide. `shadow` and `motion` are optional here because a brand may have
 * no ruling yet; `REQUIRED_TOKEN_KEYS` lists the keys every brand must have.
 */
export interface DesignTokens {
  brand: string;
  colour: ColourTokens;
  type: TypeTokens;
  spacing: SpacingStep[];
  radius: RadiusStep[];
  shadow?: ShadowStep[];
  motion?: MotionTokens;
}

/** Top-level keys every brand's `DesignTokens` must define. */
export const REQUIRED_TOKEN_KEYS = ['brand', 'colour', 'type', 'spacing', 'radius'] as const;

/** Keys every brand's `colour` object must define. */
export const REQUIRED_COLOUR_KEYS = [
  'background',
  'foreground',
  'brand',
  'brandAccent',
  'muted',
  'hairline',
] as const;

/** Keys every brand's `type.faces` object must define. */
export const REQUIRED_TYPE_FACE_KEYS = ['display', 'wordmark', 'body', 'mono'] as const;
