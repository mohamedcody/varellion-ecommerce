# Handoff Report — teamwork_explorer_survey_3

**Agent**: `teamwork_explorer_survey_3`  
**Date**: 2026-11-10  
**Task**: Survey R3 (Structured Data), R4 (Arabic RTL / Styling Preservation), and Verification (Build & Test Infrastructure)  
**Report Reference**: `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_3/report.md`

---

## 1. Observation

1. **Root Layout (`frontend/src/app/layout.tsx`)**:
   - Lines 25–34: Configured with `<html lang="ar" dir="rtl" className="scroll-smooth">` and Google Fonts (`Cinzel` and `Tajawal`).
   - Lines 11–18: Root metadata defines `title`, `description`, and `icons`, but lacks `metadataBase`, `alternates.canonical`, `openGraph`, `twitter`, and `robots`.
   - Lines 1–60: No structured data `<script type="application/ld+json">` or Schema.org markup exists in `layout.tsx`, `page.tsx`, or anywhere in `frontend/src` (`grep_search` for `application/ld+json` returned 0 matches).
2. **Product Detail Page (`frontend/src/app/products/[slug]/page.tsx`)**:
   - Line 1: Marked `'use client'`.
   - Lines 24–65: Uses `useParams()` from `next/navigation` and a client-side `useEffect` hook to fetch data via `catalogService.getProductBySlug(slug)`.
   - Lines 67–82: Renders `<Skeleton>` placeholders during loading on the client.
   - Lines 116–126: Contains hardcoded Arabic breadcrumb UI (`الرئيسية / المنتجات / {product.nameAr}`).
   - Lines 223–281: Contains rich craftsmanship specification table for watches and full-grain leather goods.
3. **Arabic RTL & Styling Architecture (`frontend/src/styles/globals.css`)**:
   - Lines 4–43: Tailwind 4 `@theme inline` defines `--font-tajawal`, `--font-cinzel`, and brand color tokens: obsidian (`--obsidian-950` to `700`), ivory (`--ivory-50` to `300`), and gold (`--gold-500` to `700`).
   - Line 63: `--gold-700: #876725` is WCAG 2.2 AA compliant (4.8:1 on light surfaces).
   - Lines 110–118: Body uses `font-family: var(--font-tajawal)`.
   - Across components (`ProductCard.tsx`, `SearchDialog.tsx`, `page.tsx`), navigation icons are flipped for RTL (e.g. `ArrowLeft` for next/forward, `ArrowRight` for back), while SKU and phone numbers use `font-mono` and `dir="ltr"`.
4. **Test Runner & Test Suite**:
   - `frontend/package.json` line 11: `"test": "vitest run"`.
   - `vitest.config.mjs` configures Vitest 5.0.5 with jsdom and `@testing-library/react`.
   - Executing `npm --prefix frontend test` ran all 18 test files and 79 unit tests:
     ```
     Test Files  18 passed (18)
          Tests  79 passed (79)
       Duration  17.44s
     ```
   - No tests currently exist for `robots.ts`, `sitemap.ts`, `llms.txt`, product page SSR, or JSON-LD schema generation.
5. **Build Infrastructure**:
   - Executing `npm --prefix frontend run build` directly initially produced:
     `[Error: ENOENT: no such file or directory, rename .../export/500.html -> .../server/pages/500.html]` due to stale build cache in `.next`.
   - Executing `rm -rf frontend/.next && npm --prefix frontend run build` completed with **exit code 0**, compiling all routes (18 static routes and 1 dynamic route `ƒ /products/[slug]`).
   - Build logs show `HomePage` handles backend absence gracefully at build time (`[HomePage] Catalog fetch error fallback: TypeError: fetch failed ... connect ECONNREFUSED 127.0.0.1:8080`) without crashing.

---

## 2. Logic Chain

1. **Absence of Structured Data**:
   From Observation 1, because no JSON-LD `<script>` tag exists anywhere in the frontend, AI and search crawlers currently receive zero structured semantic data about the business, site search, or products.
