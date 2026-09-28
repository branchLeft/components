import { describe, expect, it, vi } from 'vitest';
import { selectPackagesToPublish } from './publish-workspace-packages.mjs';

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
