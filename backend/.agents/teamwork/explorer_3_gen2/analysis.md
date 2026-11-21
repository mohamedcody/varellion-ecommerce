# Technical Analysis Report: Specifications, Skill Discovery & Design System Analysis

**Author:** Explorer 3 Gen 2 (Specifications, Skill Discovery & Design System Specialist)  
**Date:** 2026-10-31  
**Working Directory:** `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/explorer_3_gen2/`  
**Target Repository:** `/home/mohamed-saad/Desktop/BRAND`  
**Status:** Read-Only Investigation Complete — High-Confidence Findings  

---

## Executive Summary

This investigation covers three primary mandates defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`:
1. **R1. Skill Discovery and Selection:** Complete inventory of 65 repository-level skills (`.agents/skills/`) and 15 global skills (`~/.gemini/config/plugins/superpowers/skills/`). Each of the 7 reported issues is mapped to a verified, existing Agent Skill with exact file paths, selection rationale, and executed instructions.
2. **Issue 6 Deep Dive (Missing Design System Documentation in Git):** Forensic inspection of the 4 untracked root design documents (`DESIGN_SYSTEM.md`, `REDESIGN_PLAN.md`, `UI_UX_AUDIT.md`, `UI_UX_PROGRESS.md`), explanation of why they are untracked (uncommitted working tree files, not ignored by `.gitignore`), detailed comparison against the actual frontend code, identifying 6 major areas of implementation drift and code discrepancies, and analyzing the severe risks of leaving them untracked.
3. **R3. Reference & Specification Analysis:** Full review across `specs/`, `_references/`, `docs/`, `README.md`, and `AGENTS.md`, highlighting critical documentation conflicts (such as `README.md` describing the frontend as a trivial HTML login test script while it is a full Next.js 15 application, and claiming order lifecycle logic exists when the backend order module consists entirely of 0-byte scaffold placeholders).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Skills | Repository & Global Agent Skills Ecosystem | 65 verified agent skills in `.agents/skills/` and 15 in superpowers | Skill name, task scope | Structured audit/refactor instructions | Fallback to parent agent if skill missing | Inspection of `.agents/skills/` & `~/.gemini/config/...` |
| 2 | Design System | Luxury Design System Tokens | Complete token specification for Obsidian Charcoal, Warm Ivory, and Brushed Gold with WCAG 2.2 AA contrast | CSS variable declarations in `:root` | Styled Next.js / Tailwind UI components | Contrast failure if light gold used on light backgrounds | `DESIGN_SYSTEM.md:37-93` |
| 3 | Design System | Arabic Typographic Hierarchy | First-class Arabic typography (`Tajawal`) paired with classical Roman serif (`Cinzel`) and tabular figures | Font files / Google Fonts link | Rendered typography with optical tracking | Unresolved font variables if not linked via Next.js loader | `DESIGN_SYSTEM.md:108-133` |
| 4 | Frontend | Dual-Image Hover Crossfade | Product card interaction showing secondary craftsmanship detail photo on hover | Product `images` array | CSS opacity transition 500ms ease-out | Shows single image or placeholder if second image missing | `ProductCard.tsx:44-67` |
| 5 | Frontend | In-Memory Client-Side Catalog Filtering | Catalog filtering and sorting occurring entirely inside `useMemo` in React client memory | URL parameters (`category`, `search`, `sortBy`) | Rendered `ProductGrid` with filtered items | Silently ignores backend pagination; causes high memory usage | `app/products/page.tsx:114-150` |
| 6 | Cart | CartContext Optimistic UI State | Immediate local cart update with asynchronous backend synchronization | Product entity, quantity | Updated `items` state, toast notification | Race condition: out-of-order response overwrites newer state | `CartContext.tsx:165-218` |
| 7 | Payment | Development Payment Simulator Fallback | Client-side fallback to `/checkout/mock-paymob` when backend `/payments/paymob/initiate` is unreachable | Order entity, customer details | Simulated Paymob URL redirect | Fallback triggers because backend payment endpoint does not exist | `payment.ts:35-54` |
| 8 | Payment | Insecure Callback Status Handler | Direct trust of `?success=true` in query parameters without HMAC calculation | Browser URL search params | Order confirmed status, cart cleared | Severe vulnerability: anyone can confirm orders without payment | `checkout/callback/page.tsx:17-46` |
| 9 | Backend DB | JPA Query Projections & Fetching | JPA Entity mappings for Catalog, Cart, Customer, and User | JPA Repository queries | Hydrated domain entities & DTOs | N+1 queries when lazy collections (`images`, category count) accessed | `ProductRepository.java`, `CategoryRepository.java` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Catalog Filtering (`page.tsx`) | User filters by `category=watches` or searches `q=emerald` | Frontend executes `catalogService.getProducts()` with zero query parameters, loads all items, and filters in client memory. Backend never receives filter parameters. |
| 2 | Catalog Pagination | Catalog size exceeds default page size (>20 products) | Products on page 2+ will never appear in client-side search or category filter because page 1 is the only page fetched. |
| 3 | Cart Concurrency (`CartContext.tsx`) | Rapid double-click or rapid addition of Item A then Item B | Two async requests dispatched. If Request 1 finishes after Request 2, `setItems(backendCart.items)` from Request 1 overwrites state, dropping Item B. |
| 4 | Cart Error Rollback (`CartContext.tsx`) | Item A added, then Item B added, Request B fails | Request B catch block calls `setItems(previousItems)` where `previousItems` was the snapshot before Request B, potentially reverting Item A as well. |
| 5 | API Client AbortSignal (`api.ts:105`) | Caller passes custom `AbortSignal` and cancels request | Caught as `err.name === 'AbortError'` and thrown as `new ApiError('Request timeout: Server took too long to respond', 408)`, falsely reporting server timeout instead of user cancellation. |
| 6 | Category Counts (`CategoryService.java`) | Calling `CategoryService.getActiveCategories()` with 10 categories | 1 query to fetch categories, followed by 10 sequential `SELECT COUNT(p) ...` queries in a stream loop (N+1 query defect). |
| 7 | Product Images (`ProductService.java` & `CartService.java`) | Calling `getProducts(...)` for 20 products or `getCart(...)` for 10 cart items | Lazy collection `product.getImages()` accessed in DTO mapper without join fetch, triggering 20 and 10 extra SQL queries respectively. |
| 8 | Paymob Callback (`checkout/callback/page.tsx`) | Attacker navigates to `/checkout/callback?success=true&orderNumber=VAR-TEST` | Order status updated to `CONFIRMED` in `sessionStorage`, cart cleared, and redirect to success page without HMAC or backend verification. |

---

## Section 1: R1. Skill Discovery and Selection Report

### 1.1 Discovery Environment
We conducted a thorough inspection of:
- **Repository-Level Skills:** `/home/mohamed-saad/Desktop/BRAND/.agents/skills/` (65 skills verified).
- **Global Superpowers Skills:** `/home/mohamed-saad/.gemini/config/plugins/superpowers/skills/` (15 skills verified).

Every selected skill was verified to physically exist in the local environment. No non-existent skills were invented or used.

### 1.2 Selection Matrix for the 7 Reported Issues

| Issue # | Issue Name | Selected Skill Name | Exact Absolute Skill Path | Selection Rationale | Instructions Followed | References Used |
|:---:|:---|:---|:---|:---|:---|:---|
| **1** | Backend-Driven Catalog Filtering Mismatch (`frontend/src/app/products/page.tsx` vs `GET /api/products?category=...&q=...&sort=...`) | `awesome-api-design` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-api-design/SKILL.md` | Issue 1 is an API contract and client-server synchronization defect where the frontend client ignores the backend query contract (`category`, `q`, `sort`, `page`, `limit`) and filters in-memory. `awesome-api-design` governs HTTP API contract conventions, list filtering/pagination designs, and change review between readers and writers. | Work Process Step 4 ("Design list endpoints for growth... Filtering and sorting are an allowlist of named parameters over indexed fields"), Change Review Scenario ("search for consumers both ways... client reads a field, server expects query parameters"), Anti-pattern ("Designing for the first client's screen... View composition belongs to the client"). | `awesome-api-design/SKILL.md` |
| **2** | Potential N+1 Queries in `Product.images` (`ProductService.java` & `CartService.java`) | `awesome-database-audit` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-database-audit/SKILL.md` | Issue 2 is an ORM lazy-loading query defect in Spring Data JPA where traversing `product.getImages()` in DTO mappers triggers secondary queries per entity. `awesome-database-audit` is designed specifically for database and ORM query pattern audits. | Track B (Query patterns and indexes: "N+1 — a per-row query in a loop turns one request into hundreds; look for lazy-load loops in ORM code and assert-query-count tests on hot paths. Invisible on seed data, obvious in production. Verdict cue: a confirmed N+1 on a hot path... is FIX"). | `awesome-database-audit/SKILL.md` |
| **3** | Potential N+1 Queries in `CategoryService.getActiveCategories()` | `awesome-database-audit` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-database-audit/SKILL.md` | Issue 3 is a loop-based SQL query anti-pattern: `CategoryService` streams over all active categories and executes `categoryRepository.countActiveProductsByCategoryId` for each row. `awesome-database-audit` Track B directly addresses loop queries and prescribes aggregated queries. | Track B (Query patterns and indexes: "Grep the query sites — ORM calls and raw SQL both... Spaghetti queries doing several jobs in one statement vs loop queries... replace loop queries with join/group by aggregate projections"). | `awesome-database-audit/SKILL.md` |
| **4** | CartContext Concurrency Race Condition during Rapid Item Additions | `awesome-bug-fix` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-bug-fix/SKILL.md` | Issue 4 is an asynchronous race condition in React client state where out-of-order responses from rapid additions overwrite state and clobber cart items. `awesome-bug-fix` provides a dedicated signature table and protocol for asynchronous race conditions and state corruption. | Phase 1 (Root cause investigation, deterministic test loop), Phase 2 (Signature table: "Intermittent, timing/load-dependent -> Race condition -> Shared state, missing locks/await; Out-of-order effects, empty results -> Missing await / unresolved promise -> Async call sites"), Phase 3 (Falsifiable hypotheses and red-team verification). | `awesome-bug-fix/SKILL.md` |
| **5** | API Timeout Behavior when Custom AbortSignal Supplied (`api.ts:105`) | `awesome-error-standards` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-error-standards/SKILL.md` | Issue 5 is an error classification and status mapping failure: `api.ts:118` catches any `AbortError` and misclassifies user cancellation as an HTTP 408 Request Timeout. `awesome-error-standards` defines typed error contracts, operational vs programmer errors, and accurate HTTP status mapping. | Core Principles ("Operational vs programmer errors — Classify first. Operational failures (network timeout, invalid input...) are expected: handle, retry, or surface them..."), Work Process Step 3 ("Map errors to HTTP... Do not use 200/408 for errors that represent client aborts"), Code Patterns (Typed error classes). | `awesome-error-standards/SKILL.md` |
| **6** | Missing Design System Documentation in Git (`DESIGN_SYSTEM.md`, `REDESIGN_PLAN.md`, `UI_UX_AUDIT.md`, `UI_UX_PROGRESS.md`) | `web-design-guidelines` (paired with `awesome-git-commit-plan`) | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/web-design-guidelines/SKILL.md` (and `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-git-commit-plan/SKILL.md`) | Issue 6 spans design system compliance (WCAG 2.2 AA contrast, token architecture, luxury typography, UI drift) and git repository tracking. `web-design-guidelines` provides the UI/UX compliance standard, while `awesome-git-commit-plan` provides the discipline for inventorying untracked files and structuring commit plans. | `web-design-guidelines/SKILL.md`: checking UI code for contrast, typography, and touch target rules; `awesome-git-commit-plan/SKILL.md` Phase 0 Step 2 ("Establish the file universe: git ls-files, git ls-files --others --exclude-standard... uncommitted or untracked work is a question, not a default"). | `web-design-guidelines/SKILL.md`, `awesome-git-commit-plan/SKILL.md` |
| **7** | Live Paymob Callback Verification | `awesome-security-audit` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-security-audit/SKILL.md` | Issue 7 involves a critical financial trust boundary: client-side checkout callback blindly accepts `?success=true` with zero HMAC SHA-512 calculation and no server-side webhook validation. `awesome-security-audit` specializes in authentication, authorization, cryptographic signature verification, and trust boundary enforcement. | Step 4 (Work the surface: trust boundaries, external integrations, source->sink data flow), Category 3 (Authentication & Authorization: replay attacks, signature verification, token misuse), Category 6 (Configuration: safe defaults, no fail-open control paths). | `awesome-security-audit/SKILL.md` |

