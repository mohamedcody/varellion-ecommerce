# Comprehensive Survey Report: R3 (Structured Data), R4 (Arabic RTL / Styling Preservation), and Verification Infrastructure

**Agent**: `teamwork_explorer_survey_3`  
**Date**: 2026-11-10  
**Scope**: Structured Data (JSON-LD), Arabic RTL Architecture, Frontend Build & Test Verification  
**Repository**: `/home/mohamed-saad/Desktop/BRAND`

---

## Executive Summary

1. **Root Layout & Metadata Assessment**:
   - `frontend/src/app/layout.tsx` configures `<html lang="ar" dir="rtl" className="scroll-smooth">` and imports Google Fonts (`Cinzel` and `Tajawal`).
   - Root metadata defines basic Arabic `title` and `description`, but is missing `metadataBase`, canonical URLs (`alternates.canonical`), OpenGraph tags, Twitter cards, and robots directives.
   - **Zero structured data or JSON-LD scripts exist** currently anywhere in the frontend codebase.
2. **Structured Data (JSON-LD) Specification**:
   - Designed complete, production-ready schemas for `Organization` and `WebSite` (with `SearchAction`) for the root layout / homepage.
   - Designed schema for `Product` and `Offer` with Egyptian market specifics (currency `'EGP'`, availability `https://schema.org/InStock`, brand `VARELLION`, and Egyptian shipping details).
   - Designed `BreadcrumbList` schema for catalog (`/products`) and product detail (`/products/[slug]`) pages.
   - Designed reusable `JsonLd` rendering component with XSS string escaping and typed schema builder helpers in `src/lib/seo/schema.ts`.
3. **Arabic RTL & Styling Preservation (R4)**:
   - The application relies on Tailwind CSS 4 with a dedicated obsidian/gold/ivory luxury token palette in `globals.css`.
   - Arabic typography is enforced globally via `var(--font-tajawal)`.
   - Directional conventions use logical alignment (`text-start`, `ps-*`, `pe-*`), with Lucide icon orientation adapted for RTL (e.g. `ArrowLeft` for forward progression). Numeric values use `.toLocaleString('ar-EG')` with `tabular-nums`.
   - Exact guidelines and component boundaries are specified to guarantee 100% visual and functional preservation during the SSR refactoring.
4. **Build & Test Infrastructure**:
   - `npm --prefix frontend test` runs Vitest 5.0.5 in jsdom with 18 existing test files and 79 passing unit tests (execution time ~17.4s).
   - `npm --prefix frontend run build` uses Next.js 15.5.28 (`output: 'standalone'`). Verified that a clean build (`rm -rf frontend/.next && npm --prefix frontend run build`) passes with zero errors (exit code 0), generating all 18 routes.
   - Designed a comprehensive 7-part test specification covering `robots.ts`, `sitemap.ts`, `llms.txt`, SSR product page with `generateMetadata`, JSON-LD schemas, and RTL preservation.

---

## 1. Inspection of Layout, Root Metadata, and Existing Scripts

### 1.1 `frontend/src/app/layout.tsx`
- **Root Element**: `<html lang="ar" dir="rtl" className="scroll-smooth">`
- **Typography Links in `<head>`**:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap"
    rel="stylesheet"
  />
  ```
- **Existing Metadata**:
  ```ts
  export const metadata: Metadata = {
    title: 'VARELLION — الفخامة الرجالية اليومية | الساعات والمصنوعات الجلدية',
    description:
      'متجر VARELLION الرائد في الساعات الفاخرة، المصنوعات الجلدية الطبيعية 100%، وحاملات البطاقات والإكسسوارات الرجالية الراقية في مصر. شحن لـ 27 محافظة مع معاينة قبل الاستلام.',
    icons: {
      icon: '/favicon.ico',
    },
  };
  ```
- **Identified Gaps in Root Metadata**:
  - No `metadataBase` defined (Next.js 15 warns when relative OG images or canonical URLs are resolved without `metadataBase`).
  - No `alternates.canonical` pointing to the root site.
  - No `openGraph` object (`type: 'website'`, `locale: 'ar_EG'`, `siteName: 'VARELLION'`).
  - No `twitter` card specification (`card: 'summary_large_image'`).
  - No `robots` specification (e.g. `index: true`, `follow: true`).

### 1.2 `frontend/src/app/page.tsx`
- Server Component that fetches `catalogService.getBestSellers(4)` and `catalogService.getCategories()`.
- Incorporates graceful fallback when backend connection fails (`hasCatalogError = true`).
- Does not export custom page-level `metadata` (inherits root metadata).
- **Existing `<script>` or JSON-LD tags**: **None exist.**

---

## 2. Exact JSON-LD Structured Data Specifications

### 2.1 Reusable Helper Component: `frontend/src/components/seo/JsonLd.tsx`

To prevent cross-site scripting (XSS) from unescaped dynamic text injected into inline `<script>` tags, strings must escape `<` to `\u003c`:

```tsx
import React from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
```

### 2.2 Schema Generator Library: `frontend/src/lib/seo/schema.ts`

```ts
import { Product } from '@/types';

