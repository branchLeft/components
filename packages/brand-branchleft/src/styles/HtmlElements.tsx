import * as React from 'react';

/**
 * Storybook-only fixture rendering one of every element `elements.css`
 * defines, so a reviewer can eyeball the whole set in both modes (see the
 * "theme" toolbar in `.storybook/preview.tsx`) rather than reading CSS.
 * Not exported from the package's public API — `branchleft-base` applies
 * to plain markup automatically, so there is nothing for consumers to
 * import here.
 */

/**
 * Storybook-only demo layout for a form field row (label + control) — not
 * part of `elements.css`, which deliberately ships no form-row grid (see
 * that file's own comments): a consumer's markup decides label/control
 * placement, this fixture just needs its own so a bare `label` + `input`
 * pair (each sized only by its own content, per the stylesheet) doesn't
 * read as two randomly-spaced inline items.
 */
const fieldRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '11rem 1fr',
  alignItems: 'center',
  columnGap: '1rem',
  marginBottom: '0.75rem',
};

export function HtmlElements(): React.JSX.Element {
  return (
    <div>
      <h1>Heading level one</h1>
      <h2>Heading level two</h2>
      <h3>Heading level three</h3>
      <h4>Heading level four</h4>
      <h5>Heading level five</h5>
      <h6>Heading level six</h6>

      <p>
        A paragraph with a <a href="#">link in context</a>, some <strong>strong text</strong>, some{' '}
        <em>emphasised text</em>, and <small>small print</small>.
      </p>

      <ul>
        <li>Unordered item one</li>
        <li>Unordered item two</li>
      </ul>
      <ol>
        <li>Ordered item one</li>
        <li>Ordered item two</li>
      </ol>

      <dl>
        <dt>Term</dt>
        <dd>Its definition.</dd>
      </dl>

      <blockquote>A short quotation, set off from the surrounding copy.</blockquote>
      <hr />

      <p>
        Inline <code>code()</code>, a <kbd>Ctrl</kbd> key, and <samp>sample output</samp>.
      </p>
      <pre>
        <code>{'function example() {\n  return true;\n}'}</code>
      </pre>

      <table>
        <caption>A short table caption</caption>
        <thead>
          <tr>
            <th>Column A</th>
            <th>Column B</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, A</td>
            <td>Row 1, B</td>
          </tr>
          <tr>
            <td>Row 2, A</td>
            <td>Row 2, B</td>
          </tr>
        </tbody>
      </table>

      <figure>
        <img
          src="https://placehold.co/240x120?text=branchLeft"
          alt="Placeholder illustration"
          width={240}
          height={120}
        />
        <figcaption>A figure caption describing the image above.</figcaption>
      </figure>

      <form>
        <fieldset style={{ maxWidth: '36rem' }}>
          <legend>Example form</legend>
          <div style={fieldRowStyle}>
            <label htmlFor="html-elements-name">Name</label>
            <input id="html-elements-name" type="text" placeholder="Ada Lovelace" />
          </div>
          <div style={fieldRowStyle}>
            <label htmlFor="html-elements-invalid">Email (invalid state demo)</label>
            <input
              id="html-elements-invalid"
              type="email"
              defaultValue="not-an-email"
              required
              aria-invalid="true"
              aria-describedby="html-elements-invalid-error"
            />
          </div>
          <p
            id="html-elements-invalid-error"
            className="bl-form-error"
            style={{ marginInlineStart: '12rem' }}
          >
            Enter a valid email address.
          </p>
          <div style={fieldRowStyle}>
            <label htmlFor="html-elements-select">Choice</label>
            <select id="html-elements-select">
              <option>One</option>
              <option>Two</option>
            </select>
          </div>
          <div style={fieldRowStyle}>
            <label htmlFor="html-elements-textarea">Message</label>
            <textarea id="html-elements-textarea" rows={3} placeholder="Say something" />
          </div>
          <div style={fieldRowStyle}>
            <label htmlFor="html-elements-disabled">Disabled field</label>
            <input id="html-elements-disabled" type="text" disabled placeholder="Disabled" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button">Filled button</button>
            <button type="button" disabled>
              Disabled button
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