### 1.3 Unavailable Skills Report
All 7 reported issues are fully covered by verified skills in the repository. No skill was unavailable.

---

## Section 2: Issue 6 Investigation — Missing Design System Documentation in Git

### 2.1 File Inventory and Git Status Analysis
In the repository root (`/home/mohamed-saad/Desktop/BRAND/`), four extensive design system documents exist in the working tree:
1. `DESIGN_SYSTEM.md` (12,119 bytes, 215 lines)
2. `REDESIGN_PLAN.md` (8,645 bytes, 133 lines)
3. `UI_UX_AUDIT.md` (12,141 bytes, 91 lines)
4. `UI_UX_PROGRESS.md` (5,638 bytes, 83 lines)

**Why are they untracked?**
- Inspection of root `.gitignore` (lines 1 to 100):
  * Line 8-16: Ignores `.env*` and `client_secret*.json`.
  * Line 25-33: Ignores OS files (`.DS_Store`, `Thumbs.db`).
  * Line 37-53: Ignores IDE files (`.idea/`, `*.iml`, `.vscode/`).
  * Line 57-70: Ignores Maven target files (`target/`, `*.jar`).
  * Line 74-87: Ignores Node.js build artifacts (`node_modules/`, `.next/`, `_references/`).
  * Line 92-100: Ignores logs and sqlite databases.
