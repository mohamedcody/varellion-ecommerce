# VARELLION Accessories — Frontend Architecture

> **Document type:** Technical architecture specification  
> **Project:** VARELLION Accessories  
> **Version:** 1.2.0  
> **Status:** Canonical frontend architecture, aligned with the Milestone A / Milestone B delivery model  
> **Last reviewed:** 2026-10-12  
> **Framework:** Next.js App Router + React + TypeScript  
> **Styling:** Tailwind CSS  
> **Locales:** Arabic (`ar`, default) and English (`en`)  
> **Architecture goal:** A maintainable, accessible, SEO-ready, independently buildable frontend that can use approved local catalog data in Milestone A and integrate with the Java/Spring Boot backend defined in file `08` when Milestone B is approved and implemented.

---

## 1. Purpose and Authority

This document is the single source of truth for the technical structure of the VARELLION frontend. It owns:

- Framework and dependency decisions.
- Application folder structure and naming conventions.
- Route patterns and locale routing.
- Canonical TypeScript domain models and status values.
- Data, service, mapper, and future API boundaries.
- Environment configuration, SEO implementation, testing, and deployment guidance.

It does **not** own brand colors and visual tokens, page-level UX content, or factual business data. Those responsibilities belong to:

| File | Responsibility |
|---|---|
| `00_VARELLION_MASTER_BUILD_PROMPT.md` | Overall project scope, phase boundaries, and implementation process |
| `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md` | Brand identity, typography, colors, design tokens, and component styling |
| `02_VARELLION_UI_UX_SPECIFICATION.md` | Page UX, component presentation, responsive behavior, and interactions |
| `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md` | Business/content rules, category meanings, and product-content requirements |
| `04_VARELLION_FRONTEND_ARCHITECTURE.md` | Technical architecture, routes, domain types, and integration boundaries |
| `05_VARELLION_AI_IMPLEMENTATION_RULES.md` | AI editing procedure, validation rules, and quality gates |
| `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` | Owner-approved products, contact details, purchase model, and approved site/legal copy |
| `07_VARELLION_MARKETING_CONTENT_GUIDE.md` | Social-media and marketing content guidance outside the core frontend architecture |
| `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` | Backend target architecture, database/domain behavior, REST API outline, admin authentication/authorization, order and inventory integrity, security, operations, and backend quality gates |

### Cross-layer authority

- This file is authoritative for the **frontend** architecture, frontend domain types, routes, UI-to-service boundaries, frontend environment configuration, and frontend validation.
- File `08` is authoritative for the **backend** architecture, PostgreSQL persistence, backend security, order lifecycle, inventory reservations, backend API target, and operational requirements.
- File `06` remains authoritative for owner-approved business facts and launch decisions. The absence of file `06`, or a missing approval within it, is a blocker for the affected commercial feature—not permission to guess.
- The endpoint outline in file `08` is a target contract, not proof that the endpoint has been implemented or deployed. Before frontend and backend are integrated or built in parallel, record and review the concrete request/response DTOs, error shape, authentication/session behavior, CSRF/CORS behavior, locale handling, and status semantics. Do not silently resolve a contract mismatch inside a component or with unsafe casts.

If a referenced file is absent, report that fact. Do not claim to have inspected it, and do not invent data to compensate for its absence.

## 2. Non-Negotiable Principles

1. **Start with the smallest sufficient architecture.** Do not build an enterprise framework for a small storefront.
2. **Keep product data out of page JSX.** Pages render data provided by a feature service or approved data source.
3. **Define domain types once.** Components, local catalog data, and future API mapping must share the types in this document.
4. **Separate publication from stock availability.** A draft product is not the same thing as an out-of-stock product.
5. **Treat missing commercial data honestly.** Do not convert unknown price, inventory, compatibility, shipping, or warranty information into a guess or customer-facing placeholder token.
6. **Use Arabic and English throughout the public site.** Arabic is the default locale; `ar` is RTL and `en` is LTR.
7. **Use explicit release gates.** Milestone A is the public storefront foundation. Milestone B adds only the approved, real commerce and protected-admin behavior described by files `00`, `02`, `06`, and `08`; do not treat a proposed backend feature as implemented merely because it is documented.
8. **Keep future and unapproved features out.** Do not scaffold fake authentication, orders, checkout, admin, or SaaS pages. Milestone B features still require approved business decisions, a reviewed frontend/backend contract, real backend behavior, and tests.
9. **Do not claim checks passed unless they were run.** Record commands, results, and any remaining blockers honestly.

## 3. Project Mode: Greenfield vs. Brownfield

The implementation agent must identify which situation actually exists before changing code.

### 3.1 Greenfield — no usable application code exists

- Inspect files `00`–`05` and `08` if present, and check whether file `06` exists before planning the implementation.
- Build Milestone A first unless the owner has explicitly approved and resourced Milestone B. Set up dependencies, scripts, strict TypeScript, styling, locale routing, and only the routes required by the approved milestone.
- Create no empty folders solely to match the tree below.
- Keep the initial catalog empty or use only records explicitly approved in file `06`; development fixtures must be clearly separated from production data.
- Do not generate fake products, prices, reviews, policies, contact details, order IDs, inventory, authentication, or purchase confirmations.
- For Milestone B, do not begin commerce/admin integration until the purchase model, required content, route decisions, and concrete frontend/backend API contract are documented and approved.

### 3.2 Brownfield — a working project already exists

