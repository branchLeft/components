/**
 * Shared design-token structure for both brands (branchLeft, PublicPress).
 *
 * `provisional: true` on any leaf means the value is not settled by a
 * written source — it is a best-effort placeholder pending a ruling from
 * the brand owner. See each brand file's top-of-file notes for what's
 * provisional and why.
 */

export interface ColourValue {
  light: string;
  dark: string;
  /**
   * True when NEITHER `light` nor `dark` is settled. A mode-specific value
   * is a guess only on the side `lightProvisional`/`darkProvisional` says
   * so — those take precedence over this for their own side, so a token
   * with one ruled mode and one guessed mode doesn't have to claim the
   * ruled side is provisional just because the other one is.
   */
  provisional?: boolean;
  /** True when specifically `light` is a guess, not a ruling. */
  lightProvisional?: boolean;
  /** True when specifically `dark` is a guess, not a ruling. */
  darkProvisional?: boolean;
  /**
   * A usage rule that belongs on the rendered token, not only in source —
   * e.g. a colour that's ruled but restricted to one use (a fill, never
   * text). Shown under the token's swatches in the docs page.
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
   * Active/accent colour — links, hover, focus. Optional: not every brand
   * has ruled a distinct one yet (a brand may still fold this role into
   * `brandAccent`), but the shape exists here so a brand that HAS ruled one
   * (see `publicPressTokens`) doesn't need its own one-off colour key.
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
 * The structure every brand's token set must provide. `shadow` and
 * `motion` are optional at this level because a brand may genuinely have
 * no ruling either way yet (see the "shadow if present, motion if
 * present" scoping in workspace#1435/#1436) — `REQUIRED_TOKEN_KEYS` below
 * lists only the keys every brand must have.
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
