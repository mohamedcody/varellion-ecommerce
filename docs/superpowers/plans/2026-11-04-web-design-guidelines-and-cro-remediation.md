# Web Design Guidelines & CRO Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement verified, non-destructive Web Interface Guidelines (Vercel standard) and CRO improvements: eliminate `transition-all` layout recalculations, standardize typographic ellipsis (`…`), add input usability attributes (`spellCheck={false}`), prevent heading orphans (`text-balance`), add client-side UTM persistence for ad attribution, and provide graceful image load fallbacks.

**Architecture:** Client-side UI enhancements across Next.js 15 App Router components. Explicit CSS transitions reduce composite/paint cycles. Form input attributes improve mobile keyboard behavior. Client-side UTM capture persists ad tracking in `sessionStorage` without mutating backend API schemas. Graceful `onError` handlers prevent broken image states.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

**Spec:** Audits conducted under `/web-design-guidelines` (Vercel Labs Web Interface Guidelines) and `/awesome-landing-audit` (CRO & conversion structure).

## Global Constraints

- Zero breaking changes to existing backend JPA or REST API contracts.
- Strictly preserve existing design tokens, luxury brand palette, and dark theme consistency.
- Maintain full Arabic RTL layout support.
- All 14 existing frontend test suites (61 tests) must continue to pass.
- TypeScript strict mode must pass with 0 errors.

## Review Focus

1. `transition-all` removal must not cause jarring, unstyled instant state jumps — explicitly list animated properties (`transition-colors`, `transition-[opacity,transform]`, etc.).
2. Typographic ellipsis replacement must target only user-facing UI text strings, never JavaScript spread operators (`...props`).
3. Form input flags (`spellCheck={false}`) must not interfere with standard form submission or validation.
4. Client-side UTM helper must be SSR-safe (guarded with `typeof window !== 'undefined'`) and handle storage quotas gracefully.
5. Image `onError` handlers must prevent infinite error event loops if the fallback itself fails.

---

## Tasks

### Task 1: Eliminate `transition-all` Performance Anti-Pattern

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/product/ProductCard.tsx`
- Modify: `frontend/src/components/checkout/PaymentMethodSelector.tsx`
- Modify: `frontend/src/components/orders/OrderTrackingTimeline.tsx`
- Modify: `frontend/src/components/checkout/OrderSummaryCard.tsx`
- Modify: `frontend/src/components/auth/GoogleSignInButton.tsx`

- [ ] **Step 1:** In `frontend/src/components/ui/Button.tsx`, replace `transition-all duration-200` with `transition-[color,background-color,border-color,box-shadow,transform] duration-200`.
- [ ] **Step 2:** In `frontend/src/components/layout/Header.tsx`, replace `transition-all duration-200` with `transition-[background-color,border-color,box-shadow] duration-200`, and replace interactive chip/button `transition-all` with `transition-colors`.
- [ ] **Step 3:** In `frontend/src/components/product/ProductCard.tsx`, replace image `transition-all duration-500` with `transition-[opacity,transform] duration-500 ease-out`, and replace dot indicators `transition-all duration-300` with `transition-[width,background-color] duration-300`. Remove redundant `transition-all` from button.
- [ ] **Step 4:** In `frontend/src/components/checkout/PaymentMethodSelector.tsx`, replace `transition-all` on radio containers with `transition-[background-color,border-color,box-shadow]`.
- [ ] **Step 5:** In `frontend/src/components/orders/OrderTrackingTimeline.tsx`, replace `transition-all` on step `<li>` with `transition-[background-color,border-color,box-shadow]`.
- [ ] **Step 6:** In `frontend/src/components/checkout/OrderSummaryCard.tsx`, replace `transition-all duration-300` on the progress bar with `transition-[width] duration-300`.
- [ ] **Step 7:** In `frontend/src/components/auth/GoogleSignInButton.tsx`, replace `transition-all` on the container with `transition-opacity`.
- [ ] **Step 8:** Run `npm test -- --run` to verify UI components render and function without regression.

---

### Task 2: Standardize Typography Ellipsis (`…`), Form Usability (`spellCheck={false}`), and Icon A11y

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/app/login/page.tsx`
- Modify: `frontend/src/app/register/page.tsx`
- Modify: `frontend/src/app/track-order/page.tsx`
- Modify: `frontend/src/components/checkout/CheckoutForm.tsx`
- Modify: `frontend/src/components/checkout/ShippingGovernorateSelect.tsx`
- Modify: `frontend/src/app/products/page.tsx`
- Modify: `frontend/src/app/checkout/callback/page.tsx`
- Modify: `frontend/src/app/checkout/mock-paymob/page.tsx`
- Modify: `frontend/src/app/checkout/success/page.tsx`
- Modify: `frontend/src/components/auth/GoogleSignInButton.tsx`
- Modify: `frontend/src/app/policies/shipping/page.tsx`

