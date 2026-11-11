# Technical Mapping & Architecture Report: R2 — Server-Side Rendering (SSR) & Dynamic Metadata for Product Pages

**Author:** teamwork_explorer_survey_2  
**Target File:** `frontend/src/app/products/[slug]/page.tsx`  
**Related Components & Services:** `frontend/src/services/api.ts`, `frontend/src/types/index.ts`, `frontend/src/context/CartContext.tsx`  
**Date:** 2026-11-10  
**Status:** Comprehensive Analysis Complete

---

## 1. Executive Summary

The VARELLION e-commerce platform currently renders its Product Detail Page (`frontend/src/app/products/[slug]/page.tsx`) entirely as a client-side component (`'use client'`). Because the component initializes state with `isLoading: true` and only triggers `catalogService.getProductBySlug(slug)` inside a client-side `useEffect` hook, the initial HTML delivered over the wire during Server-Side Prerendering contains solely placeholder `Skeleton` elements. 

Search engine crawlers (Googlebot, Bingbot), AI discovery bots (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`), and social preview scrapers (OpenGraph/Twitter cards) receive an empty skeleton page without product titles, Arabic descriptions, EGP pricing, high-resolution imagery, or technical craftsmanship specifications.

Refactoring this route according to **Requirement 2 (R2)** converts `frontend/src/app/products/[slug]/page.tsx` into a pure **React Server Component (RSC)** in **Next.js 15 (v15.2.1 / React 19)**, delegating interactive user gestures (gallery image switching, quantity selection, adding to cart, cart drawer toggling) to a dedicated client component (`ProductDetailClient.tsx`).

---

## 2. Line-by-Line Code Analysis of `frontend/src/app/products/[slug]/page.tsx`

The existing file consists of 385 lines. Below is an exhaustive breakdown of its structure:

| Line Range | Section / Construct | Architectural Function & Observations |
| :--- | :--- | :--- |
| **Line 1** | `'use client';` | Directive designating the entire module and all imported subcomponents as a Client Component bundle. Eliminates server-side data streaming and metadata generation in Next.js App Router. |
| **Lines 3–21** | Module Imports | Imports React hooks (`useState`, `useEffect`), Next.js navigation (`useParams`, `useRouter`), `catalogService`, `Product` type, `useCart` context, UI components (`Button`, `Badge`, `Card`, `CardContent`, `Skeleton`), and Lucide icons (`ShieldCheck`, `Truck`, `RotateCcw`, `Check`, `ShoppingBag`, `ArrowRight`, `Sparkles`). **Note:** `useRouter` is imported on line 5 but never invoked. |
| **Lines 23–26** | Route Parameter Extraction | `const params = useParams(); const slug = params?.slug as string;`. In Next.js client components, `useParams()` unwraps the dynamic segment on the client. |
| **Lines 28–34** | Local & Context State Declarations | `product` (Product \| null), `selectedImage` (string), `isLoading` (boolean, default `true`), `isAdded` (boolean, default `false`). Destructures `addItem` and `openCart` from `useCart()`. |
| **Lines 35–65** | Data Fetching Effect (`useEffect`) | Mounts an async `loadProduct()` function governed by an `isCancelled` flag. Calls `catalogService.getProductBySlug(slug)`. If found, sets `product` and sets `selectedImage` to the main image or first available image. Catches errors via `console.error` and sets `isLoading(false)` in `finally`. **Crucial:** Because `useEffect` does NOT run during server-side prerendering, SSR HTML always exits at line 67. |
| **Lines 67–82** | Loading Guard (`if (isLoading)`) | Emits a 2-column skeleton layout (`aspect-square` image skeleton + 5 text bar skeletons). This is the exact markup currently indexed by crawlers. |
| **Lines 84–98** | Not Found Guard (`if (!product)`) | Emits a soft-404 UI card ("المنتج غير متوفر") with a return button to `/products`. Returns HTTP 200 instead of HTTP 404, causing SEO soft-404 indexing penalties in Google Search Console. |
| **Lines 100–111** | Interactive Handlers | `handleAddToCart`: calls `addItem(product, 1)`, sets `isAdded(true)` with a 2200ms timeout reset. `handleFastBuy`: calls `addItem(product, 1)` and `openCart()`. |
| **Lines 114–127** | Breadcrumb Navigation | Semantic `<nav aria-label="مسار التنقل">` linking `الرئيسية` (`/`), `المنتجات` (`/products`), and `product.nameAr`. Purely static UI. |
| **Lines 130–177** | Left Column: Visual Gallery | Main image container (`aspect-square`) with out-of-stock overlay badge if `availableStock <= 0`. Thumbnail strip (`product.images.length > 1`) with buttons setting `selectedImage` on click. |
| **Lines 181–222** | Right Column: Identity, Price & Description | SKU code, Category badge (`product.category?.nameAr`), Arabic title `<h1>{product.nameAr}</h1>`, English subtitle `<p lang="en">{product.nameEn}</p>`, Price Box (`product.price.toLocaleString('ar-EG')` + "ج.م"), Arabic description `<p>{product.descriptionAr}</p>`. Purely static UI. |
| **Lines 224–281** | Technical Specs Table | Conditional specifications table based on whether the item is a watch or leather item. Renders specs (Quartz movement, 316L steel, sapphire crystal, 3ATM vs Full-grain leather, RFID, hand-stitched, patina). Purely static UI. |
| **Lines 283–288** | English Craftsmanship Note | Italicized English description with gold right border (`border-[#C5A059]`). Purely static UI. |
| **Lines 290–305** | Stock Indicator | In-stock pill with pulsating emerald dot (with low stock warning if `<= 5`) or out-of-stock badge. Purely static UI. |
| **Lines 307–338** | Primary CTA Buttons | "أضف إلى سلة المشتريات" button with success state (`Check` icon, `تمت الإضافة للسلة`) and "عرض السلة ومراجعة الطلب" button. Interactive UI requiring `useCart`. |
| **Lines 340–380** | Inspection & Trust Card | 3 trust pillars: Free inspection before payment, 14-day exchange/return, delivery to 27 Egyptian governorates. Purely static UI. |

---

## 3. Existing Client-Side State, Hooks & Logic Summary

| Item | Type / Source | Current Purpose | Fate in Next.js 15 Refactor |
| :--- | :--- | :--- | :--- |
| `'use client'` | Directive | Makes entire file client component | **Removed from `page.tsx`**; applied only to `ProductDetailClient.tsx`. |
| `useParams()` | Hook (`next/navigation`) | Reads `params.slug` in browser | **Replaced** by async `params: Promise<{ slug: string }>` in Server Component. |
| `useRouter()` | Hook (`next/navigation`) | Imported on line 5 (unused) | **Removed**. |
| `isLoading` | `useState<boolean>(true)` | Tracks client fetch lifecycle | **Eliminated**. Server Component awaits data before rendering initial HTML. |
| `product` | `useState<Product \| null>` | Holds fetched product in memory | **Eliminated from state**. Resolved on server and passed as a static prop. |
| `selectedImage` | `useState<string>('')` | Tracks active image displayed | **Preserved in `ProductDetailClient.tsx`**, initialized to main image URL. |
| `isAdded` | `useState<boolean>(false)` | Shows 2.2s visual feedback on Add-to-Cart | **Preserved in `ProductDetailClient.tsx`**. |
| `quantity` | *Implicit (currently 1)* | Item quantity added to cart | **Promoted to explicit `useState<number>(1)`** in `ProductDetailClient.tsx` with increment/decrement controls. |
| `useCart()` | Context Hook | Supplies `addItem`, `openCart` | **Preserved in `ProductDetailClient.tsx`**. Context hooks cannot run in Server Components. |
| `useEffect` | Lifecycle Hook | Fetches product on client | **Eliminated**. Data fetched server-side in RSC. |

---

## 4. Product Data Fetching & API Architecture

### 4.1 Data Models & Types (`frontend/src/types/index.ts`)

The frontend domain model maps directly to the PostgreSQL schema and Spring Boot DTOs:

```typescript
export interface ProductImage {
  imageId: string;
  productId?: string;
  imageUrl: string;
  isMain: boolean;
  displayOrder: number;
  altAr?: string;
  altEn?: string;
}

export interface Category {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
  productCount?: number;
}

export interface Product {
  productId: string;
  categoryId: string;
  category?: Category;
  slug: string;             // Route identifier (maps to SKU or UUID)
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;            // in EGP
  costPrice?: number;
  stockQuantity: number;
  reservedQuantity: number;
  availableStock: number;   // Calculated: stockQuantity - reservedQuantity
  isActive: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}
```

### 4.2 Endpoint Mapping (`frontend/src/services/api.ts` & Spring Boot)

- **Backend Controller:** `com.varellion.store.catalog.controller.ProductController.java`
- **Method:** `@GetMapping("/{identifier}")` -> `ProductDto productService.getProductByIdentifier(identifier)`
- **Frontend Method:** `catalogService.getProductBySlug(slug: string): Promise<Product | null>`
- **HTTP Path:** `GET /api/products/{identifier}`
- **404 Behavior:** When the backend returns a 404, `catalogService.getProductBySlug` catches `ApiError` with `status === 404` and returns `null`.

---

## 5. Next.js 15 Server-Side Rendering (SSR) Architecture

### 5.1 Next.js 15 Asynchronous Route `params`

In Next.js 15 (React 19), dynamic segment parameters (`params`) and search parameters (`searchParams`) in Page components and `generateMetadata` are asynchronous `Promise` objects. 

Attempting to read `props.params.slug` synchronously causes a TypeScript build failure and a Next.js runtime warning:
> `Error: Route "/products/[slug]" used "params.slug". "params" should be awaited before using its properties.`

**Correct Next.js 15 Signature:**
```typescript
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await catalogService.getProductBySlug(slug);
  ...
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogService.getProductBySlug(slug);
  ...
}
```

### 5.2 Server vs Client API URL Resolution & Docker Networking

In `frontend/src/services/api.ts`, API endpoint construction is defined as:
```typescript
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
```

#### The Production Docker Gotcha
1. In `compose.prod.yml`:
   ```yaml
   frontend:
     environment:
       - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}
   ```
2. In browser environments, relative paths like `/api` work because the browser resolves them against `window.location.origin`.
3. In Node.js Server Components (SSR), `fetch('/api/products/...')` will throw:
   `TypeError: Failed to parse URL from /api/products/...`
4. Furthermore, inside a Docker container, `http://localhost:8080` addresses the frontend container itself, NOT the backend container (`http://backend:8080`).

#### Solution for Universal SSR Fetching
In `frontend/src/services/api.ts`, URL resolution should verify execution context (`typeof window === 'undefined'`) and support an internal backend URL:
```typescript
export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side (Node.js runtime inside Docker or local build)
    const internalUrl = process.env.INTERNAL_API_URL || process.env.BACKEND_URL;
    if (internalUrl) return internalUrl.replace(/\/+$/, '');

    const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    if (publicUrl.startsWith('http://') || publicUrl.startsWith('https://')) {
      return publicUrl.replace(/\/+$/, '');
    }
    // Fallback if publicUrl is relative (e.g. '/api')
    return 'http://localhost:8080/api';
  }
  // Client-side (Browser runtime)
  const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return publicUrl.replace(/\/+$/, '');
}
```

### 5.3 Request Deduplication via `React.cache`

Because both `generateMetadata` and `ProductDetailPage` execute during the same server request for `/products/[slug]`, fetching the product in both functions would result in duplicate HTTP queries to the backend if unmemoized.

By wrapping `catalogService.getProductBySlug` in `React.cache`, React deduplicates calls across the entire server render pass:
```typescript
import { cache } from 'react';
import { catalogService } from '@/services/api';

export const getCachedProduct = cache(async (slug: string) => {
  return await catalogService.getProductBySlug(slug);
});
```

### 5.4 Error Handling & `notFound()` Behavior

When `getCachedProduct(slug)` resolves to `null` (or if an unexpected fetch error occurs):
1. In `page.tsx`, invoking `notFound()` from `next/navigation` halts rendering and triggers Next.js's 404 response handler.
2. The HTTP response status code is strictly `404 Not Found`. This prevents soft-404 indexing errors in Google Search Console and informs AI bots not to waste crawl budget.
3. In `generateMetadata`, if `product` is `null`, return `{ title: 'المنتج غير موجود | VARELLION', robots: { index: false, follow: false } }`.

---

## 6. Component Boundary & Interface Architecture

### 6.1 Architectural Comparison

| Criteria | Architecture A: Full Interactive Client Shell (`ProductDetailClient`) | Architecture B: Island Architecture (Separate Gallery & Action Islands) |
| :--- | :--- | :--- |
| **Server Component (`page.tsx`)** | Fetches data, generates metadata, handles 404, renders JSON-LD, renders Breadcrumbs, renders `<ProductDetailClient product={product} />`. | Fetches data, generates metadata, handles 404, renders JSON-LD, renders Breadcrumbs, renders static headings/tables, mounts `<ProductGalleryClient />` and `<ProductActionsClient />`. |
| **Initial SSR HTML** | **100% full content**. React renders `ProductDetailClient` on the server into complete HTML strings (all text, images, prices, specs). | **100% full content**. Direct server markup for text, client island markup for gallery and buttons. |
| **Client JS Payload** | Slightly larger (~3KB markup in client bundle). | Minimal client JS (only gallery and action buttons). |
| **Code Organization** | Clean 1-to-1 refactor matching current code; zero prop drilling. | Requires multiple small component files. |
| **Recommendation** | **Recommended for R2 implementation** due to simplicity, complete SSR preservation, and zero layout shift. | Viable alternative if micro-optimizing JS payload. |

### 6.2 Server Component (`page.tsx`) Responsibilities

1. **Async Route Resolver:** Awaits `params` (`{ slug }`).
2. **Data Orchestration:** Calls `getCachedProduct(slug)`.
3. **404 Guard:** Calls `notFound()` if product does not exist.
4. **Dynamic Metadata:** Exports `generateMetadata({ params })`.
5. **SEO Structured Data:** Injects `<script type="application/ld+json">` for `Product`, `Offer`, and `BreadcrumbList`.
6. **Breadcrumb Semantic HTML:** Renders `<nav aria-label="مسار التنقل">` directly in SSR HTML.
7. **Client Component Hand-off:** Passes resolved `product: Product` into `<ProductDetailClient product={product} />`.

### 6.3 Client Component (`ProductDetailClient.tsx`) Responsibilities

1. **Interactive Image Switcher:**
   - Holds `selectedImage` state initialized to `mainImage.imageUrl || product.images[0]?.imageUrl || ''`.
   - Renders the active large visual display and out-of-stock badge.
   - Renders interactive thumbnail list (`<button onClick={() => setSelectedImage(img.imageUrl)} ...>`) with active gold border highlight (`border-[#C5A059]`).
2. **Quantity Management:**
   - Holds `quantity` state initialized to `1`.
   - Controls: Increment (`+`) limited to `product.availableStock` and Decrement (`-`) bounded at `1`.
3. **Cart Integration:**
   - Uses `useCart()` context (`addItem`, `openCart`).
   - "أضف إلى سلة المشتريات" button: Calls `addItem(product, quantity)`, sets `isAdded(true)` for 2200ms with checkmark icon and emerald styling.
   - "عرض السلة ومراجعة الطلب" button: Calls `addItem(product, quantity)` and opens the `CartDrawer`.
4. **Initial SSR Hydration:**
   - Because `product` is supplied directly as a prop, React renders the complete UI during the SSR pass. When the client loads, React hydrates event listeners without layout shifts or skeletons.

### 6.4 Explicit Props Interface

```typescript
// frontend/src/app/products/[slug]/ProductDetailClient.tsx

import { Product } from '@/types';

export interface ProductDetailClientProps {
  product: Product;
}
```

---

## 7. Dynamic SEO Metadata Implementation (`generateMetadata`)

The `generateMetadata` function dynamically constructs search, OpenGraph, and Twitter tags:

```typescript
import type { Metadata } from 'next';
import { getCachedProduct } from './page'; // or shared service

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    return {
      title: 'المنتج غير موجود | VARELLION',
      description: 'عذراً، لم نتمكن من العثور على المنتج المطلوب في متجر VARELLION.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com';
  const siteUrl = rawBaseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${siteUrl}/products/${product.slug}`;

  const mainImage = product.images?.find((img) => img.isMain)?.imageUrl || product.images?.[0]?.imageUrl;
  const ogImages = product.images && product.images.length > 0
    ? product.images.map((img) => ({
        url: img.imageUrl,
        width: 800,
        height: 800,
        alt: img.altAr || product.nameAr,
      }))
    : mainImage
    ? [{ url: mainImage, width: 800, height: 800, alt: product.nameAr }]
    : [];

  const title = `${product.nameAr} | VARELLION`;
  const description = product.descriptionAr
    ? product.descriptionAr.slice(0, 160)
    : `تسوق ${product.nameAr} من VARELLION. خامات أصلية فاخرة، معاينة مجانية قبل الدفع وشحن لجميع محافظات مصر.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'VARELLION',
      locale: 'ar_EG',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mainImage ? [mainImage] : [],
    },
  };
}
```

---

## 8. JSON-LD Structured Data Schema Specification (R2 & R3)

To ensure rich snippets in Google Search and clear entity extraction by AI agents, `page.tsx` renders a unified JSON-LD graph:

```typescript
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com').replace(/\/+$/, '');
const productUrl = `${siteUrl}/products/${product.slug}`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      name: product.nameAr,
      alternateName: product.nameEn,
      description: product.descriptionAr,
      sku: product.sku,
      image: product.images?.map((img) => img.imageUrl) || [],
      category: product.category?.nameAr || 'إكسسوارات رجالية فاخرة',
      brand: {
        '@type': 'Brand',
        name: 'VARELLION',
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'EGP',
        availability:
          product.availableStock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: productUrl,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: 'VARELLION',
          url: siteUrl,
        },
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${productUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'الرئيسية',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'المنتجات',
          item: `${siteUrl}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.nameAr,
          item: productUrl,
        },
      ],
    },
  ],
};
```

---

## 9. Drop-In Implementation Blueprint

### 9.1 Server Component: `frontend/src/app/products/[slug]/page.tsx`

```tsx
import React, { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { catalogService } from '@/services/api';
import { Product } from '@/types';
import { ProductDetailClient } from './ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Request deduplication for metadata and page render
const getCachedProduct = cache(async (slug: string): Promise<Product | null> => {
  return await catalogService.getProductBySlug(slug);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    return {
      title: 'المنتج غير موجود | VARELLION',
      description: 'عذراً، لم نتمكن من العثور على المنتج المطلوب في متجر VARELLION.',
      robots: { index: false, follow: false },
    };
  }

  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com';
  const siteUrl = rawBaseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${siteUrl}/products/${product.slug}`;

  const mainImage = product.images?.find((img) => img.isMain)?.imageUrl || product.images?.[0]?.imageUrl;
  const ogImages = product.images && product.images.length > 0
    ? product.images.map((img) => ({
        url: img.imageUrl,
        width: 800,
        height: 800,
        alt: img.altAr || product.nameAr,
      }))
    : mainImage
    ? [{ url: mainImage, width: 800, height: 800, alt: product.nameAr }]
    : [];

  const title = `${product.nameAr} | VARELLION`;
  const description = product.descriptionAr
    ? product.descriptionAr.slice(0, 160)
    : `تسوق ${product.nameAr} من VARELLION. خامات أصلية فاخرة، معاينة مجانية قبل الدفع وشحن لجميع محافظات مصر.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'VARELLION',
      locale: 'ar_EG',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mainImage ? [mainImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    notFound();
  }

  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com';
  const siteUrl = rawBaseUrl.replace(/\/+$/, '');
  const productUrl = `${siteUrl}/products/${product.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        name: product.nameAr,
        alternateName: product.nameEn,
        description: product.descriptionAr,
        sku: product.sku,
        image: product.images?.map((img) => img.imageUrl) || [],
        category: product.category?.nameAr || 'إكسسوارات رجالية فاخرة',
        brand: {
          '@type': 'Brand',
          name: 'VARELLION',
        },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'EGP',
          availability:
            product.availableStock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: productUrl,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'VARELLION',
            url: siteUrl,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${productUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'الرئيسية',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'المنتجات',
            item: `${siteUrl}/products`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.nameAr,
            item: productUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      {/* Structured Data JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl text-start">
        {/* Breadcrumb Navigation rendered on server */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="مسار التنقل">
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">
            المنتجات
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground truncate max-w-xs">{product.nameAr}</span>
        </nav>

        {/* Client Interactive Island */}
        <ProductDetailClient product={product} />
      </div>
    </>
  );
}
```

### 9.2 Client Component: `frontend/src/app/products/[slug]/ProductDetailClient.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';

export interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const initialImage =
    product.images?.find((img) => img.isMain)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    '';

  const [selectedImage, setSelectedImage] = useState<string>(initialImage);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const { addItem, openCart } = useCart();

  const handleAddToCart = () => {
    if (!product || product.availableStock <= 0) return;
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const handleFastBuy = () => {
    if (!product || product.availableStock <= 0) return;
    addItem(product, quantity);
    openCart();
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(product.availableStock, prev + 1));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
      {/* Left / Gallery Column */}
      <div className="flex flex-col gap-4">
        {/* Main Visual Display */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt={product.nameAr}
              className="h-full w-full object-cover object-center transition-all duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              لا توجد صورة
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.availableStock <= 0 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="bg-card/95 text-rose-700 border-rose-300 font-bold text-xs shadow-md">
                نفد من المخزون
              </Badge>
            </div>
          )}
        </div>

        {/* Thumbnails list if multiple */}
        {product.images && product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2" role="group" aria-label="صور المنتج الإضافية">
            {product.images.map((img, idx) => (
              <button
                key={img.imageId || idx}
                type="button"
                onClick={() => setSelectedImage(img.imageUrl)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                  selectedImage === img.imageUrl
                    ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-xs'
                    : 'border-border/80 opacity-70 hover:opacity-100 hover:border-ivory-300'
                }`}
                aria-label={`عرض صورة رقم ${idx + 1} من ${product.images.length}`}
                aria-pressed={selectedImage === img.imageUrl}
              >
                <img src={img.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right / Product Information & Purchase Column */}
      <div className="flex flex-col gap-6">
        {/* SKU & Category */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono text-muted-foreground">كود الموديل: {product.sku}</span>
          <span className="font-semibold text-[#876725] tracking-wide">
            {product.category?.nameAr || 'منتج أصلي'}
          </span>
        </div>

        {/* Product Title & English Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight text-balance">
            {product.nameAr}
          </h1>
          {product.nameEn && (
            <p lang="en" className="font-serif text-xs font-semibold tracking-widest uppercase text-[#876725] mt-1.5">
              {product.nameEn}
            </p>
          )}
        </div>

        {/* Price Box */}
        <div className="flex items-baseline justify-between p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground tabular-nums">
              {product.price.toLocaleString('ar-EG')}
            </span>
            <span className="text-sm font-bold text-muted-foreground">ج.م</span>
          </div>

          <div className="text-xs font-medium text-muted-foreground">
            تُحسب مصاريف الشحن عند تأكيد الطلب
          </div>
        </div>

        {/* Arabic Detailed Description */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-foreground">تفاصيل ومواصفات القطعة:</h2>
          <div className="text-sm text-foreground/90 leading-relaxed bg-card p-4 rounded-xl border border-border shadow-2xs">
            <p>{product.descriptionAr}</p>
          </div>
        </div>

        {/* Structured Craftsmanship & Technical Specs Table */}
        <div className="space-y-2 pt-1">
          <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>المواصفات الفنية والحرفية المعتمدة:</span>
          </h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden text-xs shadow-2xs">
            <table className="w-full text-start border-collapse">
              <caption className="sr-only">المواصفات الفنية ومواد تصنيع المنتج</caption>
              <thead className="bg-muted/40 border-b border-border/60 font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="p-2.5 text-start font-semibold">المعيار / الخاصية</th>
                  <th scope="col" className="p-2.5 text-start font-semibold border-r border-border/60">المواصفات وخامات التصنيع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {product.category?.slug?.includes('watch') || product.nameEn?.toLowerCase().includes('watch') ? (
                  <>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">نوع الماكينة والحركة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">كوارتز يابانية دقيقة (Precision Quartz)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">مادة الهيكل والمينا</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">فولاذ مقاوم للصدأ 316L فائق الصلابة</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">زجاج الساعة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">كريستال مقوى ضد الخدوش والانعكاس</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">مقاومة الماء</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">3ATM / 30 متراً (مقاومة للرذاذ والاستخدام اليومي)</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">نوع وخامة الجلد</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">جلد طبيعي 100% مدبوغ نباتياً (Full-Grain)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">الحماية والتقنية</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">حماية RFID مدمجة لمنع سرقة البطاقات</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">التشطيب والخياطة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">خياطة يدوية معززة بخيوط شمعية مقاومة للتلف</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">ملمس وجودة الخامة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">ملمس ناعم وطبيعي يكتسب مظهراً أعمق مع الاستخدام</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* English Craftsmanship Note */}
        {product.descriptionEn && (
          <div className="text-xs text-muted-foreground leading-relaxed italic border-r-2 border-[#C5A059] pr-3">
            <p>{product.descriptionEn}</p>
          </div>
        )}

        {/* Stock Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          {product.availableStock > 0 ? (
            <div className="inline-flex items-center gap-2 text-emerald-800 bg-[#EAF7EE] px-3 py-1 rounded-md border border-emerald-200/50">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                متوفر في المخزون
                {product.availableStock <= 5 ? ` (متبقي ${product.availableStock} قطع فقط)` : ' — جاهز للشحن الفوري للمحافظات'}
              </span>
            </div>
          ) : (
            <span className="text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-md">
              غير متوفر حالياً
            </span>
          )}
        </div>

        {/* Quantity Selector & Primary Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {product.availableStock > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground">الكمية:</span>
              <div className="flex items-center border border-border rounded-lg bg-card">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  aria-label="تقليل الكمية"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-bold tabular-nums text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= product.availableStock}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={product.availableStock <= 0}
              variant={isAdded ? 'secondary' : 'luxury'}
              size="lg"
              className="flex-1 gap-2.5 font-bold shadow-xs min-h-[48px]"
            >
              {isAdded ? (
                <>
                  <Check className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-800">تمت الإضافة للسلة</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5 text-[#C5A059]" aria-hidden="true" />
                  <span>أضف إلى سلة المشتريات</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleFastBuy}
              disabled={product.availableStock <= 0}
              variant="outline"
              size="lg"
              className="sm:w-auto gap-2 font-bold min-h-[48px]"
            >
              <span>عرض السلة ومراجعة الطلب</span>
            </Button>
          </div>
        </div>

        {/* Inspection and Guarantee Banner */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <strong className="text-foreground block font-bold">
                  معاينة مجانية قبل دفع أي قرش للمندوب
                </strong>
                <span className="text-muted-foreground">
                  يحق لك فتح الشحنة وفحص جودة المنتج والتأكد من مطابقتها للمواصفات أمام المندوب.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <strong className="text-foreground block font-bold">
                  ضمان استبدال واسترجاع 14 يوماً
                </strong>
                <span className="text-muted-foreground">
                  سياسة إرجاع مرنة وسهلة في حالة وجود أي عيب أو رغبة في استبدال المقاس.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <strong className="text-foreground block font-bold">
                  توصيل آمن لـ 27 محافظة مصرية
                </strong>
                <span className="text-muted-foreground">
                  خلال 24-48 ساعة داخل القاهرة والجيزة، ومن 2-3 أيام لباقي المحافظات.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 10. Verification, Testing & Quality Gates

### 10.1 Unit Testing Strategy (`vitest`)
1. Create `frontend/src/app/products/[slug]/__tests__/page.test.tsx`:
   - Mock `catalogService.getProductBySlug`.
   - Verify `generateMetadata({ params: Promise.resolve({ slug: 'VAR-W-01' }) })` outputs proper title, description, canonical, and OpenGraph images.
   - Verify `generateMetadata` returns `robots: { index: false, follow: false }` when product is null.
   - Verify `ProductDetailPage` calls `notFound()` when product is null.
   - Verify `ProductDetailPage` renders JSON-LD structured data script with `priceCurrency: 'EGP'`.
2. Create `frontend/src/app/products/[slug]/__tests__/ProductDetailClient.test.tsx`:
   - Render `ProductDetailClient` with mock product.
   - Test thumbnail click updates displayed image.
   - Test quantity increment and decrement buttons respect min=1 and max=availableStock.
   - Test "أضف إلى سلة المشتريات" triggers `useCart().addItem(product, quantity)` and temporary success state.
   - Test "عرض السلة ومراجعة الطلب" triggers `useCart().addItem(product, quantity)` and `useCart().openCart()`.

### 10.2 Build Verification
- Command: `npm --prefix frontend run build`
- Success criteria: Zero TypeScript errors, zero Next.js route errors, dynamic route `/products/[slug]` builds as `ƒ (Dynamic)` server-rendered page.
- Test suite: `npm --prefix frontend test` must continue passing 100% (currently 18/18 files, 79/79 tests).

---

## 11. Conclusion & Next Steps for Implementation Agent

1. Update `frontend/src/services/api.ts` to ensure `resolveApiBaseUrl()` handles server-side fetch without crashing when `NEXT_PUBLIC_API_URL` is relative (`/api`).
2. Create `frontend/src/app/products/[slug]/ProductDetailClient.tsx` using the blueprint above.
3. Replace `frontend/src/app/products/[slug]/page.tsx` with the Server Component blueprint above.
4. Add unit and integration tests under `frontend/src/app/products/[slug]/__tests__/`.
5. Run `npm --prefix frontend run build` and `npm --prefix frontend test` to guarantee zero regressions.
