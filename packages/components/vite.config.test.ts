// @vitest-environment node
import { describe, expect, it } from 'vitest';
import config from './vite.config';

type ExternalRule = string | RegExp | ((id: string) => boolean);

const rules = (config.build?.rollupOptions?.external ?? []) as ExternalRule[];

const isExternal = (id: string): boolean =>
  rules.some((rule) => {
    if (typeof rule === 'string') return rule === id;
    if (rule instanceof RegExp) return rule.test(id);
    return rule(id);
  });

describe('vite.config rollupOptions.external', () => {
  it.each(['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'])(
    'keeps %s external',
    (id) => {
      expect(isExternal(id)).toBe(true);
    }
  );

  it.each(['framer-motion', 'framer-motion/dom'])(
    'externalises %s so it is not inlined into dist',
    (id) => {
      expect(isExternal(id)).toBe(true);
    }
  );

  it.each(['lucide-react', 'lucide-react/dynamic'])(
    'externalises %s so it is not inlined into dist',
    (id) => {
      expect(isExternal(id)).toBe(true);
    }
  );
});
