# VARELLION — Master Implementation Plan

**Audit Phase:** Phase Twelve — Prioritized Implementation Plan  
**Plan Date:** 2026-11-04  
**Author:** Senior Product Architect, Senior Frontend Engineer & DevOps Engineer  
**Status:** **PENDING APPROVAL — NO CODE CHANGES EXECUTED**  

---

## 1. Overview & Phased Roadmap Strategy

This implementation plan synthesizes the findings from the Reference Audit, Project Discovery, UX Audit, Page-by-Page Audit, Design System Audit, Accessibility Audit, Security Audit, and Deployment Audit into an actionable, prioritized roadmap.

Execution follows this strict sequence:
- **P0 — Critical Customer-Facing Problems & Security Blockers:** Blocker defects that prevent secure launch or cause direct user drop-off.
- **P1 — Information Architecture, Typography, Navigation & Checkout Usability:** High-impact UX polish, real policy pages, and structured specifications.
- **P2 — Visual Consistency, Design System & Responsive Refinement:** Token unification, elimination of hardcoded hexes, mobile image gestures.
- **P3 — Subtle Micro-Interactions & Concierge Polish:** Bespoke scrollbars, touch animations, feedback states.
- **P4 — Production Deployment Infrastructure & Final Release Validation:** Multi-stage Dockerization, Nginx reverse proxy, CI/CD, and live server configuration.

---

## 2. Detailed Task Breakdown

### Phase P0: Critical Customer-Facing Problems & Security Blockers

#### Task P0.1: Restrict Next.js Image Optimization Remote Patterns
- **Objective:** Eliminate SSRF attack vector and external resource exhaustion on the Next.js image optimizer.
- **Evidence:** `docs/audits/SECURITY_AUDIT.md` (Finding SEC-01), `frontend/next.config.ts:9`.
- **Files Affected:** `frontend/next.config.ts`.
- **Dependencies:** None.
- **Risks:** Remote images from non-whitelisted domains might fail to load if not included.
- **Acceptance Criteria:**
  - `hostname: '**'` is removed.
  - Whitelist strictly permits `images.unsplash.com` and Supabase storage domain.
  - `next build` passes and homepage/PDP images render cleanly.
- **Tests Required:** `npm run build` and image load smoke test.
- **Priority:** **P0**

#### Task P0.2: Sanitize AuthResponse Refresh Token Body Leak
- **Objective:** Ensure the refresh token is strictly delivered via the HttpOnly cookie and omitted from the client-accessible JSON body.
- **Evidence:** `docs/audits/SECURITY_AUDIT.md` (Finding SEC-02), `AuthController.java:36,46,56,74`.
- **Files Affected:**
  - `backend/src/main/java/com/varellion/store/security/dto/AuthResponse.java`
  - `backend/src/main/java/com/varellion/store/security/service/AuthService.java`
- **Dependencies:** None. Frontend already uses `credentials: 'include'` and reads the cookie.
- **Risks:** Any client test expecting `refreshToken` in JSON payload must be updated.
- **Acceptance Criteria:**
  - `AuthResponse` does not serialize `refreshToken`.
  - Refresh cookie remains `httpOnly=true`, `secure=true`, `sameSite=Lax`.
  - Frontend silent refresh continues to succeed.
- **Tests Required:** `mvn test -Dtest=AuthServiceTest,AuthControllerTest`.
- **Priority:** **P0**

#### Task P0.3: Implement Backend Order Idempotency & Replay Protection
- **Objective:** Prevent duplicate order creation on double-clicks, rapid re-submissions, or network retries.
- **Evidence:** `docs/audits/SECURITY_AUDIT.md` (Finding SEC-04), `docs/audits/PROJECT_DISCOVERY.md`.
- **Files Affected:**
  - Create: `backend/.../order/service/IdempotencyService.java`
  - Modify: `backend/.../order/controller/OrderController.java`
  - Modify: `frontend/src/services/orders.ts`
