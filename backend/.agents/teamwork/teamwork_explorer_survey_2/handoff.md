# Handoff Report: R2 — Server-Side Rendering (SSR) & Dynamic Metadata for Product Pages

**Agent:** teamwork_explorer_survey_2  
**Role:** Explorer / Survey & Mapping  
**Working Directory:** `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_2/`  
**Parent Conversation ID:** `b11ef86f-d30f-4bff-8761-64eed6704016`  
**Date:** 2026-11-10T17:16:00Z  

---

## 1. Observation

1. **Client-side directive and skeleton default in PDP:**
   - File: `frontend/src/app/products/[slug]/page.tsx`
   - Line 1: `'use client';`
   - Lines 28–30:
     ```tsx
     const [product, setProduct] = useState<Product | null>(null);
     const [selectedImage, setSelectedImage] = useState<string>('');
     const [isLoading, setIsLoading] = useState<boolean>(true);
     ```
   - Lines 67–82:
     ```tsx
     if (isLoading) {
       return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <Skeleton className="aspect-square w-full rounded-2xl" />
             ...
     ```
   - Lines 35–65: `catalogService.getProductBySlug(slug)` is called exclusively inside `useEffect()`, which only executes in the browser after hydration. Consequently, initial SSR HTML emitted by Next.js contains only skeletons without product content.

2. **Next.js & React Framework versions:**
   - File: `frontend/package.json`
   - Line 17: `"next": "^15.2.1"`
   - Line 18: `"react": "^19.0.0"`
   - Build output from `npm --prefix frontend run build` (task-51):
     `▲ Next.js 15.5.28`
     `├ ƒ /products/[slug]                     5.33 kB         128 kB`
     `ƒ (Dynamic)  server-rendered on demand`

3. **Backend endpoint and catalog service:**
   - Backend file: `backend/src/main/java/com/varellion/store/catalog/controller/ProductController.java`
   - Lines 52–56:
     ```java
     @GetMapping("/{identifier}")
     public ResponseEntity<ApiResponse<ProductDto>> getProductByIdentifier(@PathVariable String identifier) {
         ProductDto product = productService.getProductByIdentifier(identifier);
         return ResponseEntity.ok(ApiResponse.success(product));
     }
     ```
   - Frontend service: `frontend/src/services/api.ts` lines 365–388: `catalogService.getProductBySlug(slug: string): Promise<Product | null>`. Returns `null` on HTTP 404.

4. **Environment configuration & URL resolution:**
   - File: `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8080/api`.
   - File: `compose.prod.yml` line 30: `NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}`.
   - File: `frontend/src/services/api.ts` line 4:
     ```ts
     const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
     export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
     ```
     If `NEXT_PUBLIC_API_URL` is relative (`/api`) in Docker, Node.js SSR `fetch('/api/products/...')` throws `TypeError: Failed to parse URL`. On server, resolution must detect `typeof window === 'undefined'` and support `INTERNAL_API_URL || 'http://localhost:8080/api'`.

5. **Existing test suite status:**
   - Command `npm --prefix frontend test` executed via Vitest v5.0.5:
     `Test Files  18 passed (18)`
     `Tests  79 passed (79)`
   - No existing tests for `products/[slug]` currently exist in `frontend/src/app/products/[slug]`.

---

## 2. Logic Chain

