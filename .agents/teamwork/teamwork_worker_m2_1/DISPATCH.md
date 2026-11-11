## 2026-11-10T17:51:47Z
You are teamwork_worker_m2_1, an implementation worker.
Your working directory is: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m2_1/
You must write your progress and reports inside your working directory.

MANDATORY: Read /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Read the project specifications at /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator/PROJECT.md.
Also review the authoritative survey reports:
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_2/report.md (contains detailed blueprints for PDP SSR, metadata, Client Component split, and React.cache)
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_3/report.md (contains schemas, breadcrumbs, RTL preservation)

Relevant domain skills:
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/ai-seo/SKILL.md
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/schema/SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Exclusive Write Ownership:
- `frontend/src/services/api.ts` (update API URL resolution for server-side fetches)
- `frontend/src/app/products/[slug]/page.tsx` (refactor to Server Component)
- `frontend/src/app/products/[slug]/ProductDetailClient.tsx` (create Client Component)
- `frontend/src/lib/seo/schema.ts` (minor updates for defensive hardening & URI encoding)
- `frontend/src/components/seo/JsonLd.tsx` (defensive hardening against undefined data)

Task — Implement Milestone 2 (Product Page SSR, Dynamic Metadata & PDP Schemas):
1. `frontend/src/services/api.ts`:
   - Implement server-safe absolute URL resolution: when running in Node.js on server (`typeof window === 'undefined'`), ensure relative `/api` paths resolve to `process.env.INTERNAL_API_URL || 'http://localhost:8080/api'`, while client-side fetches use `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'`.
2. `frontend/src/lib/seo/schema.ts` & `frontend/src/components/seo/JsonLd.tsx`:
   - In `schema.ts`: wrap `product.slug` with `encodeURIComponent(product.slug)` and ensure `validImages` safely filters empty image objects before falling back to placeholder.
   - In `JsonLd.tsx`: protect against undefined data with `(JSON.stringify(data) || '{}')`.
3. `frontend/src/app/products/[slug]/ProductDetailClient.tsx`:
   - Create `'use client'` component.
   - Props interface: `export interface ProductDetailClientProps { product: Product; }`.
   - Implement interactive features:
     - Gallery thumbnail switching (`selectedImage` state, initialized to `product.primaryImage || product.images?.[0]?.imageUrl || ''`).
     - Quantity controls (`quantity` state, increment/decrement with minimum 1).
     - Add to Cart button with visual feedback ("تمت الإضافة إلى السلة ✓" for 2200ms) calling `useCart().addItem(product, quantity)`.
     - Review order / open cart drawer CTA calling `useCart().openCart()`.
4. `frontend/src/app/products/[slug]/page.tsx`:
   - Refactor from `'use client'` to an async Server Component (remove `'use client'`).
   - Route props typing in Next.js 15: `interface ProductPageProps { params: Promise<{ slug: string }>; }`. Await `const { slug } = await params;`.
   - Wrap product fetching in `React.cache(async (slug: string) => catalogService.getProductBySlug(slug))` to deduplicate requests between `generateMetadata` and `ProductDetailPage`.
   - Implement `generateMetadata({ params }: ProductPageProps): Promise<Metadata>`:
     - Dynamic title: `${product.nameAr} | VARELLION`
     - Description: `product.descriptionAr`
     - Canonical: `${baseUrl}/products/${product.slug}`
     - OpenGraph: `title`, `description`, `url`, `siteName: 'VARELLION'`, `locale: 'ar_EG'`, `type: 'website'`, `images: [product.primaryImage || ...]`
     - Twitter: `card: 'summary_large_image'`, `title`, `description`, `images`
     - If product is not found, return safe fallback metadata ("المنتج غير متوفر").
   - In `ProductDetailPage`:
     - If `!product`, call Next.js `notFound()`.
     - Build `productSchema` via `buildProductSchema(product, baseUrl)` and `breadcrumbSchema` via `buildBreadcrumbSchema(...)`.
     - Render `<JsonLd data={productSchema} id="product-jsonld" />` and `<JsonLd data={breadcrumbSchema} id="breadcrumb-jsonld" />` directly in initial SSR HTML.
     - Render semantic breadcrumbs, specs table (316L steel, sapphire crystal, Miyota quartz, genuine leather, RFID protection, Cairo origin), trust guarantees card (inspection before payment "معاينة وفحص قبل الاستلام", 27 governorates delivery in 24-72h, Cash on Delivery).
     - Mount `<ProductDetailClient product={product} />`.
     - Ensure initial HTML contains full product text, title, price, specs without relying on client skeletons!
5. Verification:
   - Run `npm --prefix frontend run build` to verify clean build with zero TypeScript or Next.js compilation errors.
   - Run `npm --prefix frontend test` to verify all tests pass.
   - Verify Arabic RTL and luxury design remain intact.

Deliverable:
Write a comprehensive handoff report to `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m2_1/handoff.md` and send a message to orchestrator when finished.
