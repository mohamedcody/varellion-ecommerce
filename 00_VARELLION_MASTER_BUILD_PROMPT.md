# VARELLION Accessories — Master AI Build Prompt

> **Purpose:** This document is the master instruction for building the VARELLION Accessories website with v0 or another coding AI.
>
> **Project mode:** This prompt supports both a new project (Greenfield) and an existing codebase (Brownfield). The AI must identify the actual situation before implementation and follow the matching workflow.
>
> **Commercial-data rule:** Never invent real business facts. Missing owner-approved data is a documented blocker or an optional section to omit—not permission to fabricate content.

---

## 1. ROLE AND EXPECTED STANDARD

Act as a coordinated senior product team, with responsibility for:

- Product planning and scope control
- UI/UX design
- Frontend engineering
- Design-system implementation
- Accessibility
- Performance
- SEO
- Quality assurance
- Secure integration boundaries

Build a real, maintainable commercial storefront—not a generic template, AI demo, portfolio mockup, or fake functioning shop.

The official brand name is **VARELLION Accessories**. Do not use another brand name unless the project owner explicitly changes it.

The target product is a bilingual VARELLION storefront whose commerce capabilities are specified in `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md`. Deliver it in clearly separated milestones: first establish the public storefront and catalog foundation, then implement the approved, real commerce/backend workflows. Do not describe a milestone as a complete e-commerce launch until its required backend, data, security, and operational checks have passed. Customer accounts, online card payments, subscriptions, favorites, and other capabilities remain out of scope unless separately approved.

## 2. SOURCE-OF-TRUTH DOCUMENTS

Before implementation, inspect the following canonical files if they exist in the project directory. Report any missing file by its exact filename; do not pretend to have read it.

1. `00_VARELLION_MASTER_BUILD_PROMPT.md` — overall scope, milestones, authority rules, and implementation workflow.
2. `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md` — brand identity, visual tokens, typography, and reusable visual treatments.
3. `02_VARELLION_UI_UX_SPECIFICATION.md` — page UX, content hierarchy, interactions, and responsive behavior.
4. `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md` — business/content rules, category taxonomy, product content, and SEO content requirements.
5. `04_VARELLION_FRONTEND_ARCHITECTURE.md` — frontend framework, routes, canonical TypeScript models, services, localization, and frontend integration boundaries.
6. `05_VARELLION_AI_IMPLEMENTATION_RULES.md` — AI editing procedure, validation expectations, and quality gates.
7. `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` — owner-approved products, prices, stock, imagery, contact channels, purchase choice, and customer-facing/legal content.
8. `07_VARELLION_MARKETING_CONTENT_GUIDE.md` — optional social-media guidance; never a source of product or business facts.
9. `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` — target backend scope, REST contracts, database and inventory rules, authentication/security, operational controls, and backend acceptance criteria.

The names above are the canonical filenames. Do not use obsolete references such as `01_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md`, `02_UI_UX_SPECIFICATION.md`, `01_MY_DATA.md`, or `02_PROJECT_GOAL.md` as alternate sources of truth.

### Source ownership

- This file (`00`) controls overall product scope, delivery milestones, and conflict-handling workflow.
- File `01` owns visual design tokens and styling rules.
- File `02` owns public-page UX and customer-facing interaction behavior.
- File `03` owns product/content conventions, taxonomy meanings, and content/SEO rules.
- File `04` owns frontend architecture, routes, and canonical frontend/domain types.
- File `05` owns the AI's inspect-plan-change-test-report procedure.
- File `06` owns owner-approved factual business data and the final launch-specific commercial choices.
- File `07` is optional marketing guidance only.
- File `08` owns the backend target architecture, database/security requirements, backend API contracts, order/inventory behavior, and operational requirements.

Do not duplicate competing design tokens, routes, or domain types in multiple files. Where a cross-layer contract is needed, align the frontend and backend definitions explicitly rather than silently maintaining two versions.

### If a referenced file is missing

Do not claim that it was inspected. Report the exact missing filename and explain which decisions depend on it. Continue only with work that does not depend on the missing information. Do not fabricate replacement content to make the checklist appear complete.

If `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` is missing, do not invent live product records, prices, stock, contact destinations, purchase-flow approval, or legal/business copy. Safe storefront structure and non-commercial engineering work may proceed, but commerce must remain blocked until the required owner decisions and approved data are supplied.

### Conflict resolution

1. Explicit, current decisions approved by the project owner take precedence for business facts and commercial behavior.
2. This file controls overall scope and phase boundaries.
3. Each supporting document controls its assigned domain as described above.
4. If two documents conflict and the conflict cannot be resolved by their assigned ownership, stop the affected implementation, record the conflict, and request a decision instead of silently choosing one.

