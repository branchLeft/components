import { describe, expect, it, vi } from 'vitest';
import { pathToFileURL } from 'node:url';
import {
  compareReleaseSets,
  isEntryPoint,
  isPublishedOnRegistry,
  parseReleaseTagMessage,
  selectPackagesToPublish,
} from './release-plan.mjs';

describe('selectPackagesToPublish', () => {
  it('publishes a package the registry lookup reports as unpublished', async () => {
    const pkg = { name: '@branchleft/components', version: '0.4.0', private: false };
    const isPublished = vi.fn().mockResolvedValue(false);

    const result = await selectPackagesToPublish([pkg], isPublished);

    expect(result).toEqual([pkg]);
    expect(isPublished).toHaveBeenCalledWith(pkg);
  });

  it('skips a package the registry lookup reports as already published', async () => {
    const pkg = { name: '@branchleft/components', version: '0.3.0', private: false };
    const isPublished = vi.fn().mockResolvedValue(true);

    const result = await selectPackagesToPublish([pkg], isPublished);

    expect(result).toEqual([]);
  });

  it('fails rather than skips when the registry lookup itself errors', async () => {
    const pkg = { name: '@branchleft/brand-branchleft', version: '0.1.0', private: false };
    const isPublished = vi
      .fn()
      .mockRejectedValue(new Error('registry lookup for X failed: HTTP 500'));

    await expect(selectPackagesToPublish([pkg], isPublished)).rejects.toThrow(
      'registry lookup for X failed'
    );
  });

  it('never looks up or publishes a private or unversioned workspace member', async () => {
    const privatePkg = {
      name: 'branchleft-components-workspace',
      version: '0.0.0',
      private: true,
    };
    const unversionedPkg = { name: '@branchleft/unversioned', version: undefined, private: false };
    const publishable = { name: '@branchleft/brand-publicpress', version: '0.1.0', private: false };
    const isPublished = vi.fn().mockResolvedValue(false);

    const result = await selectPackagesToPublish(
      [privatePkg, unversionedPkg, publishable],
      isPublished
    );

    expect(result).toEqual([publishable]);
    expect(isPublished).toHaveBeenCalledTimes(1);
    expect(isPublished).toHaveBeenCalledWith(publishable);
  });
});

describe('isPublishedOnRegistry', () => {
  const opts = (fetchImpl) => ({ registry: 'https://npm.pkg.github.com', token: 't', fetchImpl });

  it('returns false on a 404 (the package name has never been published)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 404, ok: false });

    await expect(
      isPublishedOnRegistry('@branchleft/components', '0.4.0', opts(fetchImpl))
    ).resolves.toBe(false);
  });

  it('returns true on a 200 whose versions map includes the version', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ versions: { '0.3.0': {}, '0.4.0': {} } }),
    });

    await expect(
      isPublishedOnRegistry('@branchleft/components', '0.4.0', opts(fetchImpl))
    ).resolves.toBe(true);
  });

  it('returns false on a 200 whose versions map excludes the version', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ versions: { '0.3.0': {} } }),
    });

    await expect(
      isPublishedOnRegistry('@branchleft/components', '0.4.0', opts(fetchImpl))
    ).resolves.toBe(false);
  });

  it('throws on a 403 (auth failure) rather than treating it as unpublished', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 403, ok: false });

    await expect(
      isPublishedOnRegistry('@branchleft/components', '0.4.0', opts(fetchImpl))
    ).rejects.toThrow('HTTP 403');
  });

  it('throws on a 500 rather than treating it as unpublished', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 500, ok: false });

    await expect(
      isPublishedOnRegistry('@branchleft/components', '0.4.0', opts(fetchImpl))
    ).rejects.toThrow('HTTP 500');
  });

  it('throws on a network error rather than treating it as unpublished', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    await expect(
      isPublishedOnRegistry('@branchleft/components', '0.4.0', opts(fetchImpl))
    ).rejects.toThrow('registry lookup for @branchleft/components failed');
  });
});

describe('parseReleaseTagMessage', () => {
  it('parses one name@version per line and ignores the subject/blank lines', () => {
    const message = [
      'v0.5.0',
      '',
      '@branchleft/brand-branchleft@0.1.1',
      '@branchleft/brand-publicpress@0.1.1',
      '',
    ].join('\n');

    expect(parseReleaseTagMessage(message)).toEqual([
      { name: '@branchleft/brand-branchleft', version: '0.1.1' },
      { name: '@branchleft/brand-publicpress', version: '0.1.1' },
    ]);
  });

  it('returns an empty list for a message with no release lines', () => {
    expect(parseReleaseTagMessage('v0.5.0\n\nchore release\n')).toEqual([]);
  });
});

describe('compareReleaseSets', () => {
  it('is ok when the tag message matches the computed release set exactly', () => {
    const set = [{ name: '@branchleft/components', version: '0.4.0' }];

    const result = compareReleaseSets(set, set);

    expect(result).toEqual({ ok: true, missingFromTag: [], extraInTag: [] });
  });

  it('flags a package the tag message names that is not actually due for release', () => {
    const expected = [{ name: '@branchleft/components', version: '0.4.0' }];

    const result = compareReleaseSets(expected, []);

    expect(result.ok).toBe(false);
    expect(result.extraInTag).toEqual(expected);
    expect(result.missingFromTag).toEqual([]);
  });

  it('flags a package that is due for release but missing from the tag message', () => {
    const actual = [{ name: '@branchleft/brand-branchleft', version: '0.1.1' }];

    const result = compareReleaseSets([], actual);

    expect(result.ok).toBe(false);
    expect(result.missingFromTag).toEqual(actual);
    expect(result.extraInTag).toEqual([]);
  });

  it('is ok when both the tag message and the release set are empty', () => {
    const result = compareReleaseSets([], []);

    expect(result).toEqual({ ok: true, missingFromTag: [], extraInTag: [] });
  });
});

describe('isEntryPoint', () => {
  it('is true when the module URL matches the invoked script path', () => {
    expect(
      isEntryPoint('file:///repo/scripts/release-plan.mjs', '/repo/scripts/release-plan.mjs')
    ).toBe(true);
  });

  it('is true for a path needing URL-encoding (e.g. a space) — the trap the naive check misses', () => {
    const argv1 = '/Users/rob/branch Left/scripts/release-plan.mjs';
    const metaUrl = pathToFileURL(argv1).href;

    expect(isEntryPoint(metaUrl, argv1)).toBe(true);
    // The naive `` `file://${argv1}` `` string this replaces never encodes
    // the space, so it would NOT match `metaUrl` here — that mismatch is
    // exactly the silent no-op this function fixes.
    expect(`file://${argv1}`).not.toBe(metaUrl);
  });

  it('is false for a different script path', () => {
    expect(isEntryPoint('file:///repo/scripts/other.mjs', '/repo/scripts/release-plan.mjs')).toBe(
      false
    );
  });

  it('is false when no argv1 is given (e.g. imported, not run)', () => {
    expect(isEntryPoint('file:///repo/scripts/release-plan.mjs', undefined)).toBe(false);
  });
});
