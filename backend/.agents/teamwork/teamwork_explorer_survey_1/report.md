# Comprehensive Survey Report: R1 — AI Discovery & Crawlability Foundations

**Target Workspace**: `/home/mohamed-saad/Desktop/BRAND`  
**Explorer Agent**: `teamwork_explorer_survey_1`  
**Milestone**: R1 (AI Discovery & Crawlability Foundations)  
**Date**: November 10, 2026  
**Status**: Complete & Verified  

---

## 1. Executive Summary

This investigation surveys and maps the exact requirements, technical constraints, and implementation artifacts for **R1: AI Discovery & Crawlability Foundations** of the VARELLION luxury e-commerce platform.

The VARELLION frontend is built on **Next.js 15.2.1 (App Router)** and **React 19.0.0** with TypeScript 5.8.2 and Tailwind CSS 4.0.9. All 18 existing test suites (79 tests) and production build are currently passing. This report defines:
1. The exact implementation of `frontend/src/app/robots.ts` targeting search and AI bots (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `*`) while shielding private paths (`/admin`, `/checkout`, `/profile`).
2. The dynamic generation logic for `frontend/src/app/sitemap.ts` covering static routes, category filters, and dynamic product URLs, including build-time offline resilience against backend `ECONNREFUSED` failures.
3. Centralized site URL resolution via `NEXT_PUBLIC_SITE_URL` / `SITE_URL` with fallback to `https://varellion.com`.
4. The exact, production-ready content for `frontend/public/llms.txt` structured according to [llmstxt.org] and brand specifications (Egyptian Pound pricing, 27 governorates delivery, Cash on Delivery, and free inspection before payment: "معاينة وفحص قبل الاستلام").

---

## 2. Environment & Dependencies Survey

### 2.1 Package & Toolchain Specifications
Inspected from `frontend/package.json`:
- **Framework**: Next.js `^15.2.1` (App Router architecture, running Next.js 15.5.28 at runtime)
- **UI Library**: React `^19.0.0` / React DOM `^19.0.0`
- **Language**: TypeScript `^5.8.2`
- **Styling**: Tailwind CSS `^4.0.9` (`@tailwindcss/postcss: ^4.0.9`, `postcss: ^8.5.3`, `tailwind-merge: ^3.0.2`, `clsx: ^2.1.1`)
- **Icons**: `lucide-react: ^1.16.0`
- **Testing**: Vitest `^5.0.5`, `@testing-library/react: ^16.3.3`, `jsdom: ^30.1.3`
- **Next Config (`next.config.ts`)**:
  - `output: 'standalone'`
  - `reactStrictMode: true`
  - Remote image patterns allowed: `images.unsplash.com`, `*.supabase.co`, `localhost`, `127.0.0.1`

### 2.2 Baseline Health Check
- **Production Build (`npm --prefix frontend run build`)**: Exited with code 0. Generated 18 static/dynamic routes.
- **Test Suite (`npm --prefix frontend test`)**: Exited with code 0. 18 test files, 79 tests passed.

---

## 3. Environment Variables & URL Resolution

### 3.1 Current Status
- Inspected `.env.example` and `.env.local`:
  - `NEXT_PUBLIC_API_URL=http://localhost:8080/api`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=1003559537454-c93rrfj1ka0pjabj10g02eado3c9r2jg.apps.googleusercontent.com`
  - `NEXT_PUBLIC_USE_MOCK_API=false`
  - `NEXT_PUBLIC_SUPPORT_PHONE=+20 100 000 0000`
  - `NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/201000000000`
- Neither `NEXT_PUBLIC_SITE_URL` nor `SITE_URL` is currently present in `.env.example`, `.env.local`, or the source code.
- No existing helper function exists for base URL resolution.

### 3.2 Recommended Base URL Helper
To ensure consistent URL resolution across `robots.ts`, `sitemap.ts`, `layout.tsx` (`metadataBase`), dynamic metadata in PDP `generateMetadata`, and JSON-LD structured data:

Create `frontend/src/lib/url.ts` (or add to `frontend/src/config/site.ts` and `frontend/src/lib/utils.ts`):
```typescript
/**
 * Resolves the canonical base site URL from environment variables
 * with fallback to production domain 'https://varellion.com'.
 * Strips any trailing slashes to avoid double-slash URL construction.
 */
