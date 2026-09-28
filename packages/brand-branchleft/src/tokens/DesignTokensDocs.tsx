import * as React from 'react';
import type { DesignTokens } from '@branchleft/components';

/**
 * Storybook-only documentation view of a brand's token set — swatches,
 * type scale and spacing. Not exported from `src/index.ts`: this renders
 * ALL_CAPS placeholder labels for anything that would otherwise need real
 * copy, and exists purely so `pnpm build:storybook` shows both brands'
 * tokens, not as a component this package ships.
 */
export interface DesignTokensDocsProps {
  readonly tokens: DesignTokens;
}

const sectionStyle: React.CSSProperties = {
  marginBlockEnd: '2.5rem',
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.6,
  marginBlockEnd: '0.75rem',
};

function Swatch({
  name,
  value,
  provisional,
}: {
  name: string;
  value: string;
  provisional?: boolean;
}): React.JSX.Element {
  const isCssColor = /^#|^rgb|^hsl|^color-mix/.test(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {isCssColor && (
        <span
          style={{
            display: 'inline-block',
            width: '2rem',
            height: '2rem',
            borderRadius: '0.25rem',
            border: '1px solid rgba(128,128,128,0.4)',
            background: value,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
        {name}: {value}
        {provisional ? ' (PROVISIONAL)' : ''}
      </span>
    </div>
  );
}

/** Documents a full brand token set: colour swatches, type scale, spacing, radius, shadow, motion. */
export function DesignTokensDocs({ tokens }: Readonly<DesignTokensDocsProps>): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '48rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBlockEnd: '0.25rem' }}>
        {tokens.brand.toUpperCase()} DESIGN TOKENS
      </h1>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Colour (light / dark)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
          {Object.entries(tokens.colour).map(([name, value]) => (
            <React.Fragment key={name}>
              <Swatch
                name={`${name} · light`}
                value={value.light}
                provisional={value.provisional}
              />
              <Swatch name={`${name} · dark`} value={value.dark} provisional={value.provisional} />
            </React.Fragment>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Type faces</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(tokens.type.faces).map(([role, face]) => (
            <div key={role}>
              <div
                style={{
                  fontFamily: face.fallbackStack,
                  fontWeight: face.weights[face.weights.length - 1],
                  fontSize: '1.25rem',
                }}
              >
                {role.toUpperCase()} — {face.family} ({face.weights.join(', ')})
                {face.provisional ? ' [PROVISIONAL]' : ''}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{face.source}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Type scale</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tokens.type.scale.map((step) => (
            <div
              key={step.name}
              style={{
                fontFamily: tokens.type.faces.display.fallbackStack,
                fontSize: step.fontSize,
                lineHeight: step.lineHeight,
              }}
            >
              {step.name.toUpperCase()} — {step.fontSize} / {step.lineHeight}
              {step.provisional ? ' [PROVISIONAL]' : ''}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Spacing</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {tokens.spacing.map((step) => (
            <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  height: '0.75rem',
                  width: step.value,
                  maxWidth: '20rem',
                  background: 'currentColor',
                  opacity: 0.5,
                }}
                aria-hidden="true"
              />
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                {step.name}: {step.value}
                {step.provisional ? ' (PROVISIONAL)' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Radius</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {tokens.radius.map((step) => (
            <div
              key={step.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '3rem',
                  height: '3rem',
                  border: '1px solid rgba(128,128,128,0.4)',
                  borderRadius: step.value,
                }}
                aria-hidden="true"
              />
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                {step.name}: {step.value}
                {step.provisional ? ' (PROVISIONAL)' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      {tokens.shadow && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Shadow</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {tokens.shadow.map((step) => (
              <div
                key={step.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '4rem',
                    height: '3rem',
                    borderRadius: '0.25rem',
                    boxShadow: step.value,
                  }}
                  aria-hidden="true"
                />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                  {step.name}
                  {step.provisional ? ' (PROVISIONAL)' : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!tokens.shadow && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Shadow</h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            NO SHADOW TOKENS EXIST IN SOURCE FOR THIS BRAND.
          </p>
        </section>
      )}

      {tokens.motion && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Motion</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {tokens.motion.duration.map((step) => (
              <span
                key={step.name}
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
              >
                duration.{step.name}: {step.value}
                {step.provisional ? ' (PROVISIONAL)' : ''}
              </span>
            ))}
            {tokens.motion.easing.map((step) => (
              <span
                key={step.name}
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
              >
                easing.{step.name}: {step.value}
                {step.provisional ? ' (PROVISIONAL)' : ''}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
