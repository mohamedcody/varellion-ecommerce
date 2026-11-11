# Project: VARELLION AI-SEO, Technical SEO, and Structured Data

## Architecture
- Next.js 15 App Router (`frontend/src/app`) with React 19, TypeScript, Tailwind CSS 4, and Spring Boot 3 backend.
- **Discovery & Crawlability**:
  - `frontend/src/lib/url.ts`: Centralized `getBaseSiteUrl()` resolving from `NEXT_PUBLIC_SITE_URL` / `SITE_URL` with fallback to `https://varellion.com` and trailing slash trimming.
  - `frontend/src/app/robots.ts`: Next.js `MetadataRoute.Robots` granting access to search crawlers and AI bots (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `*`), disallowing private routes (`/admin`, `/checkout`, `/profile`), pointing to dynamic sitemap at `${baseUrl}/sitemap.xml`.
  - `frontend/src/app/sitemap.ts`: Next.js `MetadataRoute.Sitemap` dynamically listing 6 static pages, category query routes (`/products?category=${slug}`), and product detail routes (`/products/${slug}`) with image arrays and resilient fallback to mock data when Spring Boot is offline during `next build`.
  - `frontend/public/llms.txt`: Standard `llms.txt` documenting brand identity, craftsmanship, EGP pricing, 27 governorates delivery in 24-72h, Cash on Delivery (COD), full inspection before payment ("معاينة وفحص قبل الاستلام"), and markdown links.
- **Server-Side Rendering (SSR) & Dynamic Metadata**:
  - `frontend/src/services/api.ts`: Add `resolveApiBaseUrl()` to guarantee absolute URLs on server-side SSR fetches when running in Docker or Node.js.
  - `frontend/src/app/products/[slug]/page.tsx`: Server Component receiving `params: Promise<{ slug: string }>` (Next.js 15), fetching product data on the server via `catalogService.getProductBySlug`, emitting `notFound()` on 404, generating dynamic metadata via `generateMetadata`, and embedding JSON-LD structured data.
  - `frontend/src/app/products/[slug]/ProductDetailClient.tsx`: Extracted Client Component managing interactive state: image gallery thumbnail switcher (`selectedImage`), quantity increment/decrement controls, Add to Cart with visual feedback and cart drawer open action.
- **Structured Data (JSON-LD)**:
  - `frontend/src/components/seo/JsonLd.tsx`: Reusable `<JsonLd data={...} />` component with XSS-safe escaping.
  - `frontend/src/lib/seo/schema.ts`: Typed schema builder functions for:
    - `Organization` & `WebSite` (root layout / home)
    - `Product` & `Offer` (product detail page, priceCurrency: 'EGP', availability: InStock, Egyptian shipping details)
    - `BreadcrumbList` (product detail pages & catalog `/products`)
- **Compatibility & Quality Preservation**:
  - Strict preservation of Arabic RTL direction (`dir="rtl"`, `lang="ar"`), Tajawal/Cinzel fonts, gold/obsidian color tokens, and layout styles.
  - Zero build warnings, zero TypeScript errors, 100% test pass rate across existing 79 tests + new SEO/SSR test suites.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Site Base URL Helper | `getBaseSiteUrl()` resolving `NEXT_PUBLIC_SITE_URL` / `SITE_URL` with `https://varellion.com` fallback | M1 | R1 |
