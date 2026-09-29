import { describe, expect, it } from 'vitest';
import LogoMeta, * as LogoStories from './PublicPressLogo.stories';
import WordmarkMeta, * as WordmarkStories from './PublicPressWordmark.stories';

// Proves the fix for the one mechanism found that reproduces "a story
// named after a colour renders a different colour": an editable `color`
// control lets `&args=color:...` in the URL override it. A story named
// after a colour must have no way to accept that override; `Playground`
// is the one deliberate exception.
const NAMED_COLOUR_STORIES = ['Blue', 'Black', 'Pink', 'Yellow'] as const;

describe.each([
  { label: 'PublicPressWordmark', meta: WordmarkMeta, stories: WordmarkStories },
  { label: 'PublicPressLogo', meta: LogoMeta, stories: LogoStories },
])('$label stories', ({ meta, stories }) => {
  it("the meta's own default disables the color control", () => {
    expect(meta.argTypes?.color?.control).toBe(false);
  });

  it.each(NAMED_COLOUR_STORIES)('%s does not re-enable the color control', (name) => {
    const story = (stories as Record<string, { argTypes?: { color?: unknown } }>)[name];
    expect(story, name).toBeDefined();
    // A story that never overrides `color`'s argType inherits the meta's
    // `control: false` — the same effective state a URL-args override
    // would hit against.
    expect(story.argTypes?.color).toBeUndefined();
  });

  it('Playground is the one story that deliberately re-enables it', () => {
    const playground = (stories as Record<string, { argTypes?: { color?: { control?: unknown } } }>)
      .Playground;
    expect(playground).toBeDefined();
    expect(playground.argTypes?.color?.control).not.toBe(false);
  });
});