1. From Observation 1, because `page.tsx` starts with `'use client'` and sets `isLoading: true` by default, any web crawler (Googlebot, Bingbot, PerplexityBot, Claude-SearchBot) or OpenGraph scraper requesting `/products/[slug]` receives raw skeleton markup with no product metadata, no `<h1>`, no Arabic description, and no price.
2. From Observation 2, in Next.js 15, route parameters are asynchronous Promises: `props: { params: Promise<{ slug: string }> }`. Accessing `params.slug` synchronously in Next.js 15 triggers build errors and warnings. Both `generateMetadata` and `ProductDetailPage` must await `params`.
3. From Observation 3, `catalogService.getProductBySlug(slug)` returns `Product | null` directly. When it returns `null`, calling Next.js `notFound()` emits a valid HTTP 404 response status rather than a soft-404 HTTP 200, protecting search index health.
4. From Observation 4, server-side data fetching during SSR requires absolute URLs. A server-aware URL helper (`resolveApiBaseUrl`) prevents Node.js SSR fetch errors when `NEXT_PUBLIC_API_URL` is configured as a relative path `/api` in production containers.
5. Deduplicating requests between `generateMetadata` and `ProductDetailPage` via `React.cache(async (slug: string) => catalogService.getProductBySlug(slug))` guarantees that only a single backend HTTP fetch is dispatched per inbound request.
6. Dividing the component boundary between Server Component (`page.tsx`) and Client Component (`ProductDetailClient.tsx`):
   - `page.tsx` renders dynamic metadata, JSON-LD structured data script (`Product`, `Offer`, `BreadcrumbList`), and breadcrumb semantic markup, then mounts `<ProductDetailClient product={product} />`.
   - `ProductDetailClient.tsx` renders the visual gallery with interactive thumbnail switching (`selectedImage`), quantity increment/decrement controls, "أضف إلى سلة المشتريات" CTA with `useCart().addItem` and visual feedback, and "عرض السلة ومراجعة الطلب" CTA with `useCart().openCart()`.
   - In Next.js App Router, React renders `ProductDetailClient` on the server into complete initial HTML using the passed `product` prop. Thus, the initial HTML delivered over the wire contains full text, price, specs, and images—with zero skeletons and zero layout shift.

---

## 3. Caveats

- **Internal Docker Network URL:** In local development, `http://localhost:8080/api` works directly. In Docker production (`compose.prod.yml`), `INTERNAL_API_URL=http://backend:8080/api` must be available to Node.js if `NEXT_PUBLIC_API_URL` is set to `/api`. The proposed `resolveApiBaseUrl()` safely handles both scenarios.
- **Dynamic vs Static Generation:** Dynamic rendering (`[slug]`) without `generateStaticParams()` is recommended for real-time inventory and pricing accuracy. If build-time static generation (`SSG`) is desired in the future, `generateStaticParams` can query `catalogService.getProducts()`.
- **Cart Context Dependency:** `useCart()` relies on client-side state (`localStorage` and in-memory tokens), so cart mutation buttons must remain in `ProductDetailClient.tsx`.

---

## 4. Conclusion

The technical requirements, component boundaries, and Next.js 15 SSR implementation for R2 have been fully mapped and blueprinted. The comprehensive technical specification is recorded in:
`/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_2/report.md`

Key architectural decisions:
1. **Server Component (`page.tsx`):**
   - Asynchronous `params: Promise<{ slug: string }>`.
   - `generateMetadata`: dynamic title (`${product.nameAr} | VARELLION`), OpenGraph, Twitter, and canonical tags.
   - `notFound()` handling for missing products.
   - Inline JSON-LD structured data (`Product`, `Offer`, `BreadcrumbList`).
   - Breadcrumb navigation rendered in initial HTML.
2. **Client Component (`ProductDetailClient.tsx`):**
   - Single clean prop contract: `interface ProductDetailClientProps { product: Product; }`.
   - Interactive thumbnail gallery (`selectedImage`).
   - Explicit quantity increment/decrement controls.
   - Add to Cart with `useCart().addItem()` and 2200ms confirmation feedback.
   - Fast buy with `useCart().openCart()`.
3. **API URL Resolution:**
   - Update `api.ts` to support universal SSR absolute URL resolution.

---

## 5. Verification Method

To verify the findings and implementation plan:
1. **Inspect Blueprint:** Review `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_2/report.md`.
2. **Type Check & Build Validation:**
   ```bash
   npm --prefix frontend run type-check
   npm --prefix frontend run build
   ```
   Confirm `/products/[slug]` compiles as `ƒ (Dynamic)` with zero Next.js 15 async params warnings.
3. **Automated Test Suite:**
   ```bash
   npm --prefix frontend test
   ```
   Confirm all 79 tests pass and new unit tests for `ProductDetailPage` and `ProductDetailClient` pass.
4. **Invalidation Conditions:**
   - Any synchronous access to `props.params.slug` without `await` invalidates Next.js 15 compliance.
   - Any usage of relative URL `/api/...` in Node.js server fetch invalidates Docker SSR builds.
   - Retaining `'use client'` on `page.tsx` invalidates SSR HTML crawlability.