- Inspection of `backend/.gitignore` (lines 1 to 49) confirms standard Java/Maven and IDE ignore rules.
- **Definitive Finding:** None of `DESIGN_SYSTEM.md`, `REDESIGN_PLAN.md`, `UI_UX_AUDIT.md`, `UI_UX_PROGRESS.md`, or `*.md` are listed in `.gitignore`. They are untracked simply because they were authored locally during the redesign audit and never staged (`git add`) or committed (`git commit`) to Git.

### 2.2 Specification Contents of the Untracked Documents
These four documents establish the authoritative visual, typographic, architectural, and accessibility contract for VARELLION:
1. **Brand Philosophy:** Masculine luxury, horology, and genuine leathercraft. Principles: Architectural Restraint (banning gratuitous gradients, bubbly pill containers, Web3 glows), Material Honesty, Tactile Clarity, and Cultural Naturalness (Arabic RTL as first-class citizen).
2. **Color Palette & Token System (`DESIGN_SYSTEM.md:23-93`):**
   - **Obsidian Charcoal:** `--obsidian-950` (`#0E0F11`), `--obsidian-900` (`#141619`), `--obsidian-850` (`#1A1D20`), `--obsidian-800` (`#22262B`).
   - **Warm Ivory:** `--ivory-50` (`#FAF9F6`), `--ivory-100` (`#F4F1EA`), `--ivory-200` (`#EAE5D9`), `--ivory-300` (`#D8D1C0`).
   - **Brushed Gold:** `--gold-500` (`#C5A059` for dark surfaces and accents), `--gold-600` (`#A8853F`), `--gold-700` (`#876725` achieving 4.82:1 WCAG AA contrast on light surfaces), `--gold-100` (`#FBF7EE`).
   - **Semantic Tokens:** `--color-success` (`#1B7A4E`), `--color-warning` (`#995B00`), `--color-danger` (`#B42318`).
