## 2026-11-10T17:25:59Z
You are teamwork_test_writer_1, an E2E and unit test suite writer.
Your working directory is: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_test_writer_1/
You must write your progress and reports inside your working directory.

MANDATORY: Read /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Read the project specifications at /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator/PROJECT.md.

Relevant domain skill:
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-test-writing/SKILL.md

Exclusive Write Ownership:
- `frontend/src/__tests__/seo/` (you own all test files created inside this new directory)
DO NOT modify any implementation source code files outside of `frontend/src/__tests__/seo/`.

Task:
Design and write comprehensive, opaque-box and contract-level test suites using Vitest and @testing-library/react for the VARELLION SEO, SSR, and Structured Data features:
1. `frontend/src/__tests__/seo/robots.test.ts`:
   - Verify `robots()` exports valid Next.js Robots metadata.
   - Verify allowed userAgents include `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, and `*`.
   - Verify disallow paths include `/admin`, `/admin/*`, `/checkout`, `/checkout/*`, `/profile`, `/profile/*`.
   - Verify sitemap URL points to `${baseUrl}/sitemap.xml`.
2. `frontend/src/__tests__/seo/sitemap.test.ts`:
   - Verify `sitemap()` returns entries for all 6 static pages (`/`, `/products`, `/policies/shipping`, `/policies/returns`, `/policies/terms`, `/track-order`).
   - Verify category URLs (`/products?category=...`) and product detail URLs (`/products/...`) are generated.
   - Verify base URL uses `NEXT_PUBLIC_SITE_URL` or `SITE_URL` if set, or defaults to `https://varellion.com`.
   - Verify error resilience: when backend fetch rejects, `sitemap()` catches the error and provides fallback entries without crashing.
3. `frontend/src/__tests__/seo/llms-txt.test.ts`:
   - Verify `frontend/public/llms.txt` exists and reads as valid markdown.
   - Verify presence of VARELLION brand statements (luxury watches, 100% genuine leather, accessories in Egypt).
   - Verify EGP pricing mentions.
   - Verify core policies: 27 governorates delivery in 24-72h, Cash on Delivery, full inspection before payment ("معاينة وفحص قبل الاستلام").
   - Verify markdown links to catalog and policy pages.
4. `frontend/src/__tests__/seo/schema.test.ts`:
   - Verify `buildOrganizationSchema(baseUrl)` produces `@type: Organization` with Egyptian context, logo, URL.
   - Verify `buildWebSiteSchema(baseUrl)` produces `@type: WebSite` with search target.
   - Verify `buildProductSchema(product, baseUrl)` produces `@type: Product`, `brand: VARELLION`, `offers: { priceCurrency: 'EGP', availability: 'https://schema.org/InStock' }`.
   - Verify `buildBreadcrumbSchema(items)` produces `@type: BreadcrumbList` with 1-based positions.
   - Verify `JsonLd` component serializes JSON and escapes `<` to `\u003c` to avoid XSS.
5. `frontend/src/__tests__/seo/product-metadata.test.ts`:
   - Verify dynamic metadata generation for product pages (`generateMetadata({ params })`), asserting Title, Description, OpenGraph, Twitter, and canonical URL.
6. `frontend/src/__tests__/seo/rtl-preservation.test.ts`:
   - Verify `layout.tsx` HTML attributes `dir="rtl"` and `lang="ar"`, font classes, and `metadataBase`.

Verification:
Run `npm --prefix frontend test` using your tool to ensure all tests run cleanly (or expect pending implementation tests to fail cleanly until Worker completes, using graceful assertions or checking contract types).
Deliverable:
Write a handoff report to `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_test_writer_1/handoff.md` and send a message to orchestrator when finished.