- Inspect `package.json`, the lockfile, routes, components, styles, assets, data, dependencies, environment variables, tests, and the real backend/API contract (if one exists) before editing.
- Preserve working behavior and the existing package manager.
- Do not automatically upgrade Next.js, React, or Tailwind across major versions just to match the preferred greenfield baseline.
- Map the current code to this architecture and the applicable milestone; make the smallest safe set of changes and explain material deviations before destructive migrations.
- If a backend exists, verify its actual routes, DTOs, auth/session behavior, CSRF/CORS settings, and test state rather than assuming file `08` already describes a deployed implementation.
- If the project already has a working localization system or API boundary, evaluate it before replacing it.

Never mix these modes: do not look for a prior codebase that does not exist, and do not overwrite an existing codebase as if it were empty.

## 4. Technology Baseline and Dependencies

### 4.1 Greenfield baseline

For a new project, use the following major-version baseline and pin the exact versions in the package manifest and lockfile at implementation time:

| Technology | Baseline | Rule |
|---|---|---|
| Next.js | 16.x App Router | Use the stable release line and the current official setup instructions when creating the project. |
| React / React DOM | Compatible React 19.x release | Keep `react` and `react-dom` compatible with the chosen Next.js release. |
| TypeScript | Stable version supported by the selected Next.js release | Enable strict type checking. |
| Tailwind CSS | 4.x | Use the v4 CSS-first setup; do not mix v3 directives/configuration with v4 setup. |
| `next-intl` | 4.x | Use as the single locale-routing and message-formatting solution for a new App Router project. |
| `lucide-react` | Current compatible stable release | This is the only icon library for UI icons, as required by file `01`. |

Exact patch versions are intentionally stored in `package.json` and the lockfile, rather than duplicated in multiple planning documents. Verify current compatibility at implementation time.

### 4.2 Brownfield dependency policy

- Keep the versions already installed unless a real issue requires a change.
- Do not upgrade a working Tailwind v3 project to v4 as an incidental part of an unrelated task.
- Do not add a second localization, icon, state-management, or component library alongside an existing equivalent.
- Add dependencies only when they solve a documented requirement and their compatibility is verified.
- Do not install a global state-management library by default.

### 4.3 First-release dependency decisions

Use `next-intl` for a new project because the site requires locale-aware routes, translation messages, and localized number/date formatting. Keep this integration isolated under `src/i18n/` and do not combine it with a parallel custom i18n implementation.

Use `lucide-react` for interface icons. Prefer native React state and URL search parameters for the small initial catalog. Add a server-state or form library only if later requirements justify it.

## 5. Canonical Application Structure

Use the following as the target structure for a new project. It describes the public storefront foundation (Milestone A). Add commerce or admin feature folders only for approved Milestone B work; do not create empty folders to anticipate them.

```text
src/
├── app/
│   └── [locale]/
│       ├── (storefront)/
│       │   ├── page.tsx
│       │   ├── about/page.tsx
│       │   ├── products/page.tsx
│       │   ├── products/[slug]/page.tsx
│       │   ├── categories/[slug]/page.tsx
│       │   ├── contact/page.tsx
│       │   ├── privacy/page.tsx
│       │   └── terms/page.tsx
│       ├── (commerce)/                 # Milestone B only, after launch decisions and API contract are approved
│       │   ├── cart/page.tsx
│       │   └── checkout/page.tsx
│       ├── layout.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       └── not-found.tsx
├── components/
│   ├── ui/                             # Generic primitives only
│   ├── layout/                         # Container, header shell, footer shell
│   ├── navigation/                     # Navbar, mobile menu, language switcher
│   ├── feedback/                       # Empty/error/loading feedback
│   └── forms/                          # Generic form controls
├── features/
│   ├── products/
│   │   ├── components/
│   │   ├── services/
│   │   ├── mappers/
│   │   ├── types/
│   │   └── utils/
│   ├── categories/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── contact/                        # Only working contact behavior; no fake submission
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
├── messages/
│   ├── ar.json
│   └── en.json
├── config/
│   ├── env.ts
│   ├── site.ts
│   └── categories.ts
├── services/
│   └── api-client.ts                  # Add/use only when an actual API boundary exists
├── mocks/
│   └── products.ts                    # Approved local records only; may be empty
├── lib/
│   └── formatters/
│       ├── format-currency.ts
│       └── format-date.ts
├── styles/
│   └── globals.css
└── types/
    └── common.ts

messages/
  ar.json
  en.json

public/
  products/                            # Approved product images, if available
  brand/                               # Approved brand assets, if available
```

### Structure rules

- Do not create `auth`, `orders`, `favorites`, `admin`, or SaaS folders merely to make the tree look complete. The order and protected-admin features described by file `08` belong to Milestone B; create their frontend routes/features only after the relevant launch decisions, API contracts, and— for admin UI—an approved admin UX addendum are in place.
- Keep product-only components under `features/products/components/`; keep truly generic components under `components/ui/`.
- Do not create duplicate `services/` layers that call each other without a clear responsibility. A feature service may consume the shared API client when one is needed.
- `src/mocks/products.ts` is a Milestone A development data source, not permission to invent a production catalog. It must contain only owner-approved records or clearly identified, non-production fixtures explicitly permitted by the owner. In Milestone B, the API becomes the production source of truth for live catalog, price, and availability data once it is implemented and verified; do not silently fall back to stale local data when a live request fails.
- `src/config/site.ts` may expose only approved public website details. It is not a place for secrets or speculative business information.
- Do not add database entities, API DTOs, or backend authorization rules to this frontend tree. Keep the frontend domain model separate and map between it and the backend's reviewed contract.