3. **Typography Scale (`DESIGN_SYSTEM.md:108-133`):**
   - Arabic: `Tajawal` (Weights 400, 500, 600, 700, 800).
   - Display & English: `Cinzel` (Weights 600, 700).
   - Tabular / Technical: `Plus Jakarta Sans` / system monospace with `tabular-nums`.
   - Scale: `display-1` (44/56px), `h1` (32/40px), `h2` (24/28px), `h3` (18/20px), `body-lg` (16px), `body-sm` (14px), `caption` (12px), `micro` (11px).
4. **Layout Geometry & Corner Radii (`DESIGN_SYSTEM.md:138-151`):**
   - Containers: Max 1280px (`max-w-7xl`), Editorial 1024px (`max-w-5xl`), Form 640px, Drawer 440px.
   - Radii: `radius-xs` (3px), `radius-sm` (6px), `radius-md` (10px), `radius-lg` (14px). `radius-full` (9999px) is strictly restricted to avatars and circular quantity pills. Excessive `rounded-3xl` (24px) is explicitly banned.
5. **Component Standards & WCAG 2.2 AA:**
   - 44px minimum interactive touch targets (WCAG 2.5.8).
   - Skip to main content link (WCAG 2.4.1).
   - Distinct hover states with 200-300ms transitions respecting `prefers-reduced-motion`.
   - Dual-image crossfade on product cards.