- **Dependencies:** None (uses in-memory cache with 15-minute TTL; zero database schema modifications).
- **Risks:** Low. Missing header defaults to normal order creation.
- **Acceptance Criteria:**
  - Controller accepts `@RequestHeader(value = "Idempotency-Key", required = false)`.
  - Concurrent requests with identical key return `HTTP 409 Conflict`.
  - Completed request with identical key returns cached `HTTP 201 Created` without double decrementing product inventory.
- **Tests Required:** New `IdempotencyServiceTest.java`, updated `OrderControllerTest.java`.
- **Priority:** **P0**

#### Task P0.4: Fix Placeholder Customer Service Phone & WhatsApp Links
- **Objective:** Replace dummy `+20 100 000 0000` numbers with the approved business customer care contact.
- **Evidence:** `docs/audits/UX_AUDIT.md` (Finding UX-F04), `frontend/src/config/site.ts:18-19`.
- **Files Affected:** `frontend/src/config/site.ts`.
- **Dependencies:** Input from project owner for actual business phone number.
- **Risks:** None.
- **Acceptance Criteria:**
  - Valid Egyptian WhatsApp URL formatted properly (`https://wa.me/201...`).
- **Tests Required:** Header and Footer snapshot/unit tests.
- **Priority:** **P0**

---

### Phase P1: Information Architecture, Typography, Navigation & Checkout Usability

#### Task P1.1: Customer-Facing WhatsApp Concierge Button & Copy
- **Objective:** Rephrase success screen CTA from administrative phrasing to customer-centric phrasing.
- **Evidence:** `docs/audits/UX_AUDIT.md` (Finding UX-F07), `app/checkout/success/page.tsx:273`.
- **Files Affected:** `frontend/src/app/checkout/success/page.tsx`.
- **Dependencies:** None.
- **Risks:** None.
- **Acceptance Criteria:**
  - Button text: "تأكيد ومتابعة الطلب مع خدمة العملاء عبر واتساب".
  - Opens WhatsApp with pre-filled order number, total amount, and direct tracking URL.
- **Tests Required:** Vitest `checkout/success` test.
- **Priority:** **P1**

#### Task P1.2: Structured Horology & Leathercraft Specifications on PDP
- **Objective:** Provide structured material and technical details for luxury watches and leathercraft.
- **Evidence:** `docs/audits/UX_AUDIT.md` (Finding UX-F03), `app/products/[slug]/page.tsx:180-220`.
- **Files Affected:** `frontend/src/app/products/[slug]/page.tsx`.
- **Dependencies:** Existing product catalog attributes.
- **Risks:** None.
- **Acceptance Criteria:**
  - Collapsible luxury accordion displaying case diameter, glass, water resistance, movement, and leather tanning.
- **Tests Required:** Vitest PDP rendering test.
- **Priority:** **P1**

#### Task P1.3: Real Policy Pages (Shipping, Returns, Consumer Rights)
- **Objective:** Eliminate dead-end `#` footer links and satisfy Egyptian Consumer Protection Agency transparency standards.
- **Evidence:** `docs/audits/UX_AUDIT.md` (Finding UX-F05), `Footer.tsx:140-160`.
- **Files Affected:**
  - Create: `frontend/src/app/policies/shipping/page.tsx`
  - Create: `frontend/src/app/policies/returns/page.tsx`
  - Create: `frontend/src/app/policies/terms/page.tsx`
  - Modify: `frontend/src/components/layout/Footer.tsx`
- **Dependencies:** None. Content based on verified project trust pillars (27 governorates, 14-day exchange, COD inspection).
- **Risks:** None.
- **Acceptance Criteria:**
  - Clean editorial layouts in Warm Ivory and Obsidian detailing policies.
  - All footer links resolve with HTTP 200.
- **Tests Required:** Route resolution check.
- **Priority:** **P1**

#### Task P1.4: Order History Section in Customer Profile
- **Objective:** Display the customer's past orders and tracking links directly on the `/profile` page.
- **Evidence:** `docs/audits/PAGE_BY_PAGE_AUDIT.md:2.8`.
- **Files Affected:**
  - Create: `frontend/src/components/profile/OrderHistoryList.tsx`
  - Modify: `frontend/src/app/profile/page.tsx`
