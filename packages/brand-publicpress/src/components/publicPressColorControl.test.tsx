import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { composeStories } from '@storybook/react';
import * as LogoStories from './PublicPressLogo.stories';
import * as WordmarkStories from './PublicPressWordmark.stories';
import { PUBLIC_PRESS_INKS, type PublicPressColor } from './publicPressGeometry';

// A story named after a colour must render that colour even when its args
// say otherwise, which is what a URL's `args=color:...` supplies.
const NAMED: ReadonlyArray<[string, PublicPressColor]> = [
  ['Blue', 'blue'],
  ['Black', 'black'],
  ['Pink', 'pink'],
  ['Yellow', 'yellow'],
];

describe.each([
  { label: 'PublicPressWordmark', composed: composeStories(WordmarkStories) },
  { label: 'PublicPressLogo', composed: composeStories(LogoStories) },
])('$label stories', ({ composed }) => {
  const stories = composed as unknown as Record<
    string,
    (args?: Record<string, unknown>) => ReactElement
  >;

  it.each(NAMED)('%s renders its own colour even with a different color arg', (name, colour) => {
    const other: PublicPressColor = colour === 'pink' ? 'blue' : 'pink';
    const html = renderToStaticMarkup(stories[name]({ color: other }));
    expect(html).toContain(`fill="${PUBLIC_PRESS_INKS[colour].block}"`);
    expect(html).not.toContain(`fill="${PUBLIC_PRESS_INKS[other].block}"`);
  });

  it('Playground follows its color arg', () => {
    const html = renderToStaticMarkup(stories.Playground({ color: 'yellow' }));
    expect(html).toContain(`fill="${PUBLIC_PRESS_INKS.yellow.block}"`);
  });
});