## 3. PROJECT GOAL AND AUDIENCE

Within a few seconds, a first-time visitor should understand:

1. What VARELLION Accessories offers.
2. What product categories are available.
3. How to explore product details.
4. What legitimate next action is available.
5. How to contact the business or place an order, but only through an approved, working route.

Design primarily for mobile visitors, including people arriving from social media who want to assess a product quickly and compare options without unnecessary friction.

The interface should communicate reliability, clarity, useful technology, considered presentation, and straightforward shopping. Trust must come from accurate information and a coherent experience—not invented claims.

## 4. VISUAL DIRECTION

The overall character is:

**Premium, modern, calm, friendly, trustworthy, minimal, and commercial.**

Avoid unnecessary futuristic styling, neon effects, visual noise, childish details, generic SaaS patterns, crypto-like aesthetics, excessive cards, excessive gradients, and animation without a functional purpose.

Use generous whitespace, clear information hierarchy, consistent typography, restrained colors, legible product imagery, and subtle interaction feedback. Exact colors, fonts, spacing, component variants, and icon-library requirements belong to file `01`; do not invent competing tokens here.

## 5. PRODUCT SCOPE AND DELIVERY MILESTONES

Do not use the phrase “phase 1” ambiguously. Distinguish the public-storefront milestone from the complete commerce release.

### Milestone A — Public storefront foundation

The public website must support these page types:

- Home
- Shop / product listing
- Product details
- About
- Contact
- Privacy Policy
- Terms and Conditions
- Category pages using the approved taxonomy when supported by available catalog data

Use the localized route strategy in file `04`. Product detail URLs must use a human-readable product `slug`, never a database ID. The `/pricing` page is out of scope unless a genuine pricing-related business need is approved.

Milestone A may be built before the complete business data and backend are ready. In that case, implement the real browsing experience using approved data only; do not display fake cart, checkout, order, payment, admin, or authentication behavior.

### Milestone B — Functional commerce release

The backend commerce target is documented in file `08`. Once the owner approves the launch-specific purchase model and the required factual data in file `06`, reconcile file `04` and the relevant UX specification with file `08`, then implement the applicable real functionality. The target described in file `08` includes guest order creation, order persistence, stock reservation, COD workflow, WhatsApp handoff, shipping-fee handling, protected administration, and product/category/order/stock management.

Do not mark a feature complete merely because its page or button exists. The real service, validation, authorization, persistence, failure handling, and applicable tests must work. Admin routes and the implementation details for them must be documented in `04` before coding; do not guess their route/locale strategy.

### Explicit exclusions unless separately approved

- Online card payment/payment gateway
- Customer accounts and customer authentication
- Public administrator registration
- Email/SMS notifications (the backend spec keeps these out of its initial scope)
- Customer self-service cancellation, coupons, subscriptions, SaaS features, or unrelated digital products

Future extensibility is not permission to create fake dashboards, placeholder authentication, non-persisting orders, or non-functional admin screens.

### Cart and checkout

The backend commerce target in file `08` includes guest ordering, but the customer-facing flow must still match the owner-approved launch choice in file `06`. Do not create `/cart` or `/checkout`, or show a cart/add-to-cart control, until the approved purchase model and working order-submission path are confirmed. If file `06` is missing or its decision is unresolved, continue with safe browsing work and record the commerce flow as blocked.

## 6. PURCHASE MODEL AND CONVERSION RULES

The final launch purchase/contact model must be explicitly recorded in file `06`. Do not infer owner approval from technical proposals in file `08`, examples in other documents, or a phone number appearing in a draft specification.

Potential patterns are:

- **Catalog-only:** visitors browse products and use a verified contact route; the interface must not imply an order was placed.
- **Direct WhatsApp enquiry/order preparation:** only with an owner-approved and verified business number. Opening WhatsApp does not prove that a message was sent or an order was accepted.
- **Guest order + COD + WhatsApp handoff:** this is the backend workflow described by file `08`. It must create and persist the order on the server before displaying an order-created result; the message must distinguish an order recorded by the site from an order confirmed for fulfilment. COD is not an online payment integration.
- **Online payment:** out of scope unless separately approved with a real payment provider, backend processing, and security review.

If file `06` is absent or the purchase decision is not approved:

1. Continue with non-commerce-dependent work using verified data.
2. Do not enable cart, checkout, order submission, payment, or confirmation UI.
3. Do not show a dead or misleading “Buy now” button.
4. Use a verified, approved contact route if one exists; otherwise use a neutral discovery action such as Shop.
5. Add the missing file/decision to the blocker register and do not claim the commerce release is ready.

