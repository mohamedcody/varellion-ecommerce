import type { MetadataRoute } from 'next';
import { catalogService } from '@/services/api';
import { mockCategories, mockProducts } from '@/data/mockProducts';
import { getBaseSiteUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

const STATIC_POLICY_LAST_MODIFIED = new Date('2026-11-01T00:00:00Z');

function parseValidDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Next.js 15 Dynamic Sitemap Route
 * Generates an XML sitemap covering core static routes, category filter routes,
 * and individual product detail routes with product images.
 * Built with resilient error handling: falls back to embedded catalog fixtures
 * when the Spring Boot backend is offline during production builds.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseSiteUrl();

  let products = mockProducts;
  let categories = mockCategories;

  try {
    const [productRes, categoryRes] = await Promise.all([
      catalogService.getProducts({ limit: 200 }),
      catalogService.getCategories(),
    ]);

    if (productRes && productRes.products && productRes.products.length > 0) {
      products = productRes.products;
    }
    if (categoryRes && categoryRes.length > 0) {
      categories = categoryRes;
    }
  } catch (_error) {
    // Graceful offline fallback during static build pre-rendering
  }

  // Derive latest catalog update timestamp from real product records
  const latestCatalogDate = products.reduce<Date>((latest, product) => {
    const candidate = parseValidDate(product.updatedAt) || parseValidDate(product.createdAt);
    return candidate && candidate > latest ? candidate : latest;
  }, STATIC_POLICY_LAST_MODIFIED);

  // 1. Static Core Route Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: latestCatalogDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: latestCatalogDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/policies/shipping`,
      lastModified: STATIC_POLICY_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/returns`,
      lastModified: STATIC_POLICY_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/terms`,
      lastModified: STATIC_POLICY_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: STATIC_POLICY_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 2. Category Query Filter Routes
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((cat) => cat.isActive !== false)
    .map((cat) => ({
      url: `${baseUrl}/products?category=${encodeURIComponent(cat.slug)}`,
      lastModified: latestCatalogDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // 3. Dynamic Product Detail Routes
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((product) => product.isActive !== false)
    .map((product) => {
      const imageUrls = product.images
        ? product.images.map((img) => img.imageUrl).filter(Boolean)
        : [];
      const productLastMod =
        parseValidDate(product.updatedAt) ||
        parseValidDate(product.createdAt) ||
        latestCatalogDate;

      return {
        url: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
        lastModified: productLastMod,
        changeFrequency: 'weekly',
        priority: 0.8,
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
      };
    });

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