| 2 | Robots Configuration | `frontend/src/app/robots.ts` configured for search/AI crawlers and disallowing private routes | M1 | R1 |
| 3 | Dynamic Sitemap | `frontend/src/app/sitemap.ts` listing static pages, categories, and products with offline build fallback | M1 | R1 |
| 4 | llms.txt Discovery File | `frontend/public/llms.txt` tailored to VARELLION brand, policies, EGP, and inspection before payment | M1 | R1 |
| 5 | Root Metadata & MetadataBase | Configure `metadataBase` in `frontend/src/app/layout.tsx` | M1 | R1 |
| 6 | JSON-LD Infrastructure | Create `JsonLd.tsx` and `schema.ts` for Schema.org JSON-LD generation | M1 | R3 |
| 7 | Organization & WebSite Schemas | Inject `Organization` and `WebSite` JSON-LD schemas in root layout/homepage | M1 | R3 |
| 8 | Universal Server API URL | `resolveApiBaseUrl()` in `frontend/src/services/api.ts` for Node.js SSR fetch compatibility | M2 | R2 |
| 9 | Product Page Server Component | Refactor `frontend/src/app/products/[slug]/page.tsx` from `'use client'` to Server Component with `params: Promise<{ slug: string }>` and `notFound()` | M2 | R2 |
| 10 | Dynamic Metadata for PDP | Implement `generateMetadata({ params })` in `products/[slug]/page.tsx` for Title, Description, OG, Twitter, Canonical | M2 | R2 |
| 11 | PDP Interactive Client Component | Create `ProductDetailClient.tsx` for gallery thumbnail switching, quantity controls, add to cart, and drawer toggle | M2 | R2 |
| 12 | Product & Offer JSON-LD Schema | Embed `Product` and `Offer` schema (EGP, InStock, brand) in initial SSR HTML of PDP | M2 | R3 |
| 13 | PDP BreadcrumbList Schema | Embed `BreadcrumbList` schema in initial SSR HTML of PDP | M2 | R3 |
| 14 | Catalog BreadcrumbList Schema | Embed `BreadcrumbList` schema in `/products` catalog page | M3 | R3 |
| 15 | Style & RTL Preservation | Guarantee Arabic RTL typography, font weights, colors, and layout intact | M3 | R4 |
| 16 | Comprehensive E2E Testing | Suite of unit and integration tests covering robots, sitemap, llms.txt, SSR, metadata, and JSON-LD schemas | M3 | R4 |
| 17 | Production Build & Test Gates | Clean pass of `npm --prefix frontend run build` and `npm --prefix frontend test` with zero errors | M3 | R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | AI Discovery, Crawlability & Schema Foundations | Features 1, 2, 3, 4, 5, 6, 7 | none | DONE |
| M2 | Product Page SSR, Dynamic Metadata & PDP Schemas | Features 8, 9, 10, 11, 12, 13 | M1 | DONE |
| M3 | Catalog Breadcrumbs, Test Suite & Quality Gates | Features 14, 15, 16, 17 | M1, M2 | DONE |

## Interface Contracts
### Base URL Contract (`frontend/src/lib/url.ts`)
- `getBaseSiteUrl(): string`
  - Reads `process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com'`
  - Strips trailing slash (`replace(/\/+$/, '')`)

### Schema Builder Contract (`frontend/src/lib/seo/schema.ts`)
- `buildOrganizationSchema(baseUrl: string): WithContext<Organization>`
- `buildWebSiteSchema(baseUrl: string): WithContext<WebSite>`
- `buildProductSchema(product: Product, baseUrl: string): WithContext<Product>`
- `buildBreadcrumbSchema(items: { name: string; item: string }[]): WithContext<BreadcrumbList>`

### Product Detail Component Contract (`frontend/src/app/products/[slug]/ProductDetailClient.tsx`)
- Props:
  ```typescript
  export interface ProductDetailClientProps {
    product: Product;
  }
  ```
- Renders:
  - Interactive gallery with thumbnail selection (`selectedImage`)
  - Quantity controls (`[ - ] quantity [ + ]`)
  - Add to cart button with confirmation feedback (`useCart().addItem`)
  - Fast buy / review order button (`useCart().openCart`)

### SSR Page Contract (`frontend/src/app/products/[slug]/page.tsx`)
- Props:
  ```typescript
  interface ProductPageProps {
    params: Promise<{ slug: string }>;
  }
  ```
- Functions:
  - `generateMetadata({ params }: ProductPageProps): Promise<Metadata>`
  - `default async function ProductDetailPage({ params }: ProductPageProps): Promise<JSX.Element>`

## Code Layout
- `frontend/src/lib/url.ts`: URL resolution helper
- `frontend/src/app/robots.ts`: Next.js robots configuration
- `frontend/src/app/sitemap.ts`: Next.js sitemap configuration
- `frontend/public/llms.txt`: LLM discovery file
- `frontend/src/components/seo/JsonLd.tsx`: Reusable JSON-LD script component
- `frontend/src/lib/seo/schema.ts`: Schema.org builder functions
- `frontend/src/services/api.ts`: API base URL resolution update
- `frontend/src/app/products/[slug]/page.tsx`: Server Component for PDP
- `frontend/src/app/products/[slug]/ProductDetailClient.tsx`: Client Component for PDP
- `frontend/src/app/layout.tsx`: Root layout with `metadataBase` and `Organization`/`WebSite` schemas
- `frontend/src/app/products/page.tsx`: Catalog page with `BreadcrumbList` schema
- `frontend/src/__tests__/seo/`: Test suites for robots, sitemap, llms.txt, SSR, metadata, schemas
