// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Manifest {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const manifest: Manifest = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

const LIBRARIES: Record<string, string> = {
  'framer-motion': '^13.0.0',
  'lucide-react': '^1.70.0',
};

describe('package.json declares the libraries the consumer must install', () => {
  it.each(Object.keys(LIBRARIES))('%s is a peer dependency, not a dependency', (name) => {
    expect(manifest.dependencies?.[name]).toBeUndefined();
    expect(manifest.peerDependencies?.[name]).toBe(LIBRARIES[name]);
  });

  it.each(Object.keys(LIBRARIES))(
    '%s is a dev dependency so the package build and tests still resolve it',
    (name) => {
      expect(manifest.devDependencies?.[name]).toBe(LIBRARIES[name]);
    }
  );
});
