import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import robots from '@/app/robots';
import { metadata as rootMetadata } from '@/app/layout';
import { metadata as homeMetadata } from '@/app/page';
import { generateMetadata as generateCatalogMetadata } from '@/app/products/page';
import { metadata as shippingMetadata } from '@/app/policies/shipping/page';
import { metadata as returnsMetadata } from '@/app/policies/returns/page';
import { metadata as termsMetadata } from '@/app/policies/terms/page';
import { metadata as trackOrderMetadata } from '@/app/track-order/layout';
import { metadata as loginMetadata } from '@/app/login/layout';
import { metadata as registerMetadata } from '@/app/register/layout';
import { metadata as checkoutMetadata } from '@/app/checkout/layout';
import { metadata as profileMetadata } from '@/app/profile/layout';
import { metadata as adminMetadata } from '@/app/admin/layout';
import { buildOrganizationSchema, buildProductSchema } from '@/lib/seo/schema';
import { catalogService } from '@/services/api';
import { mockCategories, mockProducts } from '@/data/mockProducts';
import { FREE_SHIPPING_THRESHOLD } from '@/data/shippingZones';

function resolveProjectFile(...segments: string[]): string {
  const candidates = [
    path.resolve(process.cwd(), ...segments),
    path.resolve(process.cwd(), '..', ...segments),
    path.resolve(__dirname, '../../../..', ...segments),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`Could not locate file: ${segments.join('/')}`);
  }
  return found;
}

