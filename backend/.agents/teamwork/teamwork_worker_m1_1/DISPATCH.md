## 2026-11-10T17:24:12Z
You are teamwork_worker_m1_1, an implementation worker.
Your working directory is: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m1_1/
You must write your progress and reports inside your working directory.

MANDATORY: Read /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Read the project specifications at /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator/PROJECT.md.
Also review the authoritative explorer survey reports:
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_1/report.md
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_3/report.md

Relevant domain skills:
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/ai-seo/SKILL.md
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/schema/SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Exclusive Write Ownership:
- `frontend/src/lib/url.ts` (create)
- `frontend/src/app/robots.ts` (create)
- `frontend/src/app/sitemap.ts` (create)
- `frontend/public/llms.txt` (create)
- `frontend/src/components/seo/JsonLd.tsx` (create)
- `frontend/src/lib/seo/schema.ts` (create)
- `frontend/src/app/layout.tsx` (modify to add metadataBase and Organization & WebSite JSON-LD schemas)

Task — Implement Milestone 1 (AI Discovery, Crawlability & Schema Foundations):
1. `frontend/src/lib/url.ts`:
   Implement `getBaseSiteUrl(): string` reading `process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com'` and removing any trailing slashes (`replace(/\/+$/, '')`).
2. `frontend/src/app/robots.ts`:
   Implement `export default function robots(): MetadataRoute.Robots` per Next.js 15 metadata route standards:
   - Rules allowing `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, and `*`.
   - Disallow private paths: `['/admin', '/admin/*', '/checkout', '/checkout/*', '/profile', '/profile/*']`.
   - Sitemap pointing to `${getBaseSiteUrl()}/sitemap.xml`.
3. `frontend/src/app/sitemap.ts`:
   Implement `export default async function sitemap(): Promise<MetadataRoute.Sitemap>`:
   - Dynamic listing for 6 static pages (`/`, `/products`, `/policies/shipping`, `/policies/returns`, `/policies/terms`, `/track-order`).
   - Category query routes (`/products?category=${slug}`).
   - Product detail routes (`/products/${product.slug}`) with images.
   - Resilient build-time handling: wrap catalog fetching in `try/catch` and fall back gracefully to `mockProducts` and `mockCategories` from `frontend/src/data/mockProducts.ts` if the backend API is offline during `next build`.
4. `frontend/public/llms.txt`:
   Create standard-compliant `llms.txt` per VARELLION brand specifications:
   - Brand identity: luxury watches (316L stainless steel, sapphire glass, Miyota movements), 100% genuine full-grain leather goods (RFID protected), men's accessories in Egypt.
   - EGP pricing context.
   - Key policies: nationwide delivery to all 27 governorates in 24-72h, Cash on Delivery (COD), full inspection and examination before payment ("معاينة وفحص قبل الاستلام").
   - Structured markdown links.
5. `frontend/src/components/seo/JsonLd.tsx`:
   Reusable React component rendering `<script type="application/ld+json">` with XSS-safe serialization (replacing `<` with `\u003c`).
6. `frontend/src/lib/seo/schema.ts`:
   Create typed builder functions for Schema.org JSON-LD:
   - `buildOrganizationSchema(baseUrl: string)`
   - `buildWebSiteSchema(baseUrl: string)`
   - `buildProductSchema(product: Product, baseUrl: string)`
   - `buildBreadcrumbSchema(items: { name: string; item: string }[])`
7. `frontend/src/app/layout.tsx`:
   - Add `metadataBase: new URL(getBaseSiteUrl())` to the root `metadata`.
   - Render the `Organization` and `WebSite` JSON-LD schemas inside `<head>` or before `<body>` using `<JsonLd>`.
8. Verification:
   - Run `npm --prefix frontend run build` and ensure clean build with exit code 0.
   - Run `npm --prefix frontend test` and ensure all 79 tests pass.
   - Verify Arabic RTL and styling remain intact.

Deliverable:
Write a comprehensive handoff report to `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m1_1/handoff.md` detailing all files created/modified, build/test execution output, and verification results. Send a message to orchestrator when finished.
