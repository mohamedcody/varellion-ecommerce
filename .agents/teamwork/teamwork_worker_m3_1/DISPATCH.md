## 2026-11-10T18:23:45Z
You are teamwork_worker_m3_1, an implementation worker.
Your working directory is: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m3_1/
You must write your progress and reports inside your working directory.

MANDATORY: Read /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Read /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator/PROJECT.md.
Review previous milestone handoffs:
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m1_1/handoff.md
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m2_1/handoff.md
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_test_writer_1/handoff.md

Relevant domain skills:
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/ai-seo/SKILL.md
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/schema/SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Exclusive Write Ownership:
- `frontend/src/app/products/page.tsx` (add BreadcrumbList JSON-LD schema and semantic breadcrumb navigation)
- `frontend/src/services/api.ts` (minor hardening for malformed slug decode in getProductBySlug)
- `frontend/src/types/index.ts` (add optional primaryImage?: string to Product interface)

Task — Implement Milestone 3 (Catalog Breadcrumbs, Test Suite & Quality Gates):
1. `frontend/src/app/products/page.tsx`:
   - Inject Schema.org `BreadcrumbList` JSON-LD schema using `buildBreadcrumbSchema`:
     ```typescript
     const baseUrl = getBaseSiteUrl();
     const breadcrumbSchema = buildBreadcrumbSchema([
       { name: 'الرئيسية', item: baseUrl },
       { name: 'المنتجات', item: `${baseUrl}/products` },
     ]);
     ```
     Render `<JsonLd data={breadcrumbSchema} id="catalog-breadcrumbs-schema" />`.
   - Render semantic breadcrumb navigation at the top of the catalog container (`<nav aria-label="مسار التنقل">`) with links to `الرئيسية` (`/`) and `المنتجات` (`/products`), styled to match the luxury obsidian/gold palette and Arabic RTL design.
2. `frontend/src/services/api.ts`:
   - In `getProductBySlug`, wrap `decodeURIComponent(slug || '')` in a `try/catch` block to safely catch `URIError` on malformed percent-encoded input and return `null`.
3. `frontend/src/types/index.ts`:
   - Add optional `primaryImage?: string;` to `Product` interface if not already present.
4. Quality Gate Execution:
   - Run `npm --prefix frontend run type-check` to confirm zero TypeScript compilation errors.
   - Run `npm --prefix frontend run build` to confirm clean Next.js 15 production build with zero errors.
   - Run `npm --prefix frontend test` to verify that all 24 test files (18 existing + 6 new SEO test suites) pass cleanly.
   - Verify Arabic RTL (`dir="rtl"`), Tajawal typography, and styling preservation.

Deliverable:
Write a comprehensive handoff report to `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m3_1/handoff.md` and send a message to orchestrator when finished.