## 6. Naming and Dependency Direction

### 6.1 Naming conventions

- React component files: `PascalCase.tsx`, e.g. `ProductCard.tsx`.
- Non-component TypeScript files: `kebab-case.ts`, e.g. `product-service.ts`, `product-mapper.ts`, `format-currency.ts`.
- React hooks: `use-kebab-case.ts`, with exported hook names in `camelCase`, e.g. `useCart`.
- Variables and functions: `camelCase`.
- Types and interfaces: `PascalCase`.
- Constants: descriptive names; use `UPPER_SNAKE_CASE` only for true constants where it improves clarity.

Do not mix file naming styles for the same kind of module. Avoid vague names such as `Stuff`, `Helper2`, `DataFinal`, or `Component1`.

### 6.2 Dependency direction

Prefer this direction:

```text
Route / Page
    ↓
Feature UI
    ↓
Feature service / domain utility
    ↓
Local approved data OR shared API client
    ↓
Backend, only when it actually exists
```

- Shared UI must not import product, cart, auth, or other business-feature logic.
- A feature must not import unrelated features without a documented reason.
- Services and data mappers must not depend on presentational components.
- Avoid circular imports.
- Business calculations must live in one domain utility/service, not be repeated across pages and components.

## 7. Locale Routing and Internationalization

### 7.1 Canonical locale decision

Use:

- Arabic locale: `ar`, default, `dir="rtl"`.
- English locale: `en`, `dir="ltr"`.
- URL strategy: locale prefix on every public route.
- Root route `/`: redirect to `/ar` in the first release for predictable default behavior.

Examples:

```text
/ar
/en
/ar/products
/en/products
/ar/products/approved-product-slug
/en/products/approved-product-slug
/ar/about
/en/about
/ar/contact
/en/contact
/ar/privacy
/en/privacy
/ar/terms
/en/terms
```

Do not silently change to domain-based routing, unprefixed Arabic routes, or a different locale strategy.

### 7.2 `next-intl` responsibilities

For a new project, centralize locale configuration in `src/i18n/routing.ts`, request/message loading in `src/i18n/request.ts`, and locale-aware navigation helpers in `src/i18n/navigation.ts`. Use the single request-interception file supported by the selected Next.js version; for Next.js 16 this is `proxy.ts`. Do not create both `middleware.ts` and `proxy.ts` to handle the same locale behavior.

The locale configuration must define exactly `ar` and `en`, with `ar` as the default locale. Reject unsupported locale segments with a proper not-found response rather than loading the wrong dictionary.

### 7.3 Messages and user-facing text

- Store interface messages in `messages/ar.json` and `messages/en.json`.
- Use stable message keys grouped by area (for example, `navigation`, `home`, `products`, `contact`, `errors`, `accessibility`).
- All reusable UI text, labels, form messages, loading/empty/error states, navigation, and metadata must use the localization system.
- Do not scatter one-off Arabic or English literals across reusable components.
- Do not silently fall back to English for a missing Arabic message or vice versa. Missing required keys must be caught during review/testing.
- Product and category content must come from approved localized catalog/config data, not from the interface dictionary unless it is genuinely UI copy.

### 7.4 HTML direction and fonts

The locale layout must set the document `lang` and `dir` correctly:

- `ar`: `lang="ar"`, `dir="rtl"`.
- `en`: `lang="en"`, `dir="ltr"`.

