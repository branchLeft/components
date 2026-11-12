import type { Meta, StoryObj } from '@storybook/react';

// Regression probe, not a component: JSX with no `React` import, outside any tsconfig.
// It compiles only because `.storybook/main.ts` forces the automatic JSX runtime;
// without that it throws at render (see .storybook/README.md).
function JsxRuntimeProbe() {
  return <span>jsx runtime probe (no React import in this file)</span>;
}

const meta = {
  title: 'Internal/JsxRuntimeProbe',
  component: JsxRuntimeProbe,
  // '!dev' drops the default 'dev' tag the sidebar filters on: hidden from the sidebar and docs nav,
  // still in storybook-static's index.json, which scripts/storybook-a11y-check.mjs reads.
  tags: ['!dev'],
} satisfies Meta<typeof JsxRuntimeProbe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