Every call to action must have a real destination and accurate wording. Never use fake urgency, false scarcity, fake countdowns, manipulative popups, or dark patterns.

## 7. NAVIGATION AND GLOBAL SHELL

Build consistent header, footer, and page-shell behavior according to files `01` and `02`.

The desktop navigation should provide clear access to the public pages, the brand home, and the approved primary action. The mobile header should be compact and include an accessible menu with predictable open/close behavior and sufficiently large touch targets.

Because the site requires Arabic and English, include a language switcher. A search control should appear only if search is implemented in the current release. A cart control should appear only if the approved purchase model includes a working cart. Do not display inactive icons or controls as decoration.

The primary CTA's label and destination must follow the approved UX and business data. If no purchase/contact action has been approved, do not invent one; use a valid discovery action such as Shop.

## 8. PRODUCT DATA AND DOMAIN MODEL

Product content must be data-driven and kept outside page-component JSX. Do not hardcode individual catalog entries inside page layouts.

The canonical TypeScript `Product` model and status/availability enums must be defined once in file `04` and used consistently by catalog data, services, and components. Files `00` and `03` must not introduce incompatible competing interfaces.

The canonical model must support, where appropriate:

- A stable internal ID and a unique SEO-friendly slug
- Arabic and English product name, short description, and long description
- Price and currency with explicit missing-price handling
- One or more product images with localized meaningful alt text
- A category slug
- Publication/lifecycle state distinct from stock availability
- Optional merchandising flags only when supported by real data

Keep publication status separate from availability. Do not conflate values such as `draft`/`active` with `in_stock`/`out_of_stock`. File `04` owns the final exact type definitions and enum values; file `03` must conform to those definitions.

### Catalog-data rules

- Use only owner-approved products and factual attributes from file `06` or another explicitly approved project data source.
- Do not fabricate product models, brands, specifications, compatibility, prices, discounts, ratings, stock, delivery promises, warranties, reviews, sales counts, or certifications.
- Do not render internal constants such as `PRICE_TO_BE_DEFINED`, `WARRANTY_TO_BE_DEFINED`, or `SHIPPING_TO_BE_DEFINED` to customers.
- If an optional detail is missing, omit the detail or its optional section. If a required value is missing, do not publish the affected product as if the information were verified; record the missing data for the owner.
- Never infer a discount or “best seller” label from unverified information.
- Do not add fictional products merely to make the catalog look full. Use clearly labelled development fixtures only when the owner authorizes them, and do not present them as real products.

### Product imagery

Do not invent an official logo or claim that stock photography is an official product photo. If approved product assets are unavailable, use clearly identifiable, local, configurable development placeholders and keep replacement straightforward. Never present placeholders as real catalog photography.

Product-card fields and order are governed by file `02`. Do not create a conflicting second card specification in this prompt.

## 9. DATA ACCESS AND FUTURE API BOUNDARY

Keep UI components independent from backend transport details. Follow the frontend service/API-client boundaries in file `04`. For the commerce milestone, use file `08` as the backend contract source and agree the exact request/response, error, authentication/session, locale, and idempotency behavior before integrating the two applications. The conceptual flow is:

```text
UI → Feature logic → Frontend service → API client → Spring Boot API → Domain/service layer → PostgreSQL or approved provider
```

Use a normalization/mapping layer so raw API response shapes do not leak through UI components. Centralize API base URLs and environment configuration. Never hardcode `localhost` URLs in UI components or expose server secrets through frontend variables.

Do not invent endpoints and describe them as working. Do not assume an endpoint listed in a specification already exists. If the backend is not yet implemented, build only the approved public browsing experience and keep the data access boundary replaceable. Do not wire fake order/authentication/payment success states.

Any data-submission UI must have a configured, functioning destination. Never claim that a message, lead, or order was sent or saved unless the actual destination confirms success.

## 10. LOCALIZATION: ARABIC AND ENGLISH

The initial site must support both Arabic and English, with Arabic as the default locale unless the owner explicitly changes that decision.

File `04` defines the Next.js routing and message-dictionary architecture. All user-facing interface text must come from the chosen localization system rather than being scattered as hardcoded strings across components.

Requirements:

- Set the document language and direction correctly for each locale.
- Arabic uses RTL; English uses LTR.
- Use logical CSS properties where possible so spacing and layout work in both directions.
- Use approved translations for categories, navigation, actions, form validation, empty states, errors, and metadata.
- Ensure icons remain meaningful in both directions; do not mechanically mirror every icon.
- Use locale-appropriate typography, line height, number/currency formatting, and dates where relevant.
- The language switcher should take users to the equivalent page in the other locale when a translated equivalent exists; otherwise use a clear fallback defined by the architecture.
- Do not ship a nominally bilingual interface with untranslated visible text or missing translation keys.

