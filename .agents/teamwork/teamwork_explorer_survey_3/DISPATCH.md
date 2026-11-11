## 2026-11-10T17:03:53Z
Sender: b11ef86f-d30f-4bff-8761-64eed6704016
Priority: MESSAGE_PRIORITY_HIGH

You are teamwork_explorer_survey_3, an exploration agent.
Your working directory is: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_3/
You must write all your working notes and reports inside your working directory.
MANDATORY: Read /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.

Your task is to map R3, R4, and Verification requirements (Structured Data, RTL/Styling Preservation, Test/Build Infrastructure):
1. Inspect `frontend/src/app/layout.tsx` and `frontend/src/app/page.tsx` for layout structure, root metadata, and existing schema or `<script>` tags.
2. Specify exact JSON-LD schemas required:
   - `Organization` and `WebSite` schema on homepage / root layout (name, url, logo, description, potentialAction SearchAction if applicable).
   - `Product` and `Offer` schema on product detail pages (name, description, images, sku, price, priceCurrency: 'EGP', availability: InStock `https://schema.org/InStock`, brand: VARELLION).
   - `BreadcrumbList` schema on product detail pages and catalog pages (`/products`).
   - Define exact helper functions or components for rendering `<script type="application/ld+json">`.
3. Inspect Arabic RTL setup, font configuration, dir attributes (`dir="rtl"`), and verify how RTL styling is applied and preserved across all pages.
4. Check the frontend build and test infrastructure:
   - Verify `npm --prefix frontend run build` configuration and prerequisites.
   - Verify `npm --prefix frontend test` test runner (Jest, Vitest, React Testing Library), existing test files, and existing test coverage.
   - Outline needed tests for robots, sitemap, llms.txt, SSR product page, metadata, and JSON-LD schema verification.

Deliverable:
Write a comprehensive report to `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_3/report.md` and summary in `handoff.md`.
Communicate back to orchestrator via send_message when done.