2. **Schema Architecture**:
   From Observations 1 & 2, search engines and AI assistants require:
   - Root level: `Organization` (brand identity, Egyptian customer service contact, Cairo address) and `WebSite` (site name, canonical URL, search action).
   - PDP level: `Product` and `Offer` with EGP pricing, availability (`https://schema.org/InStock`), brand (`VARELLION`), and Egyptian shipping details.
   - Navigation level: `BreadcrumbList` for hierarchical exploration on `/products` and `/products/[slug]`.
   - Helper implementation: Building a reusable `<JsonLd>` component (`frontend/src/components/seo/JsonLd.tsx`) with `<` escaping prevents XSS and standardizes JSON-LD serialization across all routes.
3. **Preserving Arabic RTL During SSR Refactoring**:
   From Observations 2 & 3, converting `products/[slug]/page.tsx` from `'use client'` to a Server Component must preserve every visual element and Tailwind class verbatim:
   - The Server Component renders the static semantic container, breadcrumb, title, price, description, technical specs table, and inspection trust card directly in initial HTML.
   - The interactive gallery, quantity, and add to cart buttons must be extracted into a dedicated client component (`ProductDetailClient.tsx`).
   - This split preserves 100% of the Arabic styling and typography while delivering immediate HTML content without skeleton pop-in.
4. **Build & Test Prerequisites**:
   From Observations 4 & 5, the existing Vitest and Next.js build infrastructure is fully operational. However:
   - Builds must clear `.next` cache if standalone export artifacts become stale.
   - 7 dedicated test suites must be created to verify `robots`, `sitemap`, `llms.txt`, SSR `generateMetadata`, JSON-LD schemas, and RTL stability.

---

## 3. Caveats

1. **Backend Connectivity at Build Time**:
   The Spring Boot backend is not running during standard CI/static build runs. The Server Component `generateMetadata` and `ProductDetailPage` must handle null/failed API responses gracefully (e.g. calling `notFound()` or returning fallback metadata) so `next build` does not fail when pre-evaluating routes.
2. **Sitelinks SearchBox Deprecation**:
   Google officially retired the Sitelinks Search Box rich result in November 2024. However, the `WebSite` + `SearchAction` schema remains a standard Schema.org representation useful for AI crawlers (Perplexity, ChatGPT, Claude) to understand site navigation.
3. **Dynamic Route Parameter Typing**:
   In Next.js 15, page props `params` is a `Promise<{ slug: string }>` and must be awaited (`const { slug } = await params;`) in both `generateMetadata` and `ProductDetailPage`.

---

## 4. Conclusion

1. **Structured Data Strategy**: Implement `frontend/src/components/seo/JsonLd.tsx` and `frontend/src/lib/seo/schema.ts` supplying typed builders for `Organization`, `WebSite`, `Product`, `Offer`, and `BreadcrumbList`.
2. **SSR & RTL Preservation**: Extract interactive PDP elements into `ProductDetailClient.tsx` while keeping all container, typography, and table styles in the Server Component `page.tsx`, preserving Arabic RTL layout and eliminating skeletons.
3. **Verification Ready**: The frontend build passes cleanly (`rm -rf frontend/.next && npm --prefix frontend run build`), and the Vitest test runner is ready to accommodate the 7 new test suites.

---

## 5. Verification Method

To independently verify all findings and prerequisites:

1. **Run Clean Build**:
   ```bash
   rm -rf frontend/.next && npm --prefix frontend run build
   ```
   *Expected*: Command exits with code 0; all 18 routes compiled without TypeScript or Next.js build errors.
2. **Run Test Suite**:
   ```bash
   npm --prefix frontend test
   ```
   *Expected*: All 18 test files and 79 tests pass with 0 failures.
3. **Inspect Schema Specifications**:
   Review `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_3/report.md` Section 2 for the exact TypeScript implementations of `JsonLd.tsx` and `schema.ts`.