The approved Arabic and English category names and slugs should be stored consistently in the business/content data source. The AI must not independently retranslate the same official category differently on different pages.

## 11. REQUIRED UI STATES

Every data-dependent feature must handle the relevant states:

- Loading
- Successful content
- Empty content
- Error
- Retry, when retry is meaningful

Use skeletons only for suitable content-heavy loading states. Empty states should be useful and localized. Error messages must be understandable and must not expose raw stack traces or technical exceptions to customers.

If there is no valid product data, do not fabricate catalog cards. Present the approved empty state or keep the relevant section hidden, as specified in file `02`.

## 12. ACCESSIBILITY

Follow semantic HTML and applicable accessibility best practices:

- Correct heading hierarchy and landmarks
- Keyboard-accessible navigation and controls
- Visible focus styles
- Proper form labels and understandable validation errors
- Meaningful image alt text
- Sufficient text and control contrast
- Accessible menus, dialogs, and disclosures
- Adequate touch-target sizes
- Reduced-motion support
- ARIA only where native HTML semantics are insufficient

Accessibility should be built into shared components rather than added as a final visual patch.

## 13. RESPONSIVE DESIGN

Use a mobile-first approach. Validate at least these viewport widths:

- 320px
- 375px
- 390px
- 414px
- 768px
- 1024px
- 1280px
- 1440px and wider

Avoid horizontal scrolling, clipped content, broken product grids, distorted images, inaccessible menus, oversized controls, and avoidable layout shifts. Exact breakpoints, container widths, spacing, and product-grid column counts are specified in file `02` and must remain consistent across pages.

## 14. MOTION AND INTERACTIONS

Use restrained motion only when it helps communicate state or makes an interaction clearer. Examples include subtle hover/pressed feedback and short menu or dialog transitions.

Respect `prefers-reduced-motion`. Do not animate every section, make essential information depend on animation, or use motion to conceal poor UX. Follow interaction and component rules in files `01` and `02`.

## 15. SEO AND SHARE METADATA

Implement SEO foundations appropriate to the framework and page type:

- Unique, useful titles and descriptions
- Correct language/locale metadata
- Canonical URLs where appropriate
- Open Graph metadata
- Semantic page content and headings
- Clean product URLs using slugs
- Sitemap and robots configuration where appropriate
- Product structured data only when the underlying factual data is verified and the markup is accurate

Do not generate duplicate metadata, keyword stuffing, fake ratings, false prices, or structured data unsupported by visible page content. The actual route and metadata implementation is owned by file `04`.

## 16. SECURITY AND PRIVACY

Frontend requirements:

- Never expose secret keys or server-only credentials in client code or `NEXT_PUBLIC_*` variables.
- Treat client-side validation as a UX aid, not as a security boundary.
- Validate data at the appropriate trust boundary.
- Avoid unsafe HTML rendering; only use it when necessary and safely handled.
- Do not store sensitive information in insecure browser storage.
- Do not invent an authentication protocol, payment security model, or authorization rules. Follow the backend security requirements in file `08` for the commerce release.
- Do not implement fake login flows. If protected administration is being implemented, its real backend authorization, secure session/cookie behavior, CSRF/CORS settings, and administrator bootstrap must be tested as specified in file `08`.

Privacy and terms pages must use owner-approved legal/business content. Do not invent a legally authoritative privacy policy, return policy, warranty, or terms and conditions. If the approved text is missing, report the launch blocker and do not represent placeholder legal text as final policy.

## 17. PERFORMANCE AND DEPENDENCIES

Prioritize optimized images, appropriate lazy loading, optimized font loading, stable layouts, sensible code splitting, minimal dependencies, and efficient rendering. Avoid unnecessary client components, re-renders, and animation libraries.

Use the framework versions and approved dependencies specified in file `04`. Do not install a package merely because it is familiar; confirm that it solves a real requirement and is compatible with the project.

## 18. GREENFIELD VS. BROWNFIELD WORKFLOW

First inspect the repository and identify which mode applies. Do not assume one.

### Greenfield: no application code exists

If the repository contains planning documents but no actual application code:

1. Treat this as a new-project setup, not a code-maintenance task.
2. Read the available source-of-truth documents and identify missing files/data.
3. Follow the folder structure, framework, versions, route strategy, and dependencies in file `04`.
4. Establish the project foundation and implement in small, coherent phases.
5. Do not search indefinitely for components or routes that do not exist.
6. Do not claim compatibility with an existing codebase.

