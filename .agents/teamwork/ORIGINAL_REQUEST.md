# Original User Request

## Initial Request — 2026-11-10T16:59:46Z

Implement AI-SEO, Technical SEO, and Structured Data for production deployment on the VARELLION e-commerce platform (Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Spring Boot 3, and PostgreSQL).

Working directory: /home/mohamed-saad/Desktop/BRAND
Integrity mode: development

## Requirements

### R1. AI Discovery & Crawlability Foundations
- Create `frontend/src/app/robots.ts` configured for search and AI discovery crawlers (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `*`), disallow private paths (`/admin`, `/admin/*`, `/checkout`, `/checkout/*`, `/profile`, `/profile/*`), and point to dynamic sitemap at `${baseUrl}/sitemap.xml`.
- Create `frontend/src/app/sitemap.ts` dynamically generating the XML sitemap for static pages (home `/`, products catalog `/products`, policies `/policies/shipping`, `/policies/returns`, `/policies/terms`), order tracking `/track-order`), product detail pages (`/products/[slug]`), and category filters.
- Resolve the base site URL dynamically from environment variables (`NEXT_PUBLIC_SITE_URL` or `SITE_URL`) with fallback to `https://varellion.com`.
- Create `frontend/public/llms.txt` following standard `llms.txt` format tailored for VARELLION: brand identity (luxury watches, 100% genuine leather goods, men accessories in Egypt), EGP pricing, key policies (nationwide delivery to 27 governorates in 24-72h, Cash on Delivery, full inspection before payment "معاينة وفحص قبل الاستلام"), and key markdown links.

### R2. Server-Side Rendering (SSR) & Dynamic Metadata for Product Pages
- Refactor `frontend/src/app/products/[slug]/page.tsx` from `'use client'` into a Server Component that fetches product data server-side so initial HTML contains full product content instead of loading skeletons.
- Add `generateMetadata({ params })` generating dynamic title, description, openGraph, twitter, and canonical URL in initial HTML.
- Extract interactive UI (gallery image switcher, quantity, add to cart, drawer toggle) into a dedicated Client Component (e.g., `ProductDetailClient.tsx`).

### R3. JSON-LD Structured Data
- Add structured data JSON-LD scripts:
  - `Product` and `Offer` schema on product pages (name, description, images, sku, price, priceCurrency: 'EGP', availability: InStock).
  - `Organization` and `WebSite` schema on homepage / root layout.
  - `BreadcrumbList` schema.

### R4. Compatibility and Quality Preservation
- Maintain existing styling, Arabic RTL support, and design intact across all modified pages.

## Acceptance Criteria

### Crawlability & AI Discovery
- [ ] `frontend/src/app/robots.ts` exports a valid Next.js Robots configuration allowing designated AI bots and search crawlers while disallowing private routes, pointing to `sitemap.xml`.
- [ ] `frontend/src/app/sitemap.ts` exports a valid Next.js Sitemap listing static pages, categories, and product detail URLs with base URL resolved from environment variable or `https://varellion.com` fallback.
- [ ] `frontend/public/llms.txt` exists and contains VARELLION brand summary, policies, EGP pricing context, and reference links.

### Product Page SSR & Metadata
- [ ] Initial HTML response for `/products/[slug]` contains rendered product title, description, and details without relying on client-side skeleton resolution.
- [ ] Product page `<head>` includes dynamic `<title>`, `<meta name="description">`, OpenGraph tags, Twitter tags, and canonical URL generated via `generateMetadata`.
- [ ] Interactive UI components (gallery switcher, quantity selector, add to cart, drawer) remain functional in the client component.

### Structured Data (JSON-LD)
- [ ] Valid `Product` and `Offer` JSON-LD schema is present in product page HTML with EGP currency and required product properties.
- [ ] Valid `Organization` and `WebSite` JSON-LD schemas are present on the homepage / root layout.
- [ ] Valid `BreadcrumbList` JSON-LD schema is present on catalog and product pages.

### Verification & Quality Gates
- [ ] `npm --prefix frontend run build` completes with zero TypeScript or Next.js build errors.
- [ ] `npm --prefix frontend test` passes with zero test failures or regressions.
- [ ] RTL and Arabic text rendering and existing UI styles remain intact.
