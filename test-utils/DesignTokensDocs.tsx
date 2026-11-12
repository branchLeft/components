import * as React from 'react';
import type { DesignTokens } from '@branchleft/components';

/**
 * Storybook-only documentation view of a brand's token set. Not exported
 * from any package: it exists so `pnpm build:storybook` shows both brands'
 * tokens, and renders ALL_CAPS placeholders wherever real copy would go.
 */
export interface DesignTokensDocsProps {
  readonly tokens: DesignTokens;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginBlockEnd: '2.5rem',
};

const headingStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.65,
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '0.8rem',
  overflowWrap: 'anywhere',
};

function Provisional({ show }: { show?: boolean }): React.JSX.Element | null {
  if (!show) return null;
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: '0.65rem',
        letterSpacing: '0.06em',
        border: '1px solid currentColor',
        borderRadius: '0.25rem',
        padding: '0 0.3rem',
        marginInlineStart: '0.5rem',
        opacity: 0.7,
        whiteSpace: 'nowrap',
      }}
    >
      PROVISIONAL
    </span>
  );
}

function Swatch({
  name,
  value,
  provisional,
}: {
  name: string;
  value: string;
  provisional?: boolean;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2rem 1fr',
        gap: '0.75rem',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.25rem',
          border: '1px solid rgba(128,128,128,0.4)',
          background: value,
        }}
        aria-hidden="true"
      />
      <span style={valueStyle}>
        {name}: {value}
        <Provisional show={provisional} />
      </span>
    </div>
  );
}

/** Documents a full brand token set: colour swatches, type scale, spacing, radius, shadow, motion. */
export function DesignTokensDocs({ tokens }: Readonly<DesignTokensDocsProps>): React.JSX.Element {
  const body = tokens.type.faces.body.fallbackStack;
  const display = tokens.type.faces.display.fallbackStack;
  const wordmark = tokens.type.faces.wordmark;
  return (
    <div style={{ fontFamily: body, maxWidth: '52rem', lineHeight: 1.5 }}>
      <h1 style={{ fontFamily: display, fontSize: '1.5rem', margin: '0 0 1.5rem' }}>
        {tokens.brand.toUpperCase()} DESIGN TOKENS
      </h1>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Colour (light / dark)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 2rem' }}>
          {Object.entries(tokens.colour).map(([name, value]) => (
            <React.Fragment key={name}>
              <Swatch
                name={`${name} · light`}
                value={value.light}
                provisional={value.lightProvisional ?? value.provisional}
              />
              <Swatch
                name={`${name} · dark`}
                value={value.dark}
                provisional={value.darkProvisional ?? value.provisional}
              />
              {value.note && (
                <p style={{ gridColumn: '1 / -1', fontSize: '0.75rem', opacity: 0.75, margin: 0 }}>
                  {value.note}
                </p>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Type faces</h2>
        {Object.entries(tokens.type.faces).map(([role, face]) => (
          <div key={role}>
            <div style={{ fontFamily: face.fallbackStack, fontWeight: 500, fontSize: '1.25rem' }}>
              {role.toUpperCase()} — {face.family}
              <Provisional show={face.provisional} />
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              Weights {face.weights.join(', ')} · {face.source}
            </div>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Type scale</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '0.75rem 1.5rem',
            alignItems: 'baseline',
          }}
        >
          {tokens.type.scale.map((step) => {
            const isWordmark = step.name.includes('wordmark');
            return (
              <React.Fragment key={step.name}>
                <span style={valueStyle}>
                  {step.fontSize} / {step.lineHeight}
                  <Provisional show={step.provisional} />
                </span>
                <span
                  style={{
                    fontFamily: isWordmark ? wordmark.fallbackStack : display,
                    fontWeight: isWordmark ? Math.max(...wordmark.weights) : 400,
                    fontSize: step.fontSize,
                    lineHeight: step.lineHeight,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.name.toUpperCase()}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Spacing</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '0.4rem 1rem',
            alignItems: 'center',
          }}
        >
          {tokens.spacing.map((step) => (
            <React.Fragment key={step.name}>
              <span style={valueStyle}>
                {step.name}: {step.value}
                <Provisional show={step.provisional} />
              </span>
              <span
                style={{
                  height: '0.75rem',
                  width: step.value,
                  maxWidth: '20rem',
                  background: 'currentColor',
                  opacity: 0.5,
                }}
                aria-hidden="true"
              />
            </React.Fragment>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Radius</h2>
        {tokens.radius.map((step) => (
          <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                width: '3rem',
                height: '2rem',
                border: '1px solid rgba(128,128,128,0.6)',
                borderRadius: step.value,
              }}
              aria-hidden="true"
            />
            <span style={valueStyle}>
              {step.name}: {step.value}
              <Provisional show={step.provisional} />
            </span>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Shadow</h2>
        {tokens.shadow ? (
          tokens.shadow.map((step) => (
            <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  width: '4rem',
                  height: '3rem',
                  borderRadius: '0.25rem',
                  boxShadow: step.value,
                }}
                aria-hidden="true"
              />
              <span style={valueStyle}>
                {step.name}
                <Provisional show={step.provisional} />
              </span>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.8rem', opacity: 0.75, margin: 0 }}>
            NO SHADOW TOKENS EXIST IN SOURCE FOR THIS BRAND.
          </p>
        )}
      </section>

      {tokens.motion && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Motion</h2>
          {[
            ...tokens.motion.duration.map((step) => ({ ...step, name: `duration.${step.name}` })),
            ...tokens.motion.easing.map((step) => ({ ...step, name: `easing.${step.name}` })),
          ].map((step) => (
            <span key={step.name} style={valueStyle}>
              {step.name}: {step.value}
              <Provisional show={step.provisional} />
            </span>
          ))}
        </section>
      )}
    </div>
  );
}