- **Dependencies:** Backend `GET /api/orders/my-orders` is already implemented.
- **Risks:** None.
- **Acceptance Criteria:**
  - Profile renders a tab or card showing past orders, statuses, dates, and direct link to `/track-order`.
- **Tests Required:** Vitest `ProfilePage` test update.
- **Priority:** **P1**

---

### Phase P2: Visual Consistency, Design System & Responsive Refinement

#### Task P2.1: Design Tokens Unification & Hex Clean-up
- **Objective:** Replace remaining raw hex strings in JSX with semantic Tailwind theme tokens (`border-gold-500/40`, `bg-gold-100`, `text-gold-700`).
- **Evidence:** `docs/audits/DESIGN_SYSTEM_AUDIT.md` (Findings DS-01, DS-04).
- **Files Affected:**
  - `frontend/src/app/page.tsx`
  - `frontend/src/components/layout/Header.tsx`
- **Dependencies:** `globals.css` `@theme` definitions.
- **Risks:** None.
- **Acceptance Criteria:** Zero raw `#C5A059` or `#876725` in page templates.
- **Tests Required:** `npm run build` and visual inspection.
- **Priority:** **P2**

#### Task P2.2: Mobile Hero Visual Stacking Optimization
- **Objective:** Ensure a physical timepiece photo is immediately visible above the fold on mobile viewports (<640px).
- **Evidence:** `docs/audits/UX_AUDIT.md` (Finding UX-F02), `app/page.tsx:107`.
- **Files Affected:** `frontend/src/app/page.tsx`.
- **Dependencies:** None.
- **Risks:** Ensure desktop layout remains unchanged.
- **Acceptance Criteria:**
  - On mobile, product visual renders compactly below the headline before trust pillars.
- **Tests Required:** Responsive viewport inspection (375px and 390px).
- **Priority:** **P2**

---

### Phase P3: Subtle Micro-Interactions & Concierge Polish

#### Task P3.1: Bespoke Luxury Scrollbars & Drawer Polish
- **Objective:** Style cart drawer and modal dialog scrollbars in warm ivory and gold hairline.
- **Evidence:** `docs/audits/DESIGN_SYSTEM_AUDIT.md` (Finding DS-03).
- **Files Affected:** `frontend/src/styles/globals.css`.
- **Dependencies:** None.
- **Risks:** None.
- **Acceptance Criteria:** Clean scrollbar styling matching `--ivory-200` surface.
- **Priority:** **P3**

#### Task P3.2: Mobile Multi-Image Preview Gestures on Product Cards
- **Objective:** Enable smooth touch preview of secondary product photo on mobile touchscreens.
- **Evidence:** `docs/audits/UX_AUDIT.md` (Finding UX-F08).
- **Files Affected:** `frontend/src/components/product/ProductCard.tsx`.
- **Dependencies:** Multi-image array from catalog.
- **Risks:** Touch scroll performance.
- **Acceptance Criteria:** Clean dot indicators or swipeable preview without lag.
- **Priority:** **P3**

---

### Phase P4: Production Deployment Infrastructure & Final Release Validation

#### Task P4.1: Production Dockerfile & Compose Configuration
- **Objective:** Create production-grade multi-stage Dockerfiles for Next.js standalone and Spring Boot JRE 21.
- **Evidence:** `docs/audits/DEPLOYMENT_AUDIT.md`.
- **Files Affected:**
  - Create: `backend/Dockerfile`
  - Create: `frontend/Dockerfile`
  - Create: `compose.prod.yml`
  - Create: `nginx.conf`
  - Create: `.dockerignore`
- **Dependencies:** Target hosting decision from project owner.
- **Risks:** Requires Docker daemon to build and test.
- **Acceptance Criteria:**
  - Multi-stage builds produce minimal, secure container images.
  - Healthchecks pass on both containers.
- **Tests Required:** `docker compose -f compose.prod.yml build` (subject to owner environment).
- **Priority:** **P4**

---

## 3. Approval Gate & Next Action

> [!IMPORTANT]
> In accordance with the project execution rules, **no implementation code will be written or modified until this Master Audit & Implementation Plan is reviewed and approved by the project owner**.
>
> Please confirm whether you approve this roadmap, or specify any adjustments to task priorities.