describe('SEO Hardening & Production Readiness Suite (seo-hardening.test.tsx)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Static Brand & Fallback Assets (No 404s)', () => {
    const requiredAssets = ['favicon.ico', 'logo.png', 'og-default.png', 'placeholder-product.jpg'];

    for (const asset of requiredAssets) {
      it(`ships non-empty frontend/public/${asset}`, () => {
        const assetPath = resolveProjectFile('frontend', 'public', asset);
        const stat = fs.statSync(assetPath);
        expect(stat.size).toBeGreaterThan(1000);
      });
    }
  });

  describe('2. Crawler Controls (robots.ts & Private Route noindex)', () => {
    it('disallows /api and /actuator and explicitly covers Claude-User in robots.ts', () => {
      const config = robots();
      const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
      const allAgents = rules.flatMap((r) => (Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]));
      const allDisallows = rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : [r.disallow]));

      expect(allAgents).toContain('Claude-User');
      expect(allDisallows).toContain('/api');
      expect(allDisallows).toContain('/api/*');
      expect(allDisallows).toContain('/actuator');
      expect(allDisallows).toContain('/actuator/*');
    });

    it('sets noindex, nofollow metadata on private/auth route layouts', () => {
      const privateLayouts = [
        { name: 'login', meta: loginMetadata },
        { name: 'register', meta: registerMetadata },
        { name: 'checkout', meta: checkoutMetadata },
        { name: 'profile', meta: profileMetadata },
        { name: 'admin', meta: adminMetadata },
      ];

      for (const { name, meta } of privateLayouts) {
        expect(meta.robots, `${name} layout must disable indexing`).toEqual({
          index: false,
          follow: false,
        });
        expect(String(meta.title)).toContain('VARELLION');
      }
    });
  });

  describe('3. Canonical URLs, OpenGraph & Dynamic Catalog Metadata', () => {
    it('configures OpenGraph, Twitter, and robots defaults in RootLayout and canonical on Homepage', () => {
      expect(rootMetadata.openGraph).toBeDefined();
      expect(rootMetadata.twitter).toBeDefined();
      expect(rootMetadata.robots).toBeDefined();
      expect(homeMetadata.alternates?.canonical).toBe('https://varellion.com');
    });

    it('configures canonical URLs and OpenGraph on public policy and track-order pages', () => {
      expect(shippingMetadata.alternates?.canonical).toBe('https://varellion.com/policies/shipping');
      expect(returnsMetadata.alternates?.canonical).toBe('https://varellion.com/policies/returns');
      expect(termsMetadata.alternates?.canonical).toBe('https://varellion.com/policies/terms');
      expect(trackOrderMetadata.alternates?.canonical).toBe('https://varellion.com/track-order');

      expect(shippingMetadata.openGraph).toBeDefined();
      expect(returnsMetadata.openGraph).toBeDefined();
      expect(termsMetadata.openGraph).toBeDefined();
      expect(trackOrderMetadata.openGraph).toBeDefined();
    });

    it('generates distinct metadata for default catalog, category, featured, and search queries', async () => {
      vi.spyOn(catalogService, 'getCategories').mockResolvedValue(mockCategories);

      const defaultMeta = await generateCatalogMetadata({ searchParams: Promise.resolve({}) });
      expect(String(defaultMeta.title)).toContain('الكتالوج الفاخر');
      expect(defaultMeta.alternates?.canonical).toBe('https://varellion.com/products');

      const watchesMeta = await generateCatalogMetadata({
        searchParams: Promise.resolve({ category: 'watches' }),
      });
      expect(String(watchesMeta.title)).toContain(mockCategories[0].nameAr);
      expect(watchesMeta.alternates?.canonical).toBe('https://varellion.com/products?category=watches');

      const featuredMeta = await generateCatalogMetadata({
        searchParams: Promise.resolve({ featured: 'true' }),
      });
      expect(String(featuredMeta.title)).toContain('عروض حصرية');
      expect(featuredMeta.alternates?.canonical).toBe('https://varellion.com/products?featured=true');

      const searchMeta = await generateCatalogMetadata({
        searchParams: Promise.resolve({ search: 'كرونوغراف' }),
      });
      expect(String(searchMeta.title)).toContain('كرونوغراف');
      expect(searchMeta.robots).toEqual({ index: false, follow: true });
      expect(searchMeta.alternates?.canonical).toBe('https://varellion.com/products');
    });
  });

  describe('4. Structured Data Compliance (Logo, Shipping Parity & Return Policy)', () => {
    it('uses valid PNG Organization logo and includes 14-day MerchantReturnPolicy in Product schema', () => {
      const org = buildOrganizationSchema('https://varellion.com');
      expect(org.logo).toBe('https://varellion.com/logo.png');

      const standardProduct = { ...mockProducts[0], price: 1500 };
      const standardSchema = buildProductSchema(standardProduct, 'https://varellion.com');
      expect(standardSchema.offers.shippingDetails.shippingRate.value).toBe(50);
      expect(standardSchema.offers.hasMerchantReturnPolicy).toMatchObject({
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'EG',
        merchantReturnDays: 14,
      });

      const freeShippingProduct = { ...mockProducts[0], price: FREE_SHIPPING_THRESHOLD };
      const freeSchema = buildProductSchema(freeShippingProduct, 'https://varellion.com');
      expect(freeSchema.offers.shippingDetails.shippingRate.value).toBe(0);
    });
  });

  describe('5. Semantic HTML & Production Infrastructure Guards', () => {
    it('contains no nested <main> landmarks inside sub-pages', () => {
      const subPages = [
        ['frontend', 'src', 'app', 'policies', 'shipping', 'page.tsx'],
        ['frontend', 'src', 'app', 'policies', 'returns', 'page.tsx'],
        ['frontend', 'src', 'app', 'policies', 'terms', 'page.tsx'],
        ['frontend', 'src', 'app', 'track-order', 'page.tsx'],
        ['frontend', 'src', 'app', 'checkout', 'page.tsx'],
      ];

      for (const segments of subPages) {
        const content = fs.readFileSync(resolveProjectFile(...segments), 'utf-8');
        expect(content, `${segments.join('/')} must not render nested <main>`).not.toMatch(/<main[\s>]/);
      }
    });

    it('configures INTERNAL_API_URL in compose.prod.yml and HSTS + API X-Robots-Tag in nginx.conf', () => {
      const compose = fs.readFileSync(resolveProjectFile('compose.prod.yml'), 'utf-8');
      expect(compose).toContain('INTERNAL_API_URL');
      expect(compose).toContain('http://backend:8080/api');
      expect(compose).toContain('NEXT_PUBLIC_SITE_URL');

      const nginx = fs.readFileSync(resolveProjectFile('nginx.conf'), 'utf-8');
      expect(nginx).toContain('Strict-Transport-Security');
      expect(nginx).toContain('X-Robots-Tag "noindex, nofollow"');
    });
  });
});
