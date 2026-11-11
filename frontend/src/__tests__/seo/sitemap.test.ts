import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sitemap from '@/app/sitemap';
import { catalogService } from '@/services/api';
import { mockCategories, mockProducts } from '@/data/mockProducts';

describe('Next.js Dynamic Sitemap Route (sitemap.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns a promise that resolves to an array of sitemap entries', async () => {
    const entries = await sitemap();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry).toHaveProperty('url');
      expect(entry.url).toMatch(/^https?:\/\//);
    }
  });

  it('includes entries for all 6 core static pages with default baseUrl', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const requiredStaticPaths = [
      'https://varellion.com',
      'https://varellion.com/products',
      'https://varellion.com/policies/shipping',
      'https://varellion.com/policies/returns',
      'https://varellion.com/policies/terms',
      'https://varellion.com/track-order',
    ];

    for (const path of requiredStaticPaths) {
      expect(
        urls.some((u) => u === path || u === `${path}/`),
        `Expected static route "${path}" to be present in sitemap`
      ).toBe(true);
    }
  });

  it('generates category filter URLs for all active categories', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    // Default mockCategories has 'watches', 'leather-goods', 'accessories'
    for (const cat of mockCategories) {
      if (cat.isActive !== false) {
        const expectedCatUrl = `https://varellion.com/products?category=${encodeURIComponent(cat.slug)}`;
        expect(urls).toContain(expectedCatUrl);
      }
    }
  });

  it('generates dynamic product detail URLs for active products with image arrays', async () => {
    const entries = await sitemap();

    for (const product of mockProducts) {
      if (product.isActive !== false) {
        const expectedProductUrl = `https://varellion.com/products/${encodeURIComponent(product.slug)}`;
        const entry = entries.find((e) => e.url === expectedProductUrl);

        expect(
          entry,
          `Expected sitemap entry for product slug "${product.slug}"`
        ).toBeDefined();

        if (product.images && product.images.length > 0) {
          expect(entry?.images).toBeDefined();
          expect(Array.isArray(entry?.images)).toBe(true);
          expect(entry?.images?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('resolves baseUrl dynamically from NEXT_PUBLIC_SITE_URL environment variable', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.varellion.com';

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain('https://staging.varellion.com');
    expect(urls).toContain('https://staging.varellion.com/products');
    expect(urls).toContain('https://staging.varellion.com/policies/shipping');
    expect(
      urls.every((u) => u.startsWith('https://staging.varellion.com'))
    ).toBe(true);
  });

  it('resolves baseUrl dynamically from SITE_URL environment variable and strips trailing slashes', async () => {
    process.env.SITE_URL = 'https://preview.varellion.com///';

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain('https://preview.varellion.com');
    expect(urls).toContain('https://preview.varellion.com/track-order');
    expect(
      urls.some((u) => u.includes('preview.varellion.com//'))
    ).toBe(false);
  });

  it('resiliently handles backend fetch errors during build by falling back to fixtures without crashing', async () => {
    // Simulate backend connection refusal / network failure
    vi.spyOn(catalogService, 'getProducts').mockRejectedValue(
      new Error('fetch failed: ECONNREFUSED 127.0.0.1:8080')
    );
    vi.spyOn(catalogService, 'getCategories').mockRejectedValue(
      new Error('fetch failed: ECONNREFUSED 127.0.0.1:8080')
    );

    // Call sitemap() - must NOT throw
    let entries: any;
    await expect(
      (async () => {
        entries = await sitemap();
      })()
    ).resolves.not.toThrow();

    expect(Array.isArray(entries)).toBe(true);
    const urls = entries.map((e: any) => e.url);

    // All 6 static pages must still be present
    expect(urls).toContain('https://varellion.com');
    expect(urls).toContain('https://varellion.com/products');
    expect(urls).toContain('https://varellion.com/policies/shipping');
    expect(urls).toContain('https://varellion.com/policies/returns');
    expect(urls).toContain('https://varellion.com/policies/terms');
    expect(urls).toContain('https://varellion.com/track-order');

    // Fallback products and categories should still be populated from mock data
    expect(urls.some((u: string) => u.includes('/products/'))).toBe(true);
  });

  it('prioritizes core commercial pages with higher priority scores', async () => {
    const entries = await sitemap();

    const homeEntry = entries.find((e) => e.url === 'https://varellion.com');
    const catalogEntry = entries.find((e) => e.url === 'https://varellion.com/products');
    const policyEntry = entries.find((e) => e.url === 'https://varellion.com/policies/shipping');

    expect(homeEntry?.priority).toBe(1.0);
    expect(catalogEntry?.priority).toBe(0.9);
    expect(policyEntry?.priority).toBe(0.5);
  });
});