### 2.3 Detailed Comparison: Frontend Code vs Design Specifications
A forensic comparison between the actual frontend code and these design documents reveals significant discrepancies, implementation drift, and half-finished refactorings:

1. **Font Loading Strategy Drift (`layout.tsx:29-32` vs `REDESIGN_PLAN.md:24-27`):**
   - *Specified:* `REDESIGN_PLAN.md` Task 1.2 requires loading `Tajawal` and `Cinzel` via `next/font/google` and exposing CSS variables `--font-tajawal` and `--font-cinzel` for zero Cumulative Layout Shift (CLS).
   - *Actual Code:* `frontend/src/app/layout.tsx:29-32` loads Google Fonts via external HTML `<link rel="stylesheet">` tags in `<head>`.
   - *Impact:* The CSS variable `--font-tajawal` in `globals.css:4` is never injected by Next.js, falling back to system fonts until external stylesheets download.
2. **Scattered Hardcoded Hex Colors vs Design Tokens (`Header.tsx`, `Footer.tsx`, `page.tsx`):**
   - *Specified:* `UI_UX_AUDIT.md` (Finding CLR-04) and `REDESIGN_PLAN.md` (Task 2.1) require eliminating hardcoded hexes and consuming semantic tokens (`bg-primary`, `text-foreground`, `text-accent-gold`).
   - *Actual Code:* Grep search identified over 30 hardcoded hex classes in JSX:
     * `Header.tsx:82`: `bg-[#0E0F11]`, `text-[#FAF9F6]`, `border-[#22262B]`
     * `Header.tsx:86, 91, 99`: `text-[#C5A059]`
     * `Header.tsx:135`: `bg-[#0E0F11] text-[#C5A059] border-[#C5A059]/40`
     * `Footer.tsx:26, 36, 46, 56`: `bg-[#0E0F11] text-[#C5A059]`
     * `page.tsx:38, 285`: `border-[#C5A059]/40 bg-[#FAF4E8] text-[#876725]`
   - *Impact:* Themes cannot be updated centrally; dark mode cannot be cleanly implemented; violates DRY token architecture.
3. **Brandmark Visual Discrepancy (`Header.tsx:135` & `Footer.tsx:74` vs `UI_UX_AUDIT.md:56`):**
   - *Specified:* `UI_UX_AUDIT.md` Finding AI-04 and `UI_UX_PROGRESS.md` Resolution 3 state that the generic square icon with a 'V' was replaced with a bespoke typographic wordmark `VARELLION` in `Cinzel` serif.
   - *Actual Code:* The square box with 'V' was NEVER removed! Lines 135-137 of `Header.tsx` and lines 74-76 of `Footer.tsx` still render:
     `<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E0F11] text-[#C5A059] font-serif font-black text-xl shadow-xs border border-[#C5A059]/40">V</span>`. The author merely recolored the icon from teal to black/gold while claiming it was removed.
4. **Border Radius Geometry Violation (`page.tsx:38, 285` vs `DESIGN_SYSTEM.md:144-150`):**
   - *Specified:* `DESIGN_SYSTEM.md` Section 4.2 strictly forbids `rounded-full` for badges, reserving it only for avatars and round steppers, and dictates `radius-xs` (3px) or `radius-sm` (6px) for pills/badges.
   - *Actual Code:* `page.tsx:38` and `page.tsx:285` use `rounded-full` on trust pills:
     `inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#FAF4E8] px-3.5 py-1 text-xs font-bold text-[#876725]`.
5. **Catalog Filtering Architectural Drift (`products/page.tsx:49-52` vs `REDESIGN_PLAN.md:71-75`):**
   - *Specified:* Task 4.2 specifies an editorial catalog with URL parameter synchronization.
   - *Actual Code:* In `frontend/src/app/products/page.tsx:49-52`, `catalogService.getProducts()` is called with NO arguments. All filtering and sorting is handled purely in client-side memory (`useMemo`, lines 114-150). The backend's robust `findFilteredProducts(categorySlug, search, pageable)` is completely bypassed.
