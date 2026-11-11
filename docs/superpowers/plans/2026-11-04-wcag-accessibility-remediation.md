# WCAG 2.2 Accessibility Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all 15 accessibility issues identified in the WCAG 2.2 audit across customer-facing frontend components, achieving full keyboard navigation, screen reader compatibility, and focus management.

**Architecture:** Refactor interactive controls to strictly adhere to semantic HTML5 and WAI-ARIA authoring practices. Replace nested interactive links/buttons with sibling layered overlays, implement reusable focus-trapping inside modal overlays (`Sheet` and `Dialog`), add programmatic focus management for form validation errors, wrap payment choices in an accessible `radiogroup` with roving tabIndex, correct heading structures, and provide polite live regions for async state updates.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.8 Strict, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

**Spec:** `docs/audits/RESPONSIVE_ACCESSIBILITY_AUDIT.md` and current session audit findings in `awesome-accessibility-audit`.

## Global Constraints

- Never break existing UI layout, typography, or the obsidian/gold/ivory luxury aesthetic.
- Zero regressions in existing 56 Vitest frontend tests and 108 backend tests.
- Maintain RTL-first layout integrity and ensure English terms carry `lang="en"`.
- All interactive controls must meet WCAG 2.2 target size (minimum 24×24px hit area, ideally 40-44px).
- Strictly adhere to `prefers-reduced-motion: reduce` across all animations and transitions.

## Review Focus

1. Modal and Drawer keyboard traps: When user tabs past the last focusable element in `Sheet` or `Dialog`, focus must cycle back to the first element and never escape into background DOM.
2. Form validation error focus: When customer submits checkout with empty/invalid inputs, focus must move directly into the first invalid input element, not just scroll.
3. Nested interactive controls: A card's primary `<Link>` must not contain child `<button>` tags; image preview dots must be sibling overlays.
4. Radio group keyboard behavior: Payment methods must be navigable via ArrowUp/ArrowDown/ArrowLeft/ArrowRight keys in addition to click.
5. Skip Link anchor positioning: Activating "الانتقال إلى المحتوى الرئيسي" must focus the main container without being obscured by the sticky header.

---

### Task 1: Eliminate Nested Interactive Controls & Fix Touch Target Size in ProductCard

**Files:**
- Modify: `frontend/src/components/product/ProductCard.tsx`
- Test: `frontend/src/components/product/__tests__/ProductCard.test.tsx`

**Interfaces:**
- Consumes: `Product` type from `@/types`, `useCart` from `@/context/CartContext`.
- Produces: Accessible `ProductCard` where `<Link>` does not nest `<button>`, and dot indicators have at least 24×24px touch hit area with descriptive `aria-label`.

- [ ] **Step 1: Write the failing test for non-nested controls and accessible dot indicators**

In `frontend/src/components/product/__tests__/ProductCard.test.tsx`:
Add a test verifying that image switch buttons are not descendants of any `<a>` element, and verify that each button has an accessible label `عرض صورة 1 من ...`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/product/__tests__/ProductCard.test.tsx`
Expected: FAIL if verifying button is outside anchor tag.

- [ ] **Step 3: Refactor `ProductCard.tsx`**

Restructure the image container:
1. Make the image frame a relative container where `<Link>` wraps only the image view.
2. Place the dot navigation container outside the `<Link>` as a sibling with `z-10`.
3. Add `before:absolute before:-inset-2.5 before:content-['']` to dot buttons to expand the touch target to 26px+.
4. Set `aria-label={`عرض صورة ${idx + 1} من ${availableImages.length} لـ ${product.nameAr}`}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/product/__tests__/ProductCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/product/ProductCard.tsx frontend/src/components/product/__tests__/ProductCard.test.tsx
git commit -m "fix(a11y): un-nest dot buttons from product card link and enlarge touch targets"
```

---

### Task 2: Implement Keyboard Focus Trap, Auto-Focus & Return-Focus in Sheet and Dialog

**Files:**
- Modify: `frontend/src/components/ui/Sheet.tsx`
- Modify: `frontend/src/components/ui/Dialog.tsx`
- Test: `frontend/src/components/ui/__tests__/Sheet.test.tsx`

**Interfaces:**
- Consumes: Standard React props (`isOpen`, `onClose`, `title`, `children`).
- Produces: Focus-trapping modal and drawer dialogs conforming to WAI-ARIA Dialog (Modal) pattern.

- [ ] **Step 1: Write the failing test for focus trap in Sheet**

Create `frontend/src/components/ui/__tests__/Sheet.test.tsx` testing that when `Sheet` is open, pressing Tab on the last element cycles to the first element, and closing the sheet returns focus to the previously active element.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/ui/__tests__/Sheet.test.tsx`
Expected: FAIL (Focus does not wrap or return).

