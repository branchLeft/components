// Holds .github/workflows/publish.yml to its attestation contract: every
// package this repo publishes is packed, attested by the shared action
// pinned by commit, and only then published from that same tarball; and the
// two extra permissions the attestation needs sit on the one publishing job
// and nowhere wider. It reads the workflow as text (the file is a plain,
// fixed-indent GitHub Actions document), so a change that drops an attest
// step, widens the permissions or un-pins the action turns it red here rather
// than at the next real release, which this repo cannot rehearse.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWorkspacePackages } from './release-plan.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowText = readFileSync(path.join(rootDir, '.github/workflows/publish.yml'), 'utf8');

const ATTEST_ACTION = 'branchLeft/github-workflows/.github/actions/attest-npm-tarball';
const ATTEST_SHA = 'a2175a416b57f950fed891837f88f2d1a31e00f4';

/** Splits the workflow's one job into its steps: each starts at `      - name:`. */
export function readSteps(text) {
  const lines = text.split('\n');
  const steps = [];
  let current = null;
  for (const line of lines) {
    const start = /^ {6}- name: (.*)$/.exec(line);
    if (start) {
      current = { name: start[1].trim(), lines: [line] };
      steps.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return steps.map((step) => ({ name: step.name, body: step.lines.join('\n') }));
}

/** Reads each job's `permissions:` map (job-level, four-space indent). */
export function readJobPermissions(text) {
  const lines = text.split('\n');
  const jobs = [];
  let job = null;
  let inPermissions = false;
  let inJobs = false;
  for (const line of lines) {
    if (/^[a-z-]+:/.test(line)) inJobs = line.startsWith('jobs:');
    const jobStart = inJobs ? /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line) : null;
    if (jobStart) {
      job = { name: jobStart[1], permissions: {} };
      jobs.push(job);
      inPermissions = false;
      continue;
    }
    if (!job) continue;
    if (/^ {4}permissions:\s*$/.test(line)) {
      inPermissions = true;
      continue;
    }
    if (inPermissions) {
      const entry = /^ {6}([a-z-]+): ([a-z]+)\s*$/.exec(line);
      if (entry) {
        job.permissions[entry[1]] = entry[2];
      } else if (!/^ {6}#/.test(line) && line.trim() !== '') {
        inPermissions = false;
      }
    }
  }
  return jobs;
}

const publishablePackages = readWorkspacePackages(rootDir)
  .filter((pkg) => !pkg.private && pkg.version)
  .map((pkg) => pkg.name);

describe('publish workflow permissions', () => {
  it('has one job, holding exactly its old three scopes plus the two attestation scopes', () => {
    const jobs = readJobPermissions(workflowText);
    expect(jobs.map((job) => job.name)).toEqual(['publish']);
    expect(jobs[0].permissions).toEqual({
      contents: 'read',
      checks: 'read',
      packages: 'write',
      'id-token': 'write',
      attestations: 'write',
    });
  });
});

describe('publish workflow attestation', () => {
  const steps = readSteps(workflowText);
  const attestSteps = steps.filter((step) => step.body.includes(ATTEST_ACTION));

  it('publishes at least the three known packages', () => {
    expect(publishablePackages.sort()).toEqual([
      '@branchleft/brand-branchleft',
      '@branchleft/brand-publicpress',
      '@branchleft/components',
    ]);
  });

  it.each(publishablePackages)('has an attest step for %s on its packed tarball', (name) => {
    const short = name.replace('@branchleft/', '');
    const step = attestSteps.find((candidate) => candidate.name === `Attest ${name}`);
    expect(step, `no "Attest ${name}" step`).toBeDefined();
    expect(step.body).toContain(`tarball: \${{ steps.pack.outputs.${short} }}`);
    expect(step.body).toContain('repo: branchLeft/components');
    expect(step.body).toContain(
      'signer-workflow: branchLeft/components/.github/workflows/publish.yml'
    );
    expect(step.body).toContain('ref: ${{ github.ref }}');
  });

  it('pins every attest step by commit with a version comment', () => {
    expect(attestSteps).toHaveLength(publishablePackages.length);
    for (const step of attestSteps) {
      expect(step.body).toContain(`uses: ${ATTEST_ACTION}@${ATTEST_SHA} # v1.2.0`);
    }
  });

  it('pins every action in the workflow by a 40-character commit with a version comment', () => {
    const uses = workflowText.split('\n').filter((line) => /^\s+uses: /.test(line));
    expect(uses.length).toBeGreaterThan(0);
    for (const line of uses) {
      expect(line).toMatch(/uses: [\w./-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+/);
    }
  });

  it('attests before it publishes, and publishes only the packed tarballs', () => {
    const names = steps.map((step) => step.name);
    const publishAt = names.indexOf('Publish exactly the checked release plan');
    expect(publishAt).toBeGreaterThan(-1);
    for (const name of publishablePackages) {
      expect(names.indexOf(`Attest ${name}`)).toBeGreaterThan(
        names.indexOf('Pack exactly the checked release plan')
      );
      expect(names.indexOf(`Attest ${name}`)).toBeLessThan(publishAt);
    }
    const publish = steps[publishAt].body;
    expect(publish).toContain('pnpm publish "$tarball" --no-git-checks');
    expect(publish).not.toMatch(/-r publish/);
    for (const name of publishablePackages) {
      const id = `attest_${name.replace('@branchleft/', '').replace(/-/g, '_')}`;
      expect(publish).toContain(`\${{ steps.${id}.outcome }}`);
    }
  });

  it('keeps the credential on the publish step only, as the workflow token', () => {
    const publish = steps.find((step) => step.name === 'Publish exactly the checked release plan');
    expect(publish.body).toContain('NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    for (const step of attestSteps) {
      expect(step.body).not.toContain('NODE_AUTH_TOKEN');
      expect(step.body).not.toContain('github-token');
    }
  });
});