6. **Contradiction Between Tracked Docs and Untracked Docs:**
   - In tracked `docs/architecture-decisions.md:15` (ADR-002) and `docs/frontend-progress.md:28` (Feature F-102), the design system is officially documented as dark teal (`#12363B`).
   - In untracked `DESIGN_SYSTEM.md` and `UI_UX_AUDIT.md`, dark teal is condemned as a "CRITICAL brand misalignment" and replaced by Obsidian Charcoal (`#0E0F11`).
   - Because the root documents are untracked, git history and tracked documentation officially assert that teal is the system of record!

### 2.4 Risks of Remaining Untracked
1. **Permanent Data Loss:** Any `git clean -fd` executed locally or in CI/CD will permanently and irreversibly erase all 4 documents.
2. **Team Desynchronization & Confusion:** Any engineer cloning the repository from remote will only see the obsolete teal documentation in `docs/` and will inadvertently write new code using `#12363B`.
3. **Loss of Accessibility Baseline:** The WCAG 2.2 AA contrast calculations and accessibility remediations in `UI_UX_AUDIT.md` (e.g. why `--gold-700` is needed instead of `#C5A059` on white) will be lost, leading to future accessibility regressions.
4. **Architectural Drift:** Without committed design tokens and documentation, frontend developers have no single source of truth for component variants, layout widths, and touch target rules.

---

## Section 3: Reference & Specification Analysis (R3)

A comprehensive review of specifications, architecture documents, tests, and configurations across `specs/`, `references/`, `docs/`, `README.md`, and `AGENTS.md` yielded the following findings:

### 3.1 Document Availability Matrix
- **`specs/`:** Directory does NOT exist at the repository root.
- **`references/`:** Directory does NOT exist at the repository root. A directory named `_references/` exists, but it is explicitly ignored in `.gitignore:87` and contains 4 third-party reference projects (`awesome-cursorrules`, `commerce`, `next-shadcn-dashboard-starter`, `skateshop`).
- **`AGENTS.md`:** Missing from the repository root. (Only present inside `_references/next-shadcn-dashboard-starter/` and `awesome-agent-skills-main/`).
- **`README.md`:** Present at root (162 lines, 12,885 bytes), but severely obsolete and contradictory.
- **`docs/PROJECT_COMPLETE_TECHNICAL_GUIDE.md`:** Present (791 lines, 45,919 bytes), written 2026-10-21.
- **`docs/architecture-decisions.md`:** Present (44 lines, 3,731 bytes), containing ADR-001 through ADR-005.
- **`docs/frontend-progress.md`:** Present (63 lines, 6,462 bytes), updated through Phase 6.

### 3.2 Conflicting, Outdated, and Missing Documentation Findings

#### Finding DOC-01: `README.md` Severely Outdated Regarding Frontend Architecture
- **Location:** `README.md:82-86`
- **Observed Text:**
  ```text
  └── frontend/                           # 💻 الواجهة الأمامية وصفحة الاختبار التفاعلية
      ├── package.json                    # إعدادات الحزمة
      ├── serve.js                        # سيرفر محلي خفيف لتشغيل تجربة الدخول بجوجل
      └── public/index.html               # واجهة تجربة Google Sign-In المباشرة
  ```
- **Actual Reality:** `frontend/` is a production Next.js 15 App Router application with React 19, Tailwind CSS v4, Lucide icons, Vitest test suites, and 13 application routes. `serve.js` does not even exist.
- **Impact:** Misleads developers and stakeholders into thinking the frontend is an unbuilt prototype.

#### Finding DOC-02: `README.md` Claims Order Module Is Implemented in Backend
- **Location:** `README.md:63`
- **Observed Text:**
  `│       │   │   └── order/              # نظام الطلبات، تتبع الحالات، وحجز المخزون`
- **Actual Reality:** Forensic inspection of `backend/src/main/java/com/varellion/store/order/` reveals:
  * `controller/OrderController.java` (0 bytes)
  * `controller/GuestOrderLookupController.java` (0 bytes)
  * `service/OrderService.java` (0 bytes)
  * `service/OrderReservationService.java` (0 bytes)
  * `dto/CreateOrderRequest.java` (0 bytes)
  * `dto/OrderResponseDto.java` (0 bytes)
  The entire backend order module is composed of empty, 0-byte scaffold placeholders!
