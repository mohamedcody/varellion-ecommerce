import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { catalogService } from '@/services/api';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { getBaseSiteUrl } from '@/lib/url';
import ProductDetailPage, { generateMetadata } from '@/app/products/[slug]/page';
import { getCachedProduct } from '@/app/products/[slug]/getProduct';

// Mock next/navigation
const mockNotFound = vi.fn(() => {
  const err = new Error('NEXT_NOT_FOUND');
  (err as any).digest = 'NEXT_NOT_FOUND';
  throw err;
});

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone 3 Adversarial Challenge & Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ==========================================================================
     1. Catalog Breadcrumb Schema & Semantic Navigation
     ========================================================================== */
  describe('1. Catalog Breadcrumb Schema (/products)', () => {
    it('generates valid BreadcrumbList JSON-LD schema with 1-based sequential positions', () => {
      const baseUrl = getBaseSiteUrl();
      const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'الرئيسية', item: baseUrl },
        { name: 'المنتجات', item: `${baseUrl}/products` },
      ]);

      expect(breadcrumbSchema['@context']).toBe('https://schema.org');
      expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
      expect(breadcrumbSchema.itemListElement).toHaveLength(2);

      // Level 1: الرئيسية
      expect(breadcrumbSchema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: baseUrl,
      });

      // Level 2: المنتجات
      expect(breadcrumbSchema.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'المنتجات',
        item: `${baseUrl}/products`,
      });
    });

    it('generates expanded breadcrumb schema when category is selected', () => {
      const baseUrl = getBaseSiteUrl();
      const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'الرئيسية', item: baseUrl },
        { name: 'المنتجات', item: `${baseUrl}/products` },
        { name: 'ساعات فاخرة', item: `${baseUrl}/products?category=watches` },
      ]);

      expect(breadcrumbSchema.itemListElement).toHaveLength(3);
      expect(breadcrumbSchema.itemListElement[2]).toEqual({
        '@type': 'ListItem',
        position: 3,
        name: 'ساعات فاخرة',
        item: `${baseUrl}/products?category=watches`,
      });
    });
  });

  /* ==========================================================================
     2. Adversarial Challenge on getProductBySlug (Malformed Slugs)
     ========================================================================== */
  describe('2. Adversarial Challenge on getProductBySlug (URI Malformation & Resilience)', () => {
    it('safely catches URIError on single isolated percent sign "%" and returns null', async () => {
      const result = await catalogService.getProductBySlug('%');
      expect(result).toBeNull();
    });

    it('safely catches URIError on truncated UTF-8 multibyte sequence "%E0%A4%A" and returns null', async () => {
      const result = await catalogService.getProductBySlug('%E0%A4%A');
      expect(result).toBeNull();
    });

    it('safely catches URIError on consecutive percent signs "%%%" and returns null', async () => {
      const result = await catalogService.getProductBySlug('%%%');
      expect(result).toBeNull();
    });

    it('safely catches URIError on invalid hex digits in percent encoding "%ZZ" and returns null', async () => {
      const result = await catalogService.getProductBySlug('%ZZ');
      expect(result).toBeNull();
    });

    it('safely catches URIError on invalid UTF-8 start byte "%80" and returns null', async () => {
      const result = await catalogService.getProductBySlug('%80');
      expect(result).toBeNull();
    });

    it('safely handles empty string and whitespace-only slugs without throwing', async () => {
      expect(await catalogService.getProductBySlug('')).toBeNull();
      expect(await catalogService.getProductBySlug('   ')).toBeNull();
      expect(await catalogService.getProductBySlug(null as unknown as string)).toBeNull();
      expect(await catalogService.getProductBySlug(undefined as unknown as string)).toBeNull();
    });

    it('correctly decodes valid percent-encoded Arabic slugs without error', async () => {
      // "ساعة" URL-encoded is "%D8%B3%D8%A7%D8%B9%D8%A9"
      const encodedArabicSlug = '%D8%B3%D8%A7%D8%B9%D8%A9';
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as any);

      const result = await catalogService.getProductBySlug(encodedArabicSlug);
      expect(result).toBeNull();
      fetchSpy.mockRestore();
    });
  });

  /* ==========================================================================
     3. PDP SSR Route Resilience against Malformed Slugs
     ========================================================================== */
  describe('3. PDP SSR Route Resilience (No 500 on Malformed Slug)', () => {
    it('generateMetadata returns safe no-index fallback on malformed slug "%"', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: '%' }),
      });

      expect(metadata.title).toBe('المنتج غير متوفر | VARELLION');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('generateMetadata returns safe no-index fallback on malformed slug "%E0%A4%A"', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: '%E0%A4%A' }),
      });

      expect(metadata.title).toBe('المنتج غير متوفر | VARELLION');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('ProductDetailPage triggers notFound() on malformed slug "%" without throwing 500 error', async () => {
      mockNotFound.mockClear();

      await expect(
        ProductDetailPage({
          params: Promise.resolve({ slug: '%' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it('ProductDetailPage triggers notFound() on malformed slug "%%%" without throwing 500 error', async () => {
      mockNotFound.mockClear();

      await expect(
        ProductDetailPage({
          params: Promise.resolve({ slug: '%%%' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });
  });
});