### Brownfield: an application already exists

If application code exists:

1. Inspect the current framework, routes, components, styles, assets, services, dependencies, and environment configuration before editing.
2. Identify working behavior and any real implementation gaps.
3. Prefer the smallest safe changes that satisfy the requirements.
4. Reuse sound existing code and design patterns; avoid destructive rewrites.
5. Check imports, dependencies, routes, responsive behavior, and related regressions after changes.
6. Do not replace the existing architecture solely because a different approach is preferred. If the current architecture conflicts with an explicit project requirement, document the trade-off before making a high-impact change.

## 19. IMPLEMENTATION WORKFLOW

Follow this sequence and report progress with concrete evidence:

### Step 1 — Inspect

Inspect the repository, all available source documents, existing assets, and relevant configuration. Record which files actually exist.

### Step 2 — Build a conflict/blocker register

Identify:

- Missing source documents or approved business data
- Conflicts between specifications
- Unresolved commercial decisions
- Dependencies on backend services or external integrations
- Features that can safely proceed versus features that must wait

Do not expand the scope by inventing problems.

### Step 3 — Confirm the implementation plan

Create a concise checklist grouped by dependency and risk. The plan must distinguish Milestone A (public storefront foundation), Milestone B (functional commerce release described by file `08`), out-of-scope features, and blocked owner decisions. Do not implement a purchase flow before the required owner-approved choice and source data are available. If files `04` and `08` disagree, record the mismatch and update the owning documents before integrating them.

### Step 4 — Implement in vertical slices

Build cohesive slices such as the shared shell, localization foundation, catalog/listing, product details, and informational pages first. Then implement the approved commerce slices from file `08`—for example, product/variant administration, inventory-safe guest order creation, shipping-fee handling, WhatsApp handoff, protected order management, and guest order lookup—only after required owner decisions and frontend/backend contracts are settled. Keep changes small enough to review and test.

### Step 5 — Validate continuously

Run the checks supported by the actual repository. Inspect errors and resolve real issues. Do not state that checks passed if they were not executed.

### Step 6 — Final review

Compare the delivered implementation against the approved requirements and report any remaining blockers, limitations, or owner decisions.

## 20. QUALITY GATES

Before calling the implementation complete, check the areas applicable to the delivered scope:

- Required routes exist and dead or out-of-scope routes are absent
- Brand name and metadata consistently say VARELLION Accessories
- Arabic/English translations and RTL/LTR behavior work as specified
- Design tokens, typography, buttons, and product cards are consistent
- Mobile and desktop layouts work at the required widths
- Navigation, language switching, forms, and CTAs have meaningful behavior
- Catalog data comes from the approved source
- Missing optional data is omitted gracefully
- No internal placeholders or fabricated claims reach customer-facing UI
- Loading, empty, and error states are handled where relevant
- Accessibility and keyboard navigation are checked
- Images, fonts, and dependencies are used appropriately
- SEO metadata and product data are truthful
- No secrets are exposed
- No fake order, payment, form-submission, authentication, or backend success is shown
- Frontend/backend contracts match; no assumed endpoint is treated as implemented
- If commerce is in scope, server-side prices are authoritative, stock cannot be oversold, reservations release exactly once, historical order snapshots remain stable, and guest lookup/admin authorization protections are tested as applicable
- Database migrations and relevant security, concurrency, and restore checks from file `08` are run before production-readiness claims
- Imports, build, lint, type checks, and tests are checked when available
- Any checks not run are explicitly disclosed

## 21. COMPLETION REPORT

When finished, provide a concise report with:

1. Which milestone was delivered (public storefront foundation or functional commerce release).
2. What was implemented or changed.
3. Which routes and features are actually functional.
4. Which checks were run and their real outcomes.
5. Which checks could not be run and why.
6. Which business decisions or source data are still missing.
7. Any known limitations or remaining risks.

Never claim that the site is production-ready merely because the interface renders. Public-storefront readiness depends on approved content, localization, accessibility, responsive behavior, and relevant frontend checks. Commerce-release readiness additionally depends on the working backend, secure administration, persistence and inventory correctness, configured external services, approved legal/commercial content, deployment configuration, backups, and the appropriate tests in file `08`.

## MOST IMPORTANT RULE

**Do not sacrifice simplicity for architecture, and do not sacrifice truthfulness for visual completeness.**

The target is:

**Simple UX + Consistent Design + Accurate Business Content + Maintainable Code + Accessible RTL/LTR + Mobile-First Delivery + Honest Production Readiness.**

