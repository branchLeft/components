import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AccordionItem } from './AccordionItem';
import './AccordionItem.css';

const meta = {
  title: 'Components/AccordionItem',
  component: AccordionItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AccordionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A single item, fully controlled — this component holds no state of its
 * own. With the package's shipped CSS applied, opening it plays the
 * fade+grow reveal animation.
 */
export const Default: Story = {
  args: { summary: '', open: false, onOpenChange: () => {}, children: null },
  render: function DefaultStory() {
    const [open, setOpen] = React.useState(false);
    return (
      <AccordionItem summary="What's included?" open={open} onOpenChange={setOpen}>
        Everything you need to get started, and nothing you don't.
      </AccordionItem>
    );
  },
};

/**
 * Several items with independent `open` state — any number can be open at
 * once, since nothing here enforces exclusivity. This is the shape used by
 * the affordable-websites "What We Build" section.
 */
export const MultipleOpenAtOnce: Story = {
  args: { summary: '', open: false, onOpenChange: () => {}, children: null },
  render: function MultipleOpenStory() {
    const items = ['Design', 'Quality', 'Hosting'];
    const [openItems, setOpenItems] = React.useState<ReadonlySet<string>>(new Set(['Design']));

    function setItemOpen(item: string, open: boolean) {
      setOpenItems((current) => {
        const next = new Set(current);
        if (open) next.add(item);
        else next.delete(item);
        return next;
      });
    }

    return (
      <>
        {items.map((item) => (
          <AccordionItem
            key={item}
            summary={item}
            open={openItems.has(item)}
            onOpenChange={(open) => setItemOpen(item, open)}
          >
            Details about {item}.
          </AccordionItem>
        ))}
      </>
    );
  },
};

/**
 * Several items sharing one `openId` — only one is ever open, driven by the
 * consumer's own state (this is the shape `ValuesCloud`'s accordion
 * fallback uses). The same `name` is also passed to every item so the
 * exclusivity holds natively even with JavaScript disabled.
 */
export const OneOpenAtATime: Story = {
  args: { summary: '', open: false, onOpenChange: () => {}, children: null },
  render: function OneOpenAtATimeStory() {
    const items = ['Design', 'Quality', 'Hosting'];
    const [openId, setOpenId] = React.useState<string | null>('Design');

    return (
      <>
        {items.map((item) => (
          <AccordionItem
            key={item}
            name="storybook-one-open-at-a-time"
            summary={item}
            open={openId === item}
            onOpenChange={(open) => setOpenId(open ? item : null)}
          >
            Details about {item}.
          </AccordionItem>
        ))}
      </>
    );
  },
};
