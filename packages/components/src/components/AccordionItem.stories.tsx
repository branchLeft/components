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

/** A single, fully controlled item (the component holds no state); with the shipped CSS, opening it plays a fade+grow reveal. */
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
 * Several items with independent `open` state: any number can be open at once, as nothing enforces
 * exclusivity. The shape used by the affordable-websites "What We Build" section.
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
 * Several items sharing one `openId`, so only one is open at a time (the shape
 * `ValuesCloud`'s accordion uses); the shared `name` also enforces it without JS.
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