- [ ] **Step 3: Implement Focus Trap in `Sheet.tsx` and `Dialog.tsx`**

1. Create a `contentRef` on the modal/sheet container.
2. When `isOpen` becomes true, record `document.activeElement` as `previousActiveElementRef`.
3. Auto-focus the first focusable element inside the modal.
4. Add a `keydown` handler for `Tab`: if `e.shiftKey` and at first element, focus last element; if not `shiftKey` and at last element, focus first element.
5. On unmount/close, restore focus to `previousActiveElementRef.current?.focus()`.
6. Translate `Dialog.tsx` close button `aria-label` to Arabic `"إغلاق النافذة"` and ensure minimum target size 44×44px.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/ui/__tests__/Sheet.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Sheet.tsx frontend/src/components/ui/Dialog.tsx frontend/src/components/ui/__tests__/Sheet.test.tsx
git commit -m "fix(a11y): implement focus trap, auto-focus, and return-focus in Sheet and Dialog"
```

---

### Task 3: Form Error Focus Transfer, Radiogroup Pattern & HelperText Linking

**Files:**
- Modify: `frontend/src/components/ui/Input.tsx`
- Modify: `frontend/src/components/checkout/CheckoutForm.tsx`
- Modify: `frontend/src/components/checkout/PaymentMethodSelector.tsx`
- Test: `frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx`

**Interfaces:**
- Consumes: `validateCheckoutForm`, `InputProps`, `PaymentMethod`.
- Produces: Programmatic focus transfer to invalid fields on submit, accessible radiogroup with arrow navigation, and helper text announced via `aria-describedby`.

- [ ] **Step 1: Write the failing test for error focus transfer and radiogroup attributes**

In `frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx`:
Add a test asserting that submitting an invalid form sets focus (`document.activeElement`) to the first invalid field (`checkout-customerName`), and verify `PaymentMethodSelector` renders `role="radiogroup"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/checkout/__tests__/CheckoutForm.test.tsx`
Expected: FAIL (Focus remains on submit button, radiogroup role missing).

- [ ] **Step 3: Implement the fixes in `Input.tsx`, `CheckoutForm.tsx`, and `PaymentMethodSelector.tsx`**

1. In `Input.tsx`:
   Generate `helperId = `${inputId}-helper`` when `helperText` is present. Combine `errorId` and `helperId` into `aria-describedby`.
   Add `role="alert"` and `aria-live="polite"` to error `<p>`.
   Fix placeholder opacity by using `placeholder:text-muted-foreground` (removing `/60`).
2. In `CheckoutForm.tsx`:
   In `handleSubmit`: when validation fails, find the element and execute `elem?.focus()` immediately after scrolling.
   Add `role="status"` region announcing: `"يوجد {count} أخطاء في نموذج الطلب، يرجى مراجعة الحقول المطلوبة."`
3. In `PaymentMethodSelector.tsx`:
   Wrap options in `<div role="radiogroup" aria-labelledby="payment-methods-heading">`.
   Set roving `tabIndex={value === 'CASH_ON_DELIVERY' ? 0 : -1}`.
   Add `onKeyDown` supporting ArrowDown/ArrowRight (select next) and ArrowUp/ArrowLeft (select previous).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/checkout/__tests__/CheckoutForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Input.tsx frontend/src/components/checkout/CheckoutForm.tsx frontend/src/components/checkout/PaymentMethodSelector.tsx frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx
git commit -m "fix(a11y): add programmatic error focus, radiogroup navigation, and helperText aria links"
```

---

