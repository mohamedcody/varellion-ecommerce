import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { catalogService } from '@/services/api';
import { mockCategories } from '@/data/mockProducts';
import { Category, Product } from '@/types';
import { getBaseSiteUrl } from '@/lib/url';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductsCatalogClient } from './ProductsCatalogClient';

export interface ProductsPageSearchParams {
  category?: string;
  search?: string;
  q?: string;
  featured?: string;
}

export interface ProductsPageProps {
  searchParams?: Promise<ProductsPageSearchParams>;
}

const PAGE_SIZE = 20;

async function resolveCategoriesSafe(): Promise<Category[]> {
  try {
    const categories = await catalogService.getCategories();
    if (categories && categories.length > 0) {
      return categories;
    }
  } catch {
    // Graceful fallback to embedded categories when backend is unreachable
  }
  return mockCategories;
}

/**
 * Next.js 15 Dynamic SEO Metadata for Catalog, Category, Featured, and Search Views
 */
export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = (await searchParams) || {};
  const baseUrl = getBaseSiteUrl();
  const rawCategory = typeof params.category === 'string' ? params.category.trim() : '';
  const rawSearch =
    (typeof params.search === 'string' ? params.search.trim() : '') ||
    (typeof params.q === 'string' ? params.q.trim() : '');
  const isFeatured = params.featured === 'true';

  if (rawSearch) {
    const title = `نتائج البحث عن "${rawSearch}" | VARELLION`;
    const description = `تصفح نتائج البحث عن ${rawSearch} في متجر VARELLION للساعات الفاخرة والجلود الطبيعية في مصر.`;
    return {
      title,
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: `${baseUrl}/products` },
    };
  }

  if (rawCategory && rawCategory !== 'all') {
    const categories = await resolveCategoriesSafe();
    const matched = categories.find((c) => c.slug === rawCategory);
    const categoryName = matched?.nameAr || rawCategory;
    const canonicalUrl = `${baseUrl}/products?category=${encodeURIComponent(rawCategory)}`;
    const title = `${categoryName} | كتالوج VARELLION الفاخر`;
    const description =
      matched?.descriptionAr ||
      `تسوق تشكيلة ${categoryName} الأصلية من VARELLION في مصر مع معاينة كاملة قبل الاستلام وشحن لـ 27 محافظة.`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'VARELLION',
        locale: 'ar_EG',
        type: 'website',
        images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: categoryName }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${baseUrl}/og-default.png`],
      },
    };
  }

  if (isFeatured) {
    const canonicalUrl = `${baseUrl}/products?featured=true`;
    const title = 'عروض حصرية والقطع الأكثر طلباً | VARELLION';
    const description =
      'اكتشف العروض الحصرية والقطع الأكثر طلباً من ساعات VARELLION الفاخرة والمحافظ الجلدية الطبيعية 100% في مصر.';
    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'VARELLION',
        locale: 'ar_EG',
        type: 'website',
        images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${baseUrl}/og-default.png`],
      },
    };
  }

  const canonicalUrl = `${baseUrl}/products`;
  const title = 'الكتالوج الفاخر — ساعات ومحافظ جلد طبيعي وإكسسوارات | VARELLION';
  const description =
    'تصفح كتالوج VARELLION الكامل للساعات الرجالية الفاخرة، المحافظ الجلدية الطبيعية 100% بحماية RFID، والإكسسوارات الراقية في مصر مع معاينة قبل الاستلام.';

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'VARELLION',
      locale: 'ar_EG',
      type: 'website',
      images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-default.png`],
    },
  };
}

/**
 * Server-Side Rendered Catalog Page (/products)
 * Delivers complete indexable HTML for search crawlers and AI agents while hydrating
 * interactive client-side filtering, sorting, and pagination.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) || {};
  const initialCategory = typeof params.category === 'string' && params.category.trim() ? params.category.trim() : 'all';
  const initialSearch =
    (typeof params.search === 'string' ? params.search.trim() : '') ||
    (typeof params.q === 'string' ? params.q.trim() : '');
  const initialFeatured = params.featured === 'true';

  let initialProducts: Product[] = [];
  let initialTotal = 0;
  let initialCategories: Category[] = [];
  let initialError: string | null = null;

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      catalogService.getProducts({
        categorySlug: initialCategory === 'all' ? undefined : initialCategory,
        searchQuery: initialSearch || undefined,
        isFeatured: initialFeatured || undefined,
        sortBy: 'bestseller',
        page: 0,
        limit: PAGE_SIZE,
      }),
      catalogService.getCategories(),
    ]);
    initialProducts = productsRes.products;
    initialTotal = productsRes.total;
    initialCategories = categoriesRes;
  } catch (err) {
    console.error('[ProductsPage SSR] Failed to prefetch catalog:', err);
    initialCategories = mockCategories;
    initialError = 'تعذر الاتصال بالخادم لتحميل المنتجات. يرجى التحقق من الاتصال وإعادة المحاولة.';
  }

  const baseUrl = getBaseSiteUrl();
  const activeCategoryObj =
    initialCategory !== 'all'
      ? initialCategories.find((c) => c.slug === initialCategory)
      : undefined;

  const breadcrumbItems = [
    { name: 'الرئيسية', item: baseUrl },
    { name: 'المنتجات', item: `${baseUrl}/products` },
  ];

  if (activeCategoryObj) {
    breadcrumbItems.push({
      name: activeCategoryObj.nameAr,
      item: `${baseUrl}/products?category=${encodeURIComponent(activeCategoryObj.slug)}`,
    });
  } else if (initialFeatured) {
    breadcrumbItems.push({
      name: 'عروض حصرية',
      item: `${baseUrl}/products?featured=true`,
    });
  }

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="catalog-breadcrumbs-schema" />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-20 text-center max-w-7xl">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
            <p className="text-xs text-muted-foreground mt-3">جارٍ تحميل الكتالوج…</p>
          </div>
        }
      >
        <ProductsCatalogClient
          initialProducts={initialProducts}
          initialTotal={initialTotal}
          initialCategories={initialCategories}
          initialCategory={initialCategory}
          initialSearch={initialSearch}
          initialFeatured={initialFeatured}
          initialError={initialError}
        />
      </Suspense>
    </>
  );
}
