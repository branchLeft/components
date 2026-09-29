import type { JSX } from 'react';

const VALUE_NAMES = [
  'sustainability',
  'environment',
  'ai',
  'society',
  'opensource',
  'agility',
  'redlines',
] as const;

/**
 * Storybook-only fixture: one swatch per `--bl-value-*` ValuesColour. Not
 * exported from the package's public API — a consumer reads the custom
 * properties (or the `[data-accent]`/`--value-accent` bridge for
 * `ValuesCloud`) directly, there's no component wrapper to import.
 */
export function ValuesColoursSwatch(): JSX.Element {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
        gap: '1rem',
      }}
    >
      {VALUE_NAMES.map((name) => (
        <li key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              height: '4rem',
              borderRadius: '0.375rem',
              background: `var(--bl-value-${name})`,
            }}
            aria-hidden="true"
          />
          <span style={{ color: `var(--bl-value-${name})`, fontWeight: 600 }}>{name}</span>
        </li>
      ))}
    </ul>
  );
}