Load the approved fonts through `next/font` where supported: IBM Plex Sans Arabic for Arabic and Inter for English/Latin text, following file `01`. Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`, etc.) where practical. Do not mechanically flip every icon; check direction-sensitive icons individually.

### 7.5 Language switcher behavior

- Switch to the equivalent page in the other locale when that localized route exists.
- Preserve the product/category slug when the same slug is shared across locales.
- If an equivalent route does not exist, fall back to the target locale's Shop page or Home page according to file `02`.
- Do not switch the language while dropping query filters or search text when they can be preserved safely.
- The control must have a readable accessible label and work by keyboard and touch.

### 7.6 Localization and SEO

For each indexable localized page, generate a locale-appropriate title and description and appropriate canonical/alternate language metadata. Add `hreflang` alternatives only when the equivalent page actually exists. Avoid indexing duplicate URL variants or generating an alternate-language URL for missing/ unpublished content.

## 8. Canonical Route Scope

### 8.1 Required Milestone A public routes

| Route pattern | Purpose | Data/behavior rule |
|---|---|---|
| `/{locale}` | Home | Sections must reflect real, approved catalog/content availability. |
| `/{locale}/products` | Shop/listing | Uses published products only; search/filter/sort as defined in file `02`. |
| `/{locale}/products/[slug]` | Product details | Resolve by stable product slug, never expose an internal database ID as the public slug. |
| `/{locale}/categories/[slug]` | Category page | Use the approved six-category taxonomy; render the shared listing experience and category metadata. |
| `/{locale}/about` | About | Use only owner-approved business/brand copy. |
| `/{locale}/contact` | Contact | Show only configured, verified channels and any form that has a real submission destination. |
| `/{locale}/privacy` | Privacy Policy | Render approved legal copy; do not write an invented policy as if it were approved. |
| `/{locale}/terms` | Terms and Conditions | Render approved legal copy; do not write invented legal commitments. |

A category route may reuse the Shop listing component with a category constraint; it must not duplicate the entire listing implementation. Unknown category slugs must return a localized not-found state.

### 8.2 Commerce routes — Milestone B, conditional on approval and implementation

`/{locale}/cart` and `/{locale}/checkout` are not part of Milestone A. Create them in Milestone B only after all of the following are true:

1. File `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` records the owner-approved launch purchase model and required customer-facing commercial facts.
2. Product/variant selection, price and availability, order fields, known/unknown shipping-fee behavior, order success/failure semantics, and the WhatsApp handoff are covered by a reviewed frontend/backend contract aligned with file `08`.
3. The relevant backend endpoints are implemented and tested; a specification or route name alone is not enough.
4. The frontend has real loading, validation, duplicate-submission, error, and success states.

Rules:

- Do not make a decorative cart icon or a non-functional add-to-cart button.
- Do not simulate order IDs, price/stock validation, inventory reservation, shipping fees, database persistence, COD confirmation, or confirmation messages.
- The backend is authoritative for product/variant prices, stock reservations, discounts, shipping-fee status, and order totals. Client-calculated values are display hints only and must never be trusted as the submitted order's authoritative values.
- If the approved model uses the guest order + COD + WhatsApp handoff in file `08`, show an “order recorded” state only after the backend confirms persistence. Do not claim that an order is accepted for fulfilment merely because it was recorded or WhatsApp opened. If shipping is not yet known, do not present the total as final.
- If the approved model is direct WhatsApp enquiry only, do not add cart/checkout or claim that the website saved an order.
- If any required contract or backend operation is missing, record it as a blocker and leave the affected commerce path disabled.

### 8.3 Protected administrator routes — Milestone B

File `08` specifies a protected administrator dashboard for products, categories, variants/stock, shipping rates, orders, and related operational history. This is a Milestone B target—not a requirement to build a placeholder during Milestone A.

Before implementing admin routes, record the route and locale strategy in this file. The choice of localized versus unlocalized admin URLs is still a technical/product decision; do not silently assume a path. Also approve an admin UX addendum covering navigation, sign-in/sign-out, permission-denied states, product/category forms, stock and shipping-rate editing, order transitions, confirmations, audit/history visibility, and destructive-action safety.

Once approved, the admin UI must use the real protected backend contract. Hiding a route or button in the frontend is not authorization. The backend must enforce admin access on every protected operation according to file `08`; session cookies, CSRF, CORS, logout, and the pre-approved Google identity behavior must match the actual deployment. Do not put admin session secrets in client storage.

### 8.4 Explicit exclusions unless separately approved

Do not scaffold these as placeholders:

- Customer login/registration, profiles, or customer-account authentication.
- Customer order history, favorites, or notifications beyond the explicitly approved guest order-lookup behavior.
- SaaS dashboards, subscriptions, or team-management features.
- `/pricing` unless a real pricing-related business requirement is approved.

The protected **administrator** sign-in/dashboard in file `08` is distinct from customer authentication and is considered only in Milestone B under the gates above.

## 9. Route and Layout Structure

Use route groups to organize the code without adding route segments to URLs. The `(storefront)` group contains the Milestone A public pages. The `(commerce)` group is added only for an approved, implemented Milestone B purchase flow. Admin routing is a separate unresolved decision: document the selected route and locale strategy here before creating admin route files, and do not expose admin links in the public storefront.

Every page route should be thin: validate route parameters, load data through the relevant feature service, set metadata, and compose feature components. Do not put full catalog logic, business rules, API calls, stock calculations, order transitions, or authorization decisions directly into page JSX. Backend-controlled business rules remain enforced by the backend even when the frontend repeats basic validation for usability.

Use localized `not-found`, loading, and error UI where supported by the selected App Router structure. A missing, draft, archived, or invalid product slug must not expose product content or schema markup.

## 10. Canonical Domain Types

The following are the one authoritative set of initial domain types. If implemented in code, define them under `src/features/products/types/` and `src/features/categories/types/`. Other planning documents must refer to these definitions rather than maintaining competing interfaces.

```ts
export type Locale = "ar" | "en";

export type LocalizedText = Record<Locale, string>;

export type CategorySlug =
  | "mobile-accessories"
  | "audio"
  | "power"
  | "smart-accessories"
  | "computer-desk"
  | "gaming";

export type ProductPublicationStatus =
  | "draft"
  | "published"
  | "archived";

export type ProductAvailability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "coming_soon"
  | "discontinued"
  | "unknown";

export interface Money {
  amount: number;
  currency: "EGP";
}

export interface ProductImage {
  src: string;
  alt: LocalizedText;
  assetKind: "approved-product-image" | "development-placeholder";
}

export interface ProductAttribute {
  key: string;
  label: LocalizedText;
  value: LocalizedText;
}

export interface ProductSeo {
  title?: string;
  description?: string;
}

export interface ProductVariant {
  /** Stable variant identifier supplied by the approved data source/API; never use a client-generated value for order submission. */
  id: string;
  name: LocalizedText;
  sku?: string;
  attributes?: ProductAttribute[];
  availability: ProductAvailability;
  /** When absent, a valid product-level price may apply only if the backend contract confirms this rule. */
  price?: Money;
  compareAtPrice?: Money;
}