- **Impact:** Critical discrepancy. Developers assume backend order APIs exist, when in reality all order persistence on the frontend is forced to fall back to `sessionStorage` (`varellion_last_order`).

#### Finding DOC-03: `ADR-001` Route Groups Contradicts Actual Directory Layout
- **Location:** `docs/architecture-decisions.md:6-10`
- **Observed Text:**
  "Adopt a single Next.js App Router application with Route Groups: `src/app/[locale]/(storefront)/...`, `src/app/[locale]/(checkout)/...`, `src/app/[locale]/(auth)/...`"
- **Actual Reality:** Actual frontend directory layout has NO `[locale]` dynamic segment and NO route groups (`(storefront)`, `(checkout)`, etc.). Routes are flat under `frontend/src/app/` (`page.tsx`, `products/page.tsx`, `checkout/page.tsx`, `login/page.tsx`).
- **Impact:** Documentation-to-code drift.

#### Finding DOC-04: `ADR-002` and `frontend-progress.md` Contradict Design System
- **Location:** `docs/architecture-decisions.md:15` & `docs/frontend-progress.md:28`
- **Observed Text:** Both approve and verify the dark teal palette (`#12363B`).
- **Actual Reality:** The active design system completely rejected teal in favor of Obsidian Charcoal (`#0E0F11`) and Warm Ivory (`#FAF9F6`).
- **Impact:** Direct contradiction within project documentation.

#### Finding DOC-05: Missing Root `AGENTS.md` and `specs/` Directory
- **Location:** Repository root
- **Actual Reality:** There are no repo-level agent instructions (`AGENTS.md`) or functional specification folder (`specs/`).
- **Impact:** AI coding agents lack standardized repository guidelines and project boundaries.

#### Finding DOC-06: Unprotected Google OAuth Client Secret in Working Tree
- **Location:** `/home/mohamed-saad/Desktop/BRAND/client_secret_1003559537454-c93rrfj1ka0pjabj10g02eado3c9r2jg.apps.googleusercontent.com.json`
- **Actual Reality:** A raw Google OAuth client secret JSON file resides in the root directory. While it is covered by `.gitignore:16` (`client_secret*.json`), its presence in the workspace poses a severe leakage risk if `.gitignore` is ever modified or files are bundled via tar/zip without ignore parsing.

---

## Section 4: Forensic Deep Dive on Issues 6 and 7

### 4.1 Issue 6 Forensic Summary
- **Classification:** Confirmed Repository Governance & Design System Drift Issue.
- **Affected Files:**
  * Root: `DESIGN_SYSTEM.md`, `REDESIGN_PLAN.md`, `UI_UX_AUDIT.md`, `UI_UX_PROGRESS.md`
  * Frontend: `frontend/src/app/layout.tsx:29-32`, `frontend/src/components/layout/Header.tsx:135`, `frontend/src/app/page.tsx:38`, `frontend/src/styles/globals.css:4`
  * Docs: `docs/architecture-decisions.md:15`, `docs/frontend-progress.md:28`
- **Root Cause:**
  1. Design system documentation was created during an ad-hoc audit and never committed to version control.
  2. Implementers made cosmetic color edits to existing components without fully adopting semantic design tokens, leading to hardcoded hex strings across 30+ JSX lines.
  3. Font loading was implemented via `<link>` tags in `<head>` rather than Next.js font loaders, leaving CSS font variables unpopulated.
  4. The brandmark 'V' square icon was recolored rather than redesigned into a typographic wordmark as claimed.
- **Customer Impact:** Visual inconsistency, font layout shift (CLS), WCAG AA contrast violations where light gold is used on white, and high risk of design regression upon next team deployment.
- **Severity:** High (Governance, Brand Consistency & Accessibility).
- **Confidence Level:** 100% (Directly verified by file inspection and grep).

### 4.2 Issue 7 Forensic Summary (Live Paymob Callback Verification)
- **Classification:** Confirmed Critical Financial Security Vulnerability.
- **Affected Files:**
  * `frontend/src/app/checkout/callback/page.tsx:17-46`
  * `frontend/src/services/payment.ts:18-54`
  * `backend/src/main/java/com/varellion/store/order/controller/OrderController.java:1` (0 bytes)