- [ ] **Step 1:** In `frontend/src/components/ui/Button.tsx`, add `aria-hidden="true"` to `<Loader2 />`.
- [ ] **Step 2:** In `frontend/src/app/login/page.tsx`, replace `...` with `…` in loading copy; add `spellCheck={false}` and `autoCapitalize="none"` to the identifier input.
- [ ] **Step 3:** In `frontend/src/app/register/page.tsx`, replace `...` with `…` in loading copy; add `spellCheck={false}` and `autoCapitalize="none"` to username and email inputs.
- [ ] **Step 4:** In `frontend/src/app/track-order/page.tsx`, replace `...` with `…` in loading/search copy; add `spellCheck={false}` and `autoCapitalize="none"` to orderNumber input; add `inputMode="tel"` and `autoComplete="tel"` to customer phone input.
- [ ] **Step 5:** In `frontend/src/components/checkout/CheckoutForm.tsx` & `ShippingGovernorateSelect.tsx`, replace `...` with `…` in placeholders and submit loading copy.
- [ ] **Step 6:** In `frontend/src/app/products/page.tsx`, `callback/page.tsx`, `mock-paymob/page.tsx`, `success/page.tsx`, `policies/shipping/page.tsx`, and `GoogleSignInButton.tsx`, replace user-facing `...` with `…`.
- [ ] **Step 7:** Run `npm test -- --run` to verify test suite passes.

---

### Task 3: Visual Polish & Heading Text Balancing (`text-balance`)

**Files:**
- Modify: `frontend/src/app/products/[slug]/page.tsx`
- Modify: `frontend/src/app/checkout/page.tsx`

- [ ] **Step 1:** In `frontend/src/app/products/[slug]/page.tsx`, add `text-balance` to the main product title `<h1>`.
- [ ] **Step 2:** In `frontend/src/app/checkout/page.tsx`, add `text-balance` to the checkout heading `<h1>`.
- [ ] **Step 3:** Run `npm run type-check` to verify no syntax or styling issues.

---

### Task 4: Client-Side Marketing Attribution (UTM Storage) & Image Load Resilience

**Files:**
- Create: `frontend/src/lib/utm.ts`
- Create: `frontend/src/lib/__tests__/utm.test.ts`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/product/ProductCard.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1:** Write failing unit tests in `frontend/src/lib/__tests__/utm.test.ts` testing `captureUtmParameters()`, `getStoredUtmParameters()`, and `clearStoredUtmParameters()`.
- [ ] **Step 2:** Run `npm test -- frontend/src/lib/__tests__/utm.test.ts` to confirm tests fail.
- [ ] **Step 3:** Implement `frontend/src/lib/utm.ts` with safe URL search params parsing, sanitization, and guarded `sessionStorage` persistence (`varellion_utm`).
- [ ] **Step 4:** Re-run `npm test -- frontend/src/lib/__tests__/utm.test.ts` to confirm tests pass.
- [ ] **Step 5:** Integrate UTM capture inside `frontend/src/app/layout.tsx` (or a client wrapper) to ensure visitor campaign attribution is recorded on initial visit.
- [ ] **Step 6:** In `frontend/src/components/product/ProductCard.tsx` and `frontend/src/app/page.tsx`, add an `onError` handler on product/hero `<img>` elements to fallback to a graceful SVG placeholder instead of rendering a broken image state.
- [ ] **Step 7:** Run `npm test -- --run` to ensure all tests pass.

---

### Task 5: Full-Suite Verification & Clean Git Commit

**Files:**
- Modified and created files across frontend.

- [ ] **Step 1:** Run `npm run type-check` in `frontend/` (expect 0 errors).
- [ ] **Step 2:** Run `npm test -- --run` in `frontend/` (expect 100% pass across all test suites).
- [ ] **Step 3:** Run backend verification `mvn test` in `backend/` to confirm complete zero-regression across the stack.
- [ ] **Step 4:** Create a structured git commit on `feature/checkout-cod-flow` documenting the Web Interface Guidelines and CRO updates.