### Task 4: Heading Hierarchy, Scroll Margins & Semantic Table/Timeline Markup

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/products/[slug]/page.tsx`
- Modify: `frontend/src/components/orders/OrderTrackingTimeline.tsx`
- Modify: `frontend/src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: Next.js Layout and Page templates.
- Produces: Clean sequential heading structure (`h1` -> `h2` -> `h3`), unobscured skip-link targets, semantic `<table>` specifications, and ordered `<ol>` tracking timeline.

- [ ] **Step 1: Layout & Skip Link Unobscured Focus**

In `frontend/src/app/layout.tsx`:
Update `<main id="main-content" className="flex-1 scroll-mt-24 focus:outline-none" tabIndex={-1}>` so the sticky header does not obscure focused content.

- [ ] **Step 2: Fix Heading Hierarchy on Homepage and ProductDetailPage**

In `frontend/src/app/page.tsx`:
Add an accessible `<h2 className="sr-only">مميزات وضمانات الشراء من VARELLION</h2>` in Section 2 before the `<h3>` cards.
In `frontend/src/app/products/[slug]/page.tsx`:
Promote "تفاصيل ومواصفات القطعة" to `<h2>` and update sub-headings to `<h3>`.

- [ ] **Step 3: Semantic Table for Specifications & Ordered List for Timeline**

In `frontend/src/app/products/[slug]/page.tsx`:
Convert the specification grid to a semantic HTML `<table>` with `<caption>`, `<thead>`, `<tbody>`, `<th scope="row">` and `<td>`.
Update image thumbnail buttons to include `aria-label={`عرض صورة رقم ${idx + 1} من ${product.images.length}`}` and `aria-pressed={selectedImage === img.imageUrl}`.
In `frontend/src/components/orders/OrderTrackingTimeline.tsx`:
Render tracking steps as an ordered list `<ol role="list">` with `aria-label="مراحل تتبع الطلب"` and add `aria-current={isCurrent ? 'step' : undefined}`.

- [ ] **Step 4: External Link Warning in Footer**

In `frontend/src/components/layout/Footer.tsx`:
Add `<span className="sr-only">(يفتح في نافذة جديدة)</span>` inside the WhatsApp external anchor. Add `lang="en"` and `lang="fr"` to transliterated slogans.

- [ ] **Step 5: Verify tests and commit**

Run: `cd frontend && npm test -- --run`
Expected: 13/13 files pass.
```bash
git add frontend/src/app/layout.tsx frontend/src/app/page.tsx frontend/src/app/products/[slug]/page.tsx frontend/src/components/orders/OrderTrackingTimeline.tsx frontend/src/components/layout/Footer.tsx
git commit -m "fix(a11y): normalize heading hierarchy, unobscure skip link, and convert to semantic table and stepper"
```

---

### Task 5: Live Regions for Dynamic Updates & Reduced Motion Support

**Files:**
- Modify: `frontend/src/components/layout/SearchDialog.tsx`
- Modify: `frontend/src/components/cart/CartDrawer.tsx`
- Modify: `frontend/src/components/cart/CartToast.tsx`
- Modify: `frontend/src/styles/globals.css`

**Interfaces:**
- Consumes: Tailwind CSS theme and React live update triggers.
- Produces: Screen reader announcements on cart/search changes and system-level motion reduction compliance.

- [ ] **Step 1: Add polite live regions in SearchDialog and CartDrawer**

In `SearchDialog.tsx`:
Add `<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">` announcing result counts.
In `CartDrawer.tsx`:
Add a live region announcing quantity updates, items removed, and current subtotal.
In `CartToast.tsx`:
Ensure the `role="status"` region persists in the DOM so that screen readers reliably announce new toast messages, and enlarge close button hit area to 44×44px.

- [ ] **Step 2: Add `prefers-reduced-motion` in `globals.css`**

Add:
```css
@media (prefers-reduced-motion: reduce) {
  html:focus-within {
    scroll-behavior: auto;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Verification & Test Run**

Run full validation:
`cd frontend && npm run type-check && npm test -- --run`
Expected: 0 type errors, 100% tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/SearchDialog.tsx frontend/src/components/cart/CartDrawer.tsx frontend/src/components/cart/CartToast.tsx frontend/src/styles/globals.css
git commit -m "fix(a11y): add polite live regions for search/cart and respect prefers-reduced-motion"
```