export function getBaseSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com';
  return envUrl.trim().replace(/\/+$/, '');
}
```

In `frontend/src/config/site.ts`:
```typescript
import { getBaseSiteUrl } from '@/lib/url';

export const siteConfig = {
  name: 'VARELLION',
  fullName: 'VARELLION Accessories',
  url: getBaseSiteUrl(),
  ...
};
```

In `.env.example` and `.env.local`, append:
```env
# Canonical Site Base URL (used for robots.txt, sitemap.xml, canonical tags, and OpenGraph)
NEXT_PUBLIC_SITE_URL=https://varellion.com
SITE_URL=https://varellion.com
```

---

## 4. Routing Inventory & Crawlability Classification

The application contains 16 distinct route paths under `frontend/src/app`:

| Route Path | Type | Component File | Crawlability / Robots Rule | Sitemap Inclusion |
|---|---|---|---|---|
| `/` | Static (Server Component) | `frontend/src/app/page.tsx` | Allow (`/`) | **Yes** (Priority: 1.0, daily) |
| `/products` | Catalog (Client Component) | `frontend/src/app/products/page.tsx` | Allow (`/`) | **Yes** (Priority: 0.9, daily) |
| `/policies/shipping` | Policy (Server Component) | `frontend/src/app/policies/shipping/page.tsx` | Allow (`/`) | **Yes** (Priority: 0.5, monthly) |
| `/policies/returns` | Policy (Server Component) | `frontend/src/app/policies/returns/page.tsx` | Allow (`/`) | **Yes** (Priority: 0.5, monthly) |
| `/policies/terms` | Policy (Server Component) | `frontend/src/app/policies/terms/page.tsx` | Allow (`/`) | **Yes** (Priority: 0.5, monthly) |
| `/track-order` | Utility (Client Component) | `frontend/src/app/track-order/page.tsx` | Allow (`/`) | **Yes** (Priority: 0.6, monthly) |
| `/products/[slug]` | Dynamic PDP (Currently Client, targeted for SSR in R2) | `frontend/src/app/products/[slug]/page.tsx` | Allow (`/`) | **Yes** (Priority: 0.8, weekly per product) |
| `/products?category=watches` | Virtual Category Filter | Filter query on `/products` | Allow (`/`) | **Yes** (Priority: 0.8, weekly) |
| `/products?category=leather-goods` | Virtual Category Filter | Filter query on `/products` | Allow (`/`) | **Yes** (Priority: 0.8, weekly) |
| `/products?category=accessories` | Virtual Category Filter | Filter query on `/products` | Allow (`/`) | **Yes** (Priority: 0.8, weekly) |
| `/admin` | Private / Backoffice | `frontend/src/app/admin/page.tsx` | **Disallow** (`/admin`, `/admin/*`) | No |
| `/admin/orders` | Private / Backoffice | `frontend/src/app/admin/orders/page.tsx` | **Disallow** (`/admin`, `/admin/*`) | No |
| `/checkout` | Private / Transactional | `frontend/src/app/checkout/page.tsx` | **Disallow** (`/checkout`, `/checkout/*`) | No |
| `/checkout/callback` | Private / Transactional | `frontend/src/app/checkout/callback/page.tsx` | **Disallow** (`/checkout`, `/checkout/*`) | No |
| `/checkout/mock-paymob` | Private / Transactional | `frontend/src/app/checkout/mock-paymob/page.tsx` | **Disallow** (`/checkout`, `/checkout/*`) | No |
| `/checkout/success` | Private / Transactional | `frontend/src/app/checkout/success/page.tsx` | **Disallow** (`/checkout`, `/checkout/*`) | No |
| `/profile` | Private / Customer Account | `frontend/src/app/profile/page.tsx` | **Disallow** (`/profile`, `/profile/*`) | No |
| `/login` | Public Auth | `frontend/src/app/login/page.tsx` | Allow (or disallow from search index via meta robots) | No (sitemap focuses on indexable content) |
| `/register` | Public Auth | `frontend/src/app/register/page.tsx` | Allow (or disallow from search index via meta robots) | No |

---

## 5. Dynamic Data Fetching & Build Resilience for `sitemap.ts`

### 5.1 Service Capabilities in `frontend/src/services/api.ts`
- `catalogService.getCategories(): Promise<Category[]>`
  - Fetches `/categories` from backend API or returns `mockCategories` if `USE_MOCK` is true.
  - Returns category metadata including `slug` (`watches`, `leather-goods`, `accessories`).
- `catalogService.getProducts(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }>`
  - Fetches `/products` with limit, category, and sorting.
  - Can fetch all active products (e.g. `catalogService.getProducts({ limit: 100 })`).
  - Returns `slug`, `images`, `createdAt`, `isActive`.

### 5.2 Critical Build Resilience Finding
During `next build`, Next.js compiles and pre-renders static and metadata routes.
In environments where the Spring Boot backend (`http://localhost:8080/api`) is offline (such as CI/CD, Docker image builds, or frontend-only dev sessions):
- The `fetchApi` function throws `TypeError: fetch failed (connect ECONNREFUSED 127.0.0.1:8080)`.
- In `frontend/src/app/page.tsx`, this is caught gracefully via `try/catch`.
- **CRITICAL REQUIREMENT**: `frontend/src/app/sitemap.ts` **MUST** enclose its API calls in a `try/catch` block and fall back to `mockProducts` and `mockCategories` from `@/data/mockProducts`.
If unhandled, `next build` will throw a fatal error and terminate the build process!

### 5.3 Concrete Sitemap Data Source Structure
```typescript
import { MetadataRoute } from 'next';
import { catalogService } from '@/services/api';
import { mockCategories, mockProducts } from '@/data/mockProducts';
import { getBaseSiteUrl } from '@/lib/url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseSiteUrl();

  let products = mockProducts;
  let categories = mockCategories;

  try {
    const [prodResult, catResult] = await Promise.all([
      catalogService.getProducts({ limit: 200 }),
      catalogService.getCategories(),
    ]);
    if (prodResult.products && prodResult.products.length > 0) {
      products = prodResult.products;
    }
    if (catResult && catResult.length > 0) {
      categories = catResult;
    }
  } catch (err) {
    // Graceful fallback to embedded fixtures when backend is not running during build
    console.warn('[sitemap] Backend unreachable during sitemap generation, using mock fixtures.');
  }

  // 1. Static Pages
  // 2. Category Pages
  // 3. Product Pages
  ...
}
```

---

## 6. Next.js 15 App Router Metadata Specifications

Verified against `frontend/node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts`:

### 6.1 `frontend/src/app/robots.ts`
Type: `MetadataRoute.Robots`
Next.js 15 type signature:
```typescript
type RobotsFile = {
  rules: {
    userAgent?: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
    crawlDelay?: number;
  } | Array<{
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
    crawlDelay?: number;
  }>;
  sitemap?: string | string[];
  host?: string;
};
```

Exact proposed code for `frontend/src/app/robots.ts`:
```typescript
import type { MetadataRoute } from 'next';
import { getBaseSiteUrl } from '@/lib/url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();

  return {
    rules: [
      {
        userAgent: [
          'OAI-SearchBot',
          'PerplexityBot',
          'Claude-SearchBot',
          'Google-Extended',
          '*',
        ],
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/checkout',
          '/checkout/*',
          '/profile',
          '/profile/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### 6.2 `frontend/src/app/sitemap.ts`
Type: `MetadataRoute.Sitemap`
Next.js 15 type signature:
```typescript
type SitemapFile = Array<{
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: Record<string, string>;
  };
  images?: string[];
  videos?: Videos[];
}>;
```

Exact proposed code for `frontend/src/app/sitemap.ts`:
```typescript
import type { MetadataRoute } from 'next';
import { catalogService } from '@/services/api';
import { mockCategories, mockProducts } from '@/data/mockProducts';
import { getBaseSiteUrl } from '@/lib/url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseSiteUrl();
  const currentDate = new Date();

  let products = mockProducts;
  let categories = mockCategories;

  try {
    const [productRes, categoryRes] = await Promise.all([
      catalogService.getProducts({ limit: 200 }),
      catalogService.getCategories(),
    ]);
    if (productRes.products && productRes.products.length > 0) {
      products = productRes.products;
    }
    if (categoryRes && categoryRes.length > 0) {
      categories = categoryRes;
    }
  } catch (_error) {
    // Keep mockProducts & mockCategories as safe static build fallback
  }

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/policies/shipping`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/returns`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Category filter routes
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((cat) => cat.isActive)
    .map((cat) => ({
      url: `${baseUrl}/products?category=${encodeURIComponent(cat.slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Dynamic product detail routes
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.isActive)
    .map((product) => ({
      url: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
      lastModified: product.createdAt ? new Date(product.createdAt) : currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: product.images?.map((img) => img.imageUrl).filter(Boolean),
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
```

---

## 7. Public Directory Inspection & `llms.txt` Crafting

### 7.1 Existing Assets in `frontend/public/`
- Directory path: `/home/mohamed-saad/Desktop/BRAND/frontend/public`
- Result of inspection: The directory is currently completely empty (`total 0`).
- No conflicting robots or sitemap text files exist.
- `llms.txt` can be placed directly at `frontend/public/llms.txt` and served at root `https://varellion.com/llms.txt`.

### 7.2 Full Production Draft for `frontend/public/llms.txt`
This text file adheres to standard `llms.txt` syntax ([llmstxt.org]), tailored for AI engines (ChatGPT, Perplexity, Claude, Gemini, Copilot):

```markdown
# VARELLION

> Everyday Masculine Luxury — Fine Watches, 100% Genuine Leather Goods & Refined Men's Accessories in Egypt. Nationwide delivery to all 27 Egyptian governorates with Cash on Delivery and full inspection before payment ("معاينة وفحص قبل الاستلام").

## Brand & Company Overview
- **Name**: VARELLION (فارليون)
- **Tagline (Arabic)**: الفخامة الرجالية اليومية — ساعات ومصنوعات جلدية صنعت لتدوم
- **Tagline (English)**: Everyday Masculine Luxury — Fine Watches & Genuine Leather
- **Mission**: Delivering premium craftsmanship, masculine elegance, and absolute shopping peace of mind to men across Egypt.
- **HQ & Operation Market**: Cairo, Egypt (Serving all 27 governorates).
- **Core Product Lines**:
  - **Luxury Watches**: Crafted with 316L surgical-grade stainless steel, scratch-resistant sapphire crystal glass, precision Japanese Miyota quartz movements, and 30m–50m water resistance.
  - **100% Genuine Leather Goods**: Handcrafted bifold wallets, slim cardholders, and passport covers made from 100% full-grain vegetable-tanned cowhide with built-in RFID blocking protection.
  - **Men's Accessories**: High-grade stainless steel bracelets, royal monogram cufflinks, and daily luxury accessories.

## Currency & Pricing Context
- **Official Store Currency**: Egyptian Pound (EGP / ج.م).
- **Pricing Policy**: All product prices are clearly displayed in EGP with no hidden handling fees.
- **Typical Price Ranges**:
  - Watches: 1,450 EGP – 1,850+ EGP
  - Genuine Leather Wallets & Cardholders: 450 EGP – 850 EGP
  - Men's Accessories & Cufflinks: 350 EGP – 650 EGP
- **Shipping Fees**: Calculated transparently based on shipping zones (starting from 60 EGP baseline in Egypt).

## Customer Guarantees & Buying Policies
- **Inspection Before Payment (معاينة وفحص قبل الاستلام)**: Absolute customer right to open the package and thoroughly inspect the item in front of the courier before handing over payment.
- **Payment Methods**:
  - Cash on Delivery (COD) available across all 27 Egyptian governorates without restriction.
  - Online card payment (Visa / MasterCard).
- **Delivery Timelines**: Fast, insured courier shipping:
  - Greater Cairo & Giza: 24 to 48 hours.
  - Alexandria, Delta & Canal Governorates: 2 to 3 business days.
  - Upper Egypt & Frontier Governorates: 3 to 5 business days.
- **14-Day Return & Exchange Guarantee**: Full compliance with the Egyptian Consumer Protection Law (قانون حماية المستهلك المصري). Easy replacements and refunds in original condition.

## Key Links & Collections
- [VARELLION Home](https://varellion.com): Main storefront and brand story.
- [All Products Catalog](https://varellion.com/products): Complete collection of watches, leather goods, and accessories with live filters.
- [Luxury Watches Collection](https://varellion.com/products?category=watches): Chronograph and automatic dress watches.
- [Genuine Leather Goods](https://varellion.com/products?category=leather-goods): 100% full-grain leather wallets and RFID cardholders.
- [Men's Accessories](https://varellion.com/products?category=accessories): Cufflinks, bracelets, and grooming details.
- [Bestsellers & Deals](https://varellion.com/products?featured=true): Curated featured selections and promotions.
- [Order Tracking](https://varellion.com/track-order): Real-time shipment status tracker by order ID and Egyptian phone number.
- [Shipping & Delivery Policy](https://varellion.com/policies/shipping): Complete 27-governorate transit schedules and rates.
- [Return & Warranty Policy](https://varellion.com/policies/returns): 14-day Egyptian consumer rights and return instructions.
- [Terms & Authenticity Guarantee](https://varellion.com/policies/terms): Quality assurance and commercial terms.

## Contact & Customer Support
- **Support Phone**: +20 100 000 0000
- **Official WhatsApp**: https://wa.me/201000000000
- **Operating Hours**: Daily from 10:00 AM to 10:00 PM (Cairo Time).
```

---

## 8. Actionable Implementation Checklist for Implementer

1. **Create Base URL Helper**:
   - Create `frontend/src/lib/url.ts` with `getBaseSiteUrl()`.
   - Update `frontend/src/config/site.ts` to export `url: getBaseSiteUrl()`.
   - Update `frontend/.env.example` and `frontend/.env.local` to document `NEXT_PUBLIC_SITE_URL=https://varellion.com` and `SITE_URL=https://varellion.com`.

2. **Implement `frontend/src/app/robots.ts`**:
   - Use Next.js 15 `MetadataRoute.Robots` return type.
   - Configure userAgent for `['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Google-Extended', '*']`.
   - Disallow `/admin`, `/admin/*`, `/checkout`, `/checkout/*`, `/profile`, `/profile/*`.
   - Link sitemap to `${baseUrl}/sitemap.xml`.

3. **Implement `frontend/src/app/sitemap.ts`**:
   - Use Next.js 15 `MetadataRoute.Sitemap` return type.
   - Implement `try/catch` around `catalogService` calls to ensure offline build resilience with `mockProducts` and `mockCategories` fallback.
   - Generate static routes (`/`, `/products`, `/policies/shipping`, `/policies/returns`, `/policies/terms`, `/track-order`).
   - Generate category routes (`/products?category=watches`, etc.).
   - Generate product routes (`/products/[slug]`) with image attachments.

4. **Create `frontend/public/llms.txt`**:
   - Write the exact markdown content drafted in Section 7.2.

5. **Update `frontend/src/app/layout.tsx` metadata**:
   - Add `metadataBase: new URL(getBaseSiteUrl())` to `metadata` in `layout.tsx` so Next.js automatically resolves relative URLs in all route segments.

6. **Add Unit / Integration Tests**:
   - Add tests for `robots.ts` and `sitemap.ts` (e.g., in `frontend/src/app/__tests__/seo-crawlability.test.ts`) verifying:
     - Robots output includes allowed bot user agents and disallows `/admin`, `/checkout`, `/profile`.
     - Sitemap output contains static, category, and product URLs, and handles backend error fallbacks cleanly.
   - Run `npm --prefix frontend test` and `npm --prefix frontend run build` to verify 100% passing tests and build.