- **Data Flow Trace:**
  1. Customer initiates online payment -> `paymentService.initiatePaymobPayment` (`payment.ts:19`).
  2. Endpoint `POST /api/payments/paymob/initiate` does not exist in backend -> request fails with 404.
  3. `payment.ts:35-54` catches error and routes user to `/checkout/mock-paymob` simulation.
  4. Simulation redirects to `/checkout/callback?success=true&orderNumber=...`.
  5. In `checkout/callback/page.tsx:17-46`:
     ```ts
     const successParam = searchParams.get('success');
     const isSuccess = successParam === 'true';
     if (isSuccess) {
       const cached = ordersService.getLastPlacedOrder();
       if (cached) {
         cached.orderStatus = 'CONFIRMED';
         sessionStorage.setItem('varellion_last_order', JSON.stringify(cached));
       }
       clearCart();
       router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
     }
     ```
- **Root Cause:**
  1. The backend does not implement any Payment or Order controllers (order files are 0 bytes).
  2. The frontend callback handler completely lacks server-to-server webhook verification.
  3. The frontend blindly trusts client-provided URL query parameters (`?success=true`) without verifying a cryptographic HMAC SHA-512 signature against a Paymob secret key.
- **Attacker Exploit Scenario:** Any user can place an order, cancel payment, and navigate to `/checkout/callback?success=true&orderNumber=<ANY_ORDER>`, and the application will declare the order paid and confirmed.
- **Customer / Business Impact:** Critical financial loss. Free goods can be ordered; merchant shipping team could dispatch un-paid luxury merchandise.
- **Severity:** CRITICAL (Financial Correctness & Authentication Bypass).
- **Confidence Level:** 100% (Confirmed by code inspection).

---

## Section 5: Recommended Action Plan

1. **Immediate Git Governance Action (Issue 6):**
   - Stage and commit the 4 untracked root design files:
     `git add DESIGN_SYSTEM.md REDESIGN_PLAN.md UI_UX_AUDIT.md UI_UX_PROGRESS.md`
   - Update `docs/architecture-decisions.md` (ADR-002) and `docs/frontend-progress.md` to deprecate the teal palette and reference `DESIGN_SYSTEM.md`.
2. **Frontend Design Token Refactoring:**
   - Migrate external `<link>` font loading in `layout.tsx` to Next.js `next/font/google` (`Tajawal` and `Cinzel`).
   - Replace all hardcoded `#0E0F11`, `#C5A059`, `#876725`, `#FAF9F6` in JSX with semantic Tailwind classes (`bg-obsidian-950`, `text-gold-500`, `text-gold-700`, `bg-background`).
   - Fix the brandmark in `Header.tsx:135` and `Footer.tsx:74` to conform to the typographic wordmark specification.
3. **Remediate Paymob Integration & Order Backend (Issue 7):**
   - Implement `OrderController` and `PaymentController` in Spring Boot.
   - Implement Paymob HMAC SHA-512 webhook callback endpoint on the backend.
   - Never allow the frontend callback page to update order status to `CONFIRMED` based solely on URL parameters; order confirmation must be verified via authenticated backend API lookup against the verified transaction record in the database.
4. **Remediate Catalog Filtering Mismatch (Issue 1):**
   - Update `frontend/src/app/products/page.tsx` to pass `categorySlug`, `searchQuery`, `sortBy`, and pagination parameters directly to `catalogService.getProducts(params)`.
   - Remove client-side in-memory array filtering.
5. **Remediate N+1 Queries (Issues 2 & 3):**
   - Add `LEFT JOIN FETCH p.images` and `JOIN FETCH p.category` to `ProductRepository.findFilteredProducts` and `findBestSellers`.
   - Update `CartRepository.findByCustomer` entity graph to include `items.product.images`.
   - Rewrite `CategoryRepository.countActiveProductsByCategoryId` from an N+1 loop into a single grouped query or join projection in `CategoryRepository`.
6. **Remediate CartContext Concurrency (Issue 4):**
   - Implement an asynchronous request queue or sequence token in `CartContext.tsx` to ensure out-of-order responses do not overwrite subsequent state updates.
7. **Remediate API AbortSignal Behavior (Issue 5):**
   - Differentiate `AbortError` caused by caller cancellation from actual 10-second network timeouts in `api.ts:117-120`.