/**
 * Resolves canonical base URL from environment variables with fallback
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com';
  return url.replace(/\/+$/, '');
}

/**
 * Organization Schema (Root Layout / Homepage)
 */
export function buildOrganizationSchema(baseUrl: string = getBaseUrl()) {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+201000000000';
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/201000000000';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'VARELLION',
    alternateName: 'فارليون',
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description:
      'متجر VARELLION الرائد في الساعات الفاخرة والمصنوعات الجلدية الطبيعية 100% وحاملات البطاقات في مصر مع معاينة كاملة قبل الاستلام.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: supportPhone,
      contactType: 'customer service',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: 'Cairo',
    },
    sameAs: [whatsappUrl],
  };
}

/**
 * WebSite Schema with SearchAction (Root Layout / Homepage)
 */
export function buildWebSiteSchema(baseUrl: string = getBaseUrl()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'VARELLION',
    alternateName: 'فارليون',
    url: baseUrl,
    inLanguage: 'ar-EG',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Combined Organization & WebSite Graph Schema
 */
export function buildRootGraphSchema(baseUrl: string = getBaseUrl()) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(baseUrl),
      buildWebSiteSchema(baseUrl),
    ],
  };
}

/**
 * Product & Offer Schema (Product Detail Page)
 */
export function buildProductSchema(product: Product, baseUrl: string = getBaseUrl()) {
  const productImages = (product.images && product.images.length > 0)
    ? product.images.map((img) => img.imageUrl)
    : [`${baseUrl}/placeholder-product.jpg`];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/products/${product.slug}/#product`,
    name: product.nameAr,
    alternateName: product.nameEn || undefined,
    description: product.descriptionAr,
    sku: product.sku,
    image: productImages,
    brand: {
      '@type': 'Brand',
      name: 'VARELLION',
    },
    category: product.category?.nameAr || 'ساعات ومصنوعات جلدية',
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: 'EGP',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.availableStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'VARELLION',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 50,
          currency: 'EGP',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'EG',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  };
}