export interface Product {
  id: string;
  slug: string;
  name: LocalizedText;
  shortDescription?: LocalizedText;
  description?: LocalizedText;
  categorySlug: CategorySlug;
  publicationStatus: ProductPublicationStatus;
  availability: ProductAvailability;
  price?: Money;
  compareAtPrice?: Money;
  images: ProductImage[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  features?: Partial<Record<Locale, string[]>>;
  sku?: string;
  tags?: Partial<Record<Locale, string[]>>;
  featured?: boolean;
  seo?: Partial<Record<Locale, ProductSeo>>;
}

export interface ProductQuery {
  locale: Locale;
  query?: string;
  categorySlug?: CategorySlug;
  sort?: "relevance" | "price-asc" | "price-desc" | "name-asc";
}

export interface Category {
  slug: CategorySlug;
  name: LocalizedText;
  description?: LocalizedText;
  seo?: Partial<Record<Locale, ProductSeo>>;
}
```

### 10.1 Product model rules

- `id` is an internal stable identity; `slug` is the public URL key. Do not use the database ID as the slug.
- For the first release, product slugs should be the same in both locales unless approved localized-slug mapping is implemented deliberately.
- `name` is required in both locales for any product published to both locales. If approved content is not available in both languages, do not silently show a blank string or mixed-language page; record the missing translation and follow the release scope.
- `shortDescription`, `description`, and SEO fields can be omitted when unknown. Components must hide absent optional content cleanly.
- `price` is omitted when unknown. Never use `0`, an empty string, or `PRICE_TO_BE_DEFINED` to represent an unknown price. The first-release backend specification sets the currency to EGP; the frontend must display the approved currency returned by the real data source and must not silently convert or reinterpret amounts.
- If `compareAtPrice` is used, its currency must match `price` and it must be greater than the current price. Show discount math only when both approved values are valid.
- Do not store a separate editable percentage discount if it can be calculated from verified price fields; avoid inconsistent duplicate values.
- Do not expose raw stock quantities unless the business explicitly approves that behavior. `low_stock` must not be inferred from a guess.
- If a product has variants, render only the options and prices actually returned by the approved data source. Resolve product-level versus variant-level price according to the backend contract in file `08`; do not invent a fallback. Any selected variant submitted in an order must be revalidated by the backend.
- `unknown` availability is internal-only and must not be rendered as a stock claim.
- The `featured` flag may be true only when explicitly approved in catalog data; do not derive it from assumptions or mock ranking.
- `development-placeholder` images must be clearly identifiable during development and must not be presented as genuine product photography. Do not ship such placeholders as real assets.
- No product should be public unless its publication status is `published` and it passes the minimum data validation rules.

### 10.2 Publication status and availability are separate

`ProductPublicationStatus` controls whether a product may appear in public content. `ProductAvailability` describes its current commercial availability. Never use `active`, `inactive`, `draft`, `out_of_stock`, or `low_stock` interchangeably across these two concepts.

Only approved labels from file `03` and the localization messages should be rendered. Availability labels require reliable source data; `unknown` has no customer-facing stock label.

## 11. Category Configuration

Define the six approved categories once in `src/config/categories.ts` with their stable slugs and bilingual labels:

| Slug | English | Arabic |
|---|---|---|
| `mobile-accessories` | Mobile Accessories | إكسسوارات الهواتف |
| `audio` | Audio | الصوتيات |
| `power` | Power | الطاقة والشحن |
| `smart-accessories` | Smart Accessories | الإكسسوارات الذكية |
| `computer-desk` | Computer & Desk | ملحقات الكمبيوتر والمكتب |
| `gaming` | Gaming | الألعاب وملحقاتها |

This configuration must match file `03`. Do not define category names separately inside product cards, filter components, menus, or page JSX. Do not create new top-level categories without explicit approval.

## 12. Data Source and Product Services

### 12.1 Milestone A source

While the real catalog API is not implemented, load only owner-approved catalog records maintained in the approved project data source (normally `src/mocks/products.ts`). The file name `mocks` does not permit fictional production records. An empty catalog is valid while the owner has not supplied products. Keep the data-access boundary replaceable so the real API can be integrated without rewriting page components.

### 12.2 Milestone B source of truth

Once the public catalog API in file `08` has been implemented, tested, configured, and contract-checked, use it as the production source of truth for published product data, variants, prices, and availability. Do not quietly fall back to stale local catalog data if the API fails; render a localized error state and provide a real retry/recovery action. Approved local fixtures may remain available to automated tests and explicit development mode, isolated from production.


### 12.3 Feature service boundary

The Product feature should expose a small service API, for example:

```ts
getPublishedProducts(query?: ProductQuery): Promise<Product[]>;
getPublishedProductBySlug(slug: string, locale: Locale): Promise<Product | null>;
getPublishedCategoryBySlug(slug: string, locale: Locale): Promise<Category | null>;
```

These are frontend service contracts, not claims that a backend endpoint exists. If local data is sufficient, the service can read local records directly. Do not create an extra repository/adapter abstraction until a second data source or real testing need justifies it.

The service must:

- Filter out `draft` and `archived` products for all public queries.
- Resolve product details by slug and return `null` for unknown or unpublished records.
- Apply search/category/sort behavior defined in file `02` for the actual catalog size.
- Never synthesize product values to fill missing fields.
- Return predictable results and errors for the UI to handle.

### 12.4 Search, filters, and sorting

- Use URL query parameters for state that should be shareable or survive reloads, such as search query, category filter, sorting, and pagination if eventually needed.
- Keep the initial search/filter implementation lightweight and compatible with the approved catalog. Do not add a search backend, faceted-search package, infinite scrolling, or pagination without a real scale requirement.
- Use only official category slugs for filter values.
- Unknown prices sort after known prices for price sorting; do not treat missing prices as zero.
- Preserve query parameters when switching routes/locales where safe.
- Distinguish an empty catalog, no search matches, and a data-loading error.

## 13. API Boundary and Mapping

File `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` defines the target Spring Boot REST API and backend behavior. It does not prove those endpoints have been built or deployed. Use local approved data for Milestone A as described above. For Milestone B, integrate only against the actual implemented API and a reviewed contract. Use this flow:

```text
Page / Feature UI
       ↓
Feature Service
       ↓
API Client
       ↓
Mapper / Normalizer
       ↓
Frontend Domain Model
```

- Centralize HTTP configuration, response handling, timeouts, and error normalization in one API client.
- Use feature-level mappers where backend DTOs differ from the frontend domain types.
- Do not spread backend response property names into UI components.
- Use the endpoint outline in file `08` as the intended target only; confirm the actual endpoint, HTTP method, parameters, request/response DTO, validation errors, auth requirements, and implemented state before calling it available.
- Keep backend DTOs separate from frontend domain types. Use feature-level mappers for products, categories, variants, availability, order-submission results, and backend errors.
- Do not invent endpoints and present them as implemented backend contracts.
- Do not create a service that returns fake success responses for requests that were never sent.
- A contact form, order form, or other data-submission interaction must have a real configured submission path before the UI may show success.
- Before parallel frontend/backend work, agree on the contract items called out in file `08`, including locale behavior, product/variant identifiers, server-authoritative prices, shipping-fee-known/unknown states, order-number semantics, allowed order statuses, duplicate submission/idempotency behavior where implemented, and a stable error response.
- For admin integration, agree on session-cookie, CSRF, CORS, logout, and Google identity allowlist behavior as well as endpoint authorization. Do not use frontend route guards as a security control.

When a backend contract is supplied, record the real endpoint, request/response DTOs, auth/session behavior, and error shape in the project API contract or its generated documentation. Keep the frontend domain model stable where sensible, but do not conceal real contract mismatches behind unsafe casts.

### 13.1 Frontend/backend integration gate

Before a Milestone B feature is integrated, the team must record and verify:

- Actual endpoint and method, request/response DTO, field validation, and stable error response.
- Locale handling and the rules for published products/categories in Arabic and English.
- Product and variant identifiers, server-authoritative unit prices, discounts, availability, and the response when a price/variant is no longer valid.
- Order-created versus order-confirmed states, the meaning of shipping-fee-pending, and the shape of the persisted order summary returned to the customer.
- Session-cookie behavior, CSRF token exchange/validation, CORS allowlist, logout/expiry behavior, and admin authorization if protected endpoints are used.
- Timeout, retry, and duplicate-submission behavior. A retry must not quietly create a second order; follow the real backend idempotency/transaction contract.

Use file `08` as the backend source of truth. Record any unresolved issue as a blocker and do not claim the related feature is integrated until the contract and implementation have been checked together.

## 14. Environment and Site Configuration

Use `.env.local` for local values and maintain a `.env.example` containing names and non-secret examples only. Do not commit live credentials.

Suggested variable policy:

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical deployment origin used for metadata/sitemap when approved |
| `NEXT_PUBLIC_API_URL` | Public, only if browser-side code must call the API directly | Non-secret API origin; omit if not required |
| `API_BASE_URL` | Server-only | API origin used by Server Components or server-side service calls, when a backend exists |

Rules:

- Centralize environment access in `src/config/env.ts`.
- Use direct static references such as `process.env.NEXT_PUBLIC_SITE_URL`; do not access public env variables through computed keys such as `process.env[name]` when framework replacement depends on static access.
- `NEXT_PUBLIC_*` values are not secrets. Never place private API keys, database credentials, payment secrets, signing keys, or tokens in them.
- Validate required environment values at the boundary where they are needed. A missing optional API URL must not prevent a Milestone A local-data storefront from loading.
- Before Milestone B, explicitly choose whether the browser calls Spring Boot directly or calls through a Next.js server-side route/proxy. Do not use both paths accidentally. Align the choice with file `08`'s session-cookie, CSRF, CORS, and deployment-origin requirements; document required environment variables and test the real production-like configuration.
- Keep approved public business data (email, phone, social URLs, purchase route) in `src/config/site.ts` or the generated approved data module; do not hardcode these values repeatedly in components.
- Do not add Google login/client ID, payment-provider settings, or authentication variables to phase 1 unless that feature has been approved and is being implemented.

## 15. Styling and Design-System Integration

The design system is owned by file `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md`.

- Use Tailwind CSS 4.x for a new project; follow the official v4 setup (`@import "tailwindcss"` and the appropriate PostCSS integration).
- Use the CSS variables from file `01` as the canonical source of design values.
- If Tailwind theme aliases are needed, map Tailwind utilities to the existing CSS variables. Do not redefine the same color/radius/spacing value independently in a separate config.
- Do not create a second `:root` block with competing tokens.
- Do not use obsolete Tailwind v3 directives in a v4 project. If a Brownfield project remains on Tailwind v3, follow the installed version until a separate migration is approved.
- Keep `src/styles/globals.css` focused on imports, base styles, shared rules, and mappings to canonical tokens.
- Use `next/font` for the approved font families to avoid unnecessary runtime font requests and follow the exact font/weight choices in file `01`.
- Use `lucide-react` as the single interface-icon family. Every icon-only control needs an accessible name; do not use arbitrary emoji as UI icons.
- Use the shared container and component patterns from file `02`; do not hardcode inconsistent page widths across routes.

## 16. Server and Client Components

Prefer Server Components by default.

Use a Client Component only when the component needs browser APIs, local interaction state, event handlers, or a client-only library. Keep client boundaries narrow.

Examples that may require client behavior:

- Mobile navigation interactions.
- Search and filter controls if implemented interactively in the browser.
- Locale switcher behavior beyond a regular link.
- Image gallery interactions.
- Form fields with client-side validation feedback.

Rules:

- Do not place `"use client"` on an entire page tree merely because one small control is interactive.
- Do not use `useEffect` to fetch data that can be loaded appropriately by a Server Component or feature service.
- Do not read browser-only APIs during server rendering.
- Avoid unnecessary state duplication between URL parameters and component state.
- Server and client components must use the same domain types and localization keys.

## 17. Cart, Checkout, Orders, and Authentication Boundaries

Commerce and protected administration belong to Milestone B. The backend target is defined by file `08`; the frontend must also follow the owner-approved launch choice and content in file `06`. These targets must not be represented as operational until implemented and tested.

For an approved cart/order flow:

- Add `features/cart/`, `features/checkout/`, and `features/orders/` only when implementing the approved flow.
- Centralize quantity and subtotal calculations in domain utilities; do not repeat calculations in cart rows, checkout, and summary components.
- Treat browser cart state as a user selection only, not as a reservation or saved order.
- Revalidate product/variant identifiers, availability, pricing, and quantities through the backend when submitting. The backend is authoritative for prices, discounts, order totals, stock reservation, and order status.
- Do not calculate shipping, taxes, discounts, or final totals without approved rules and confirmed data. Preserve a distinct “shipping fee pending” state when the backend says the rate is unknown.
- Prevent accidental duplicate submissions in the UI, but rely on backend transaction/idempotency protection as specified by the actual contract; a disabled button alone does not guarantee exactly-once creation.
- Never implement real payment handling in client-only code or expose payment secrets. COD is not an online payment gateway.
- Show “recorded” only when the backend confirms order persistence. Do not say “confirmed for fulfilment” until the real backend/business workflow reaches that state.

Customer accounts/authentication, customer profiles, favorites, and unrelated account screens remain out of scope unless separately approved. The protected administrator sign-in and dashboard described by file `08` are a distinct Milestone B capability and require an approved admin UX addendum and an explicit route/locale decision recorded in this file. Hiding a button or route in the frontend is not authorization; the backend must enforce access control on every protected operation.

## 18. SEO and Metadata

Use the App Router metadata API for titles, descriptions, canonical URLs, Open Graph, robots directives, and locale alternatives where appropriate.

- Generate localized metadata for Home, Shop, category, product, About, Contact, Privacy, and Terms pages.
- Product metadata must use the same approved content rendered on the visible page.
- Product detail metadata and structured data must not expose draft or archived products.
- Product structured data may include only verified attributes. Do not invent ratings, review counts, stock, prices, offers, delivery promises, or brand/manufacturer facts.
- If the product price or currency is unknown, do not emit a fabricated `Offer` price.
- Set canonical URLs consistently and add `hreflang` only for real equivalents in the other locale.
- Keep slugs readable, stable, and lowercase. Use hyphens instead of spaces. Never use sequential database IDs as product slugs.
- Add `sitemap.ts` and `robots.ts` only when the route/data source can generate accurate output. Exclude private/future/unsupported routes and draft products.
- Avoid duplicate metadata generation and keyword stuffing.

## 19. Image and Asset Handling

- Use `next/image` for product and content imagery when it fits the source and delivery strategy.
- Prefer approved local assets in `public/products/` or explicitly configured image hosts.
- Do not invent an official logo or treat generic stock/AI imagery as official product photography.
- Do not allow arbitrary remote image domains; configure only verified hosts that are actually used.
- Give actual product photos localized, descriptive alt text. Decorative images should use empty alt text where appropriate.
- Preserve image ratios to avoid layout shift. Use deliberate `sizes` and `priority` only when appropriate for the rendered context.
- Development placeholders must be clearly marked in data/code and replaced before launch; do not present them as approved products.

## 20. Forms and Contact Page Integration

- Every form must have visible labels, accessible validation, useful errors, disabled/loading behavior during submission, and a clear result state.
- Client validation improves usability but is not a security boundary; validate again on the server when a real endpoint exists.
- Do not display “Message sent” or equivalent unless the actual submission mechanism returns success.
- If there is no approved form destination, show verified contact methods from file `06` and omit the nonfunctional form.
- Never invent email addresses, phone numbers, WhatsApp numbers, response times, opening hours, or social profile URLs.

## 21. Loading, Empty, Not-Found, and Error States

Every asynchronous or data-dependent feature must define the states that apply to it:

- Loading: skeletons for predictable content regions; avoid layout jumps.
- Success: render only approved, valid data.
- Empty: explain the empty result and provide a real recovery action.
- Error: concise localized customer wording and a Retry action only where another attempt can help.
- Not found: used for invalid routes, unknown slugs, missing categories, and unpublished products.

Do not create fake delays or spinners for synchronous local filtering. Never expose stack traces, internal API payloads, database errors, or raw exception text to visitors.

## 22. Responsive Behavior and Accessibility

Use the breakpoints, container width, gutters, product-grid columns, and touch-target goals defined in file `02`. That file owns the UX metrics.

All routes and shared components must support:

- 320px, 360px, 375px, 390px, 414px, 768px, 1024px, 1280px, and 1440px+ testing.
- RTL and LTR without horizontal overflow.
- Semantic HTML and meaningful heading order.
- Keyboard navigation and visible focus indicators.
- Proper button/link semantics; do not make a `div` clickable when a button or link is correct.
- Accessible labels and error associations for forms.
- Accessible menu/dialog focus behavior, Escape handling, and focus return where relevant.
- Sufficient contrast according to file `01`.
- `prefers-reduced-motion` support.
- No hover-only interaction and no focus being obscured by sticky controls.

Do not claim the layout has been visually checked unless the rendered UI was actually inspected at the viewports listed.

## 23. Performance

Prioritize reliable defaults over premature optimization:

- Keep most pages as Server Components.
- Use optimized, responsive images and reserve their layout space.
- Load approved fonts through `next/font`.
- Avoid unnecessary client-side JavaScript and dependencies.
- Use stable list keys and avoid duplicated requests/calculations.
- Do not introduce animation libraries or caching frameworks unless needed.
- Apply caching/revalidation only after the data source and freshness requirements are clear.
- Measure actual bottlenecks before adding complex performance abstractions.

## 24. Error and Logging Policy

- Normalize service errors into a small predictable frontend error type where needed.
- Show user-friendly localized text; keep technical detail in server logs or approved diagnostics.
- Do not log passwords, access tokens, private customer details, or other secrets.
- Do not silently swallow unexpected failures.
- A retry must call the real failing operation again; it must not merely dismiss the error message.

## 25. Testing Strategy and Quality Gates

Use the scripts actually present in `package.json`; do not assume a script exists without checking.

At a minimum, verify the applicable checks:

```text
TypeScript / typecheck
Lint
Unit tests for pure logic and mappers
Build
Manual responsive and RTL/LTR review
```

Prioritize tests for:

- Filtering out draft/archived products.
- Resolving published products by slug.
- Handling unknown price/currency without rendering invalid values.
- Price sorting with missing prices.
- Category slug validation.
- Locale switching and unsupported locales.
- Metadata for localized product/category routes.
- Empty, error, and not-found states.
- A form's actual submission result, if a working destination exists.
- Product/variant API mapping and API failure handling when a backend exists.
- Commerce only if approved: real order submission response, unknown-shipping behavior, and no false success or duplicate order on a retry.
- Admin only if approved: permission-denied states, session expiration/logout, and auth/CSRF behavior against the actual backend contract.

Run the available checks after significant changes and fix regressions introduced by the work. If a command cannot run, state why and do not mark it as passed. Do not claim to have visually inspected browser layouts without doing so.

## 26. Deployment and Environment Readiness

Preferred deployment target for the first Next.js release: **Vercel**, unless the owner chooses another platform before deployment. This is a technical default, not a claim that the website is already deployed.

The frontend and Spring Boot backend are separate build/deployment targets as described in file `08`. A successful frontend deployment does not mean that the backend or database is deployed or ready.

Before deployment:

- Confirm the real site origin and set `NEXT_PUBLIC_SITE_URL`.
- Set only required environment variables in the deployment environment.
- Verify that public variables contain no secrets.
- Confirm build/start commands and Node.js runtime compatibility against the selected Next.js version.
- Confirm that images, fonts, canonical URLs, metadata, sitemap, and robots output are correct for production.
- Test both `/ar` and `/en` routes, including product/category pages and not-found paths.
- Confirm no development placeholders or unapproved product records appear in production.
- For Milestone B, verify the real API base URL, frontend/backend origins, HTTPS, session-cookie attributes, CSRF handling, CORS allowlist, and server-only secrets against the selected hosting setup.
- Do not deploy as commerce-ready while purchase-flow decisions, required backend routes, stock/order integrity, contact destinations, or legal content are misrepresented or materially incomplete.

## 27. Completion Checklist

A route or feature is complete only when the applicable items have been checked:

- [ ] Uses the canonical route and typed domain model.
- [ ] Uses the correct Arabic/English messages and document direction.
- [ ] Uses the design tokens and visual component rules from file `01`.
- [ ] Follows the UX behavior and responsive metrics from file `02`.
- [ ] Uses approved business data from files `03` and `06`; if `06` is absent, dependent commercial UI remains blocked.
- [ ] For Milestone B, matches the implemented/reviewed backend contract in file `08`, including DTO mapping, error shape, locale behavior, and auth/session requirements where applicable.
- [ ] Handles loading, empty, error, and not-found states as applicable.
- [ ] Does not expose draft/archived products or internal data tokens.
- [ ] Does not imply a message/order/payment succeeded unless it actually did.
- [ ] Does not trust client-submitted prices/totals or expose admin functionality without server authorization.
- [ ] Has no dead links, fake features, or unnecessary dependencies.
- [ ] Has been checked with available lint/typecheck/tests/build commands.
- [ ] Has been visually inspected at the required viewports if the task changes layout.
- [ ] Reports any remaining blockers honestly.

## 28. Official Technical References

Use the current official documentation when implementing the setup; verify version compatibility before changing dependencies:

- Next.js App Router internationalization: https://nextjs.org/docs/app/guides/internationalization
- Next.js release information: https://nextjs.org/blog
- `next-intl` setup and routing: https://next-intl.dev/docs/getting-started
- Tailwind CSS installation and framework guides: https://tailwindcss.com/docs/installation/framework-guides

Documentation links are references for implementation, not permission to upgrade an existing project without inspecting it.

## 29. Final Architecture Principle

The VARELLION frontend should remain:

**Clear → Predictable → Typed → Testable → Localized → Contract-aligned → Replaceable → Maintainable**

Build the smallest real frontend for the approved milestone. In Milestone A, provide a truthful storefront using approved data. In Milestone B, integrate with the real Spring Boot backend under the reviewed contract in file `08`, including order and stock integrity and protected administration when approved. Never mistake a documented target for implemented functionality, never hide unresolved launch decisions, and never display a success state that the real service has not confirmed.

