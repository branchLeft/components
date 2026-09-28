// Exercises the real Changesets bump logic (not a re-implementation of it)
// against this workspace's actual package.json/config files, to prove that a
// components MINOR bump can never force a brand package to 1.0.0. Below
// 1.0, npm's caret range treats the minor digit as breaking, so a brand
// package's `@branchleft/components` peer range has to survive that; and
// Changesets itself defaults to bumping a peer-dependent by a major version
// whenever its peer's version changes at all, unless
// `onlyUpdatePeerDependentsWhenOutOfRange` is set and the existing peer
// range still covers the new version. Both of those have to hold, together,
// for a components minor to leave the brand packages alone — this test
// calls the same `assembleReleasePlan`/`parse` Changesets' own CLI calls, so
// a regression in either one (or in how they interact) shows up here rather
// than only at the next real release.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assembleReleasePlan from '@changesets/assemble-release-plan';
import { parse as parseChangesetsConfig } from '@changesets/config';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readPackageJson(dir) {
  return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

function buildPackagesFixture() {
  const componentsDir = path.join(rootDir, 'packages/components');
  const branchLeftDir = path.join(rootDir, 'packages/brand-branchleft');
  const publicPressDir = path.join(rootDir, 'packages/brand-publicpress');

  return {
    root: { dir: rootDir, packageJson: readPackageJson(rootDir) },
    packages: [
      { dir: componentsDir, packageJson: readPackageJson(componentsDir) },
      { dir: branchLeftDir, packageJson: readPackageJson(branchLeftDir) },
      { dir: publicPressDir, packageJson: readPackageJson(publicPressDir) },
    ],
  };
}

function buildConfig(packages) {
  const rawConfig = JSON.parse(readFileSync(path.join(rootDir, '.changeset/config.json'), 'utf8'));
  return parseChangesetsConfig(rawConfig, packages);
}

/**
 * Runs the real Changesets release-plan assembly for a single synthetic
 * changeset bumping `@branchleft/components` by `bumpType`, using this
 * workspace's actual packages and `.changeset/config.json`.
 */
function planFor(bumpType) {
  const packages = buildPackagesFixture();
  const config = buildConfig(packages);
  const changesets = [
    {
      id: 'peer-bump-safety-probe',
      summary: 'Probe changeset — never written to disk.',
      releases: [{ name: '@branchleft/components', type: bumpType }],
    },
  ];
  return assembleReleasePlan(changesets, packages, config, undefined, undefined);
}

const BRAND_PACKAGES = ['@branchleft/brand-branchleft', '@branchleft/brand-publicpress'];

describe('a components version bump and the brand packages', () => {
  it('leaves both brand packages unreleased (or "none") on a components PATCH', () => {
    const plan = planFor('patch');
    for (const name of BRAND_PACKAGES) {
      const release = plan.releases.find((r) => r.name === name);
      expect(release === undefined || release.type === 'none').toBe(true);
    }
  });

  it('never bumps either brand package to 1.0.0 on a components MINOR', () => {
    const plan = planFor('minor');
    for (const name of BRAND_PACKAGES) {
      const release = plan.releases.find((r) => r.name === name);
      // Absent, or released at some non-major type, is fine — what must
      // never happen is Changesets deciding this is a "major" release for
      // the brand package, which is what actually produces a 1.0.0.
      expect(release?.type).not.toBe('major');
    }
  });

  it('does bump both brand packages to major on a components MAJOR (the escape hatch must still work)', () => {
    const plan = planFor('major');
    for (const name of BRAND_PACKAGES) {
      const release = plan.releases.find((r) => r.name === name);
      expect(release?.type).toBe('major');
    }
  });
});