/**
 * BreadcrumbList Schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

### 2.3 Page Integration Points
- **Root Layout (`frontend/src/app/layout.tsx`)**:
  Include `<JsonLd data={buildRootGraphSchema()} id="root-structured-data" />` inside `<body>` or `<head>`.
- **Product Detail Page (`frontend/src/app/products/[slug]/page.tsx`)**:
  Include:
  1. `<JsonLd data={buildProductSchema(product, baseUrl)} id="product-jsonld" />`
  2. `<JsonLd data={buildBreadcrumbSchema([...])} id="product-breadcrumb-jsonld" />`
- **Catalog Page (`frontend/src/app/products/page.tsx`)**:
  Include `<JsonLd data={buildBreadcrumbSchema([...])} id="catalog-breadcrumb-jsonld" />`

---

## 3. Arabic RTL Setup & Styling Preservation (R4)

### 3.1 RTL Foundations in Codebase
- **Global HTML Direction**: `dir="rtl"` and `lang="ar"` defined on `<html>` in `layout.tsx`.
- **Font Stack**:
  - Heading & Numbers: `Cinzel` serif font (`--font-cinzel`) and `Tajawal` (`--font-tajawal`).
  - Base body font: `var(--font-tajawal), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` configured in `src/styles/globals.css`.
- **Luxury Brand Token Palette**:
  - Obsidian tones: `--obsidian-950: #0E0F11`, `--obsidian-900: #141619`, `--obsidian-850: #1A1D20`.
  - Ivory tones: `--ivory-50: #FAF9F6`, `--ivory-100: #F4F1EA`, `--ivory-200: #EAE5D9`.
  - Gold accents: `--gold-500: #C5A059`, `--gold-600: #A8853F`, `--gold-700: #876725` (WCAG 2.2 AA compliant on light backgrounds).
- **Directional Icon Alignment**:
  - In Arabic RTL, forward action icons point to the left (`ArrowLeft`, `ChevronLeft`), while back/return actions point to the right (`ArrowRight`).
  - This convention is strictly followed in `ProductCard`, `CartDrawer`, `SearchDialog`, and `HomePage`.
- **Directional Isolation for Codes and Telephone Numbers**:
  - Phone input fields and SKU strings explicitly use `dir="ltr"` or `font-mono` to prevent Arabic bidirectional number flipping.
  - Price values are formatted using `tabular-nums` and `.toLocaleString('ar-EG')` alongside the Arabic currency indicator `ج.م`.

### 3.2 Preservation Rules for SSR Product Page Refactoring
When refactoring `frontend/src/app/products/[slug]/page.tsx` from `'use client'` into a Server Component + `ProductDetailClient.tsx`:
1. **Server Component Boundary**:
   - Fetches product data with `await catalogService.getProductBySlug(slug)`.
   - Generates dynamic metadata via `export async function generateMetadata({ params })`.
   - Renders static HTML structure: breadcrumb container, product title (`h1`), English subtitle (`p lang="en"`), price display box, Arabic description paragraph, technical craftsmanship table, inspection and guarantee trust cards.
   - Emits `<JsonLd>` scripts directly into the initial SSR HTML.
2. **Client Component Boundary (`ProductDetailClient.tsx`)**:
   - Handles client-only state: active image preview (`selectedImage`), thumbnail switcher buttons, Add to Cart button (`addItem`, `isAdded`), Fast Buy drawer toggle (`openCart`).
   - Receives initial product data as typed prop (`product: Product`).
   - Retains all exact Tailwind classes: `aspect-square`, `rounded-xl`, `border border-border bg-card shadow-xs`, thumbnail outline states `border-[#C5A059] ring-2 ring-[#C5A059]/30`.
3. **Zero Layout Shift**:
   - By rendering title, price, and specs on the server, the initial response eliminates skeleton layout jumps, directly improving Core Web Vitals (CLS = 0).

---

## 4. Frontend Build & Test Infrastructure Verification

### 4.1 Build Infrastructure
- **Command**: `npm --prefix frontend run build`
- **Underlying Script**: `next build` (Next.js 15.5.28, React 19, TypeScript 5.8.2).
- **Configuration (`next.config.ts`)**:
  - `output: 'standalone'`
  - `reactStrictMode: true`
  - Remote image patterns allowed: `images.unsplash.com`, `*.supabase.co`, `localhost`, `127.0.0.1`.
- **Prerequisite / Cache Observation**:
  - Next.js standalone export can encounter a race condition / ENOENT error on stale `.next` caches (`rename .next/export/500.html`).
  - **Resolution**: Clean build step: `rm -rf frontend/.next && npm --prefix frontend run build`.
  - Tested directly: Clean build completes with exit code 0, successfully compiling all TypeScript files, validating types, and generating all 18 routes.
  - Server-side catalog fetch resilience: `HomePage` correctly handles offline backend gracefully at build time using fallback try/catch (`hasCatalogError = true`).

### 4.2 Test Infrastructure
- **Command**: `npm --prefix frontend test`
- **Runner**: Vitest 5.0.5 (`vitest run`) configured with `@vitejs/plugin-react` and `jsdom`.
- **Existing Coverage**:
  - **18 test files**, **79 total tests**, 100% passing.
  - Testing areas: Admin orders, tracking cards, tracking timeline, checkout form, product cards, auth guard, cart context, UTM tracking, customer validations, API services.
  - Speed: All 79 tests execute in ~17.4s.

### 4.3 Required Test Suite Specification (To Add for AI-SEO & Verification)

To verify all acceptance criteria without regressions, the implementer should add the following 7 test suites:

#### 1. `frontend/src/app/__tests__/robots.test.ts`
- Tests Next.js `robots()` export from `frontend/src/app/robots.ts`.
- Asserts rules allow AI bots: `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `*`.
- Asserts disallows: `/admin`, `/admin/*`, `/checkout`, `/checkout/*`, `/profile`, `/profile/*`.
- Asserts `sitemap` URL matches `${baseUrl}/sitemap.xml`.
- Asserts base URL resolution honors `NEXT_PUBLIC_SITE_URL` / `SITE_URL` with `https://varellion.com` fallback.

#### 2. `frontend/src/app/__tests__/sitemap.test.ts`
- Tests Next.js `sitemap()` export from `frontend/src/app/sitemap.ts`.
- Asserts inclusion of static routes: `/`, `/products`, `/policies/shipping`, `/policies/returns`, `/policies/terms`, `/track-order`.
- Asserts dynamic product URLs (`/products/${slug}`) and category filter URLs are included.
- Asserts error resiliency: when catalog API fails, static sitemap entries are still returned without throwing.

#### 3. `frontend/src/__tests__/llms.test.ts`
- Asserts `frontend/public/llms.txt` file exists.
- Asserts content includes VARELLION brand summary (watches, 100% genuine leather).
- Asserts mentions Egyptian delivery (27 governorates, 24-72h), Cash on Delivery, and inspection before payment ("معاينة وفحص قبل الاستلام").
- Asserts markdown links are valid relative or absolute URLs.

#### 4. `frontend/src/lib/seo/__tests__/schema.test.ts`
- Asserts `buildOrganizationSchema` returns valid `@type: "Organization"`, `name: "VARELLION"`, EGP contact points, and address.
- Asserts `buildWebSiteSchema` returns valid `@type: "WebSite"` with `potentialAction` SearchAction.
- Asserts `buildProductSchema` produces valid `Product` and `Offer` schema with `priceCurrency: "EGP"`, `availability: "https://schema.org/InStock"`, `brand: "VARELLION"`, and `price`.
- Asserts `buildBreadcrumbSchema` returns indexed `itemListElement` array with sequential positions.

#### 5. `frontend/src/components/seo/__tests__/JsonLd.test.tsx`
- Asserts `<JsonLd data={...} />` renders a `<script type="application/ld+json">` tag.
- Asserts JSON is parsed cleanly.
- Asserts security: strings with `<script>` tags escape `<` to `\u003c` to prevent injection.

#### 6. `frontend/src/app/products/[slug]/__tests__/page.test.tsx`
- Tests Server Component rendering of `ProductDetailPage`.
- Asserts `catalogService.getProductBySlug(slug)` is called with route slug parameter.
- Asserts product title, price, description, and specs are present in server output (no loading skeletons).
- Asserts `notFound()` is invoked when product slug does not exist.
- Tests `generateMetadata({ params })`:
  - Returns dynamic title, description, openGraph tags, and canonical URL.

#### 7. `frontend/src/components/product/__tests__/ProductDetailClient.test.tsx`
- Tests client interaction in extracted `ProductDetailClient`.
- Asserts thumbnail clicks switch main displayed image.
- Asserts Add to Cart button dispatches `addItem` to CartContext.
- Asserts disabled state and "نفد من المخزون" badge when stock is 0.

---

## 5. Verification Commands Matrix

| Verification Target | Command | Expected Result |
|---|---|---|
| **TypeScript Typecheck** | `npm --prefix frontend run type-check` | Zero type errors |
| **Clean Production Build** | `rm -rf frontend/.next && npm --prefix frontend run build` | Exit code 0, 18/18 static/dynamic routes compiled |
| **Unit & SEO Test Suite** | `npm --prefix frontend test` | All tests passing (18 existing + new SEO suites) |
| **Lint Check** | `npm --prefix frontend run lint` | Zero ESLint errors or warnings |

---

## Conclusion
The frontend codebase is well-architected for this enhancement. Because Next.js 15 App Router is already in place with React 19 and Tailwind CSS 4, implementing Server Component SSR for product details, structured data schemas via a unified helper, and dedicated SEO test suites can be executed cleanly without compromising the existing Arabic RTL styling or test reliability.
