import type { Meta, StoryObj } from '@storybook/react';

// Regression probe, not a real component: JSX with no `React` import at
// all, in a directory no tsconfig covers. It only compiles because Storybook's Vite
// build forces the automatic JSX runtime explicitly
// (`viteConfig.esbuild.jsx = 'automatic'` in `.storybook/main.ts`) —
// remove that line and this story throws `ReferenceError: React is not
// defined` at render, which `scripts/storybook-a11y-check.mjs` reports as
// a render-error and fails on.
function JsxRuntimeProbe() {
  return <span>jsx runtime probe (no React import in this file)</span>;
}

const meta = {
  title: 'Internal/JsxRuntimeProbe',
  component: JsxRuntimeProbe,
  tags: ['autodocs'],
} satisfies Meta<typeof JsxRuntimeProbe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
