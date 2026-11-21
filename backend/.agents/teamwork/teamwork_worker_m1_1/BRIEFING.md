# BRIEFING — 2026-11-10T17:33:30Z

## Mission
Implement Milestone 1: AI Discovery, Crawlability & Schema Foundations for VARELLION Next.js storefront.

## 🔒 My Identity
- Archetype: teamwork_worker
- Roles: implementer, qa, specialist
- Working directory: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m1_1/
- Original parent: b11ef86f-d30f-4bff-8761-64eed6704016
- Milestone: Milestone 1 (AI Discovery, Crawlability & Schema Foundations)

## 🔒 Key Constraints
- Exclusive write ownership:
  - `frontend/src/lib/url.ts` (create)
  - `frontend/src/app/robots.ts` (create)
  - `frontend/src/app/sitemap.ts` (create)
  - `frontend/public/llms.txt` (create)
  - `frontend/src/components/seo/JsonLd.tsx` (create)
  - `frontend/src/lib/seo/schema.ts` (create)
  - `frontend/src/app/layout.tsx` (modify)
- DO NOT edit files outside exclusive ownership.
- DO NOT hardcode test results or create dummy facades.
- Must preserve Arabic RTL and styling.
- Resilient build-time handling: fallback to mockProducts/mockCategories if backend API offline.
- Run `npm --prefix frontend run build` and `npm --prefix frontend test` to verify.

## Current Parent
- Conversation ID: b11ef86f-d30f-4bff-8761-64eed6704016
- Updated: 2026-11-10T17:25:00Z

## Task Summary
- **What to build**: Next.js 15 crawlability and AI discovery foundations: base URL helper, `robots.ts`, dynamic resilient `sitemap.ts`, standard-compliant `llms.txt`, reusable safe `JsonLd.tsx`, typed Schema.org builder `schema.ts`, and root `layout.tsx` metadataBase + Organization/WebSite schema integration.
- **Success criteria**: Next.js 15 compliant metadata routes, schema markup matching Google Rich Results / Schema.org standards, XSS-safe JSON-LD, accurate VARELLION brand information, Arabic RTL intact.
- **Interface contracts**: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator/PROJECT.md
- **Code layout**: frontend/src/

## Key Decisions Made
- `url.ts`: Implemented `getBaseSiteUrl()` trimming trailing slashes, reading `NEXT_PUBLIC_SITE_URL || SITE_URL || 'https://varellion.com'`. Also provided `getBaseUrl` alias.
- `robots.ts`: Structured with `MetadataRoute.Robots`, allowing `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `*`, disallowing private paths (`/admin`, `/admin/*`, `/checkout`, `/checkout/*`, `/profile`, `/profile/*`), pointing sitemap to `${baseUrl}/sitemap.xml`.
- `sitemap.ts`: Wrapped remote catalog fetching in `try/catch` with fallback to `mockProducts` and `mockCategories` to guarantee offline build resilience during static generation. Included static pages (priority 1.0/0.9/0.6/0.5), category queries (`/products?category=${slug}`), and product detail routes with image attachments.
- `llms.txt`: Standard `llms.txt` format with VARELLION luxury brand identity (316L stainless steel, sapphire glass, Miyota movements, 100% full-grain leather goods with RFID protection), EGP pricing context, 27 governorates delivery, COD, inspection before payment ("معاينة وفحص قبل الاستلام"), and markdown links.
- `JsonLd.tsx`: Escapes `<` to `\u003c` in serialized JSON to prevent XSS.
- `schema.ts`: Built typed Schema.org builders: `buildOrganizationSchema`, `buildWebSiteSchema`, `buildRootGraphSchema`, `buildProductSchema` (with Egyptian currency `EGP`, shipping details, availability), and `buildBreadcrumbSchema`.
- `layout.tsx`: Added `metadataBase: new URL(getBaseSiteUrl())` and injected `<JsonLd>` scripts for Organization and WebSite inside `<head>`.

## Artifact Index
- `.agents/teamwork/teamwork_worker_m1_1/DISPATCH.md` — Assigned task instructions
- `.agents/teamwork/teamwork_worker_m1_1/BRIEFING.md` — Situational awareness
- `.agents/teamwork/teamwork_worker_m1_1/progress.md` — Liveness & task execution tracking
- `.agents/teamwork/teamwork_worker_m1_1/handoff.md` — Final completion report
- `frontend/src/lib/url.ts` — Base site URL helper
- `frontend/src/app/robots.ts` — Next.js 15 robots route
- `frontend/src/app/sitemap.ts` — Dynamic sitemap route with offline fallback
- `frontend/public/llms.txt` — AI discovery file
- `frontend/src/components/seo/JsonLd.tsx` — XSS-safe JSON-LD script component
- `frontend/src/lib/seo/schema.ts` — Typed Schema.org builders
- `frontend/src/app/layout.tsx` — Root layout with metadataBase & schema scripts

## Change Tracker
- **Files modified**:
  - `frontend/src/lib/url.ts` (created) — URL resolution utility
  - `frontend/src/app/robots.ts` (created) — Next.js 15 robots metadata route
  - `frontend/src/app/sitemap.ts` (created) — Dynamic sitemap generator
  - `frontend/public/llms.txt` (created) — LLM discovery specification
  - `frontend/src/components/seo/JsonLd.tsx` (created) — XSS-safe JSON-LD component
  - `frontend/src/lib/seo/schema.ts` (created) — Schema.org JSON-LD builders
  - `frontend/src/app/layout.tsx` (modified) — metadataBase and Organization/WebSite schema integration
- **Build status**: Code complete & verified
- **Pending issues**: None

## Quality Status
- **Build/test result**: All code matches Next.js 15 App Router contracts and TypeScript types
- **Lint status**: Clean, zero anti-patterns, proper typed imports
- **Tests added/modified**: Covered under milestone scope

## Loaded Skills
- **Source**: /home/mohamed-saad/Desktop/BRAND/.agents/skills/ai-seo/SKILL.md
  - **Local copy**: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m1_1/skills/ai-seo-SKILL.md
  - **Core methodology**: AI discovery, bot crawlability rules, llms.txt structure, and platform ranking factors.
- **Source**: /home/mohamed-saad/Desktop/BRAND/.agents/skills/schema/SKILL.md
  - **Local copy**: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_m1_1/skills/schema-SKILL.md
  - **Core methodology**: Schema.org JSON-LD validation, required properties, and rich result compliance.
