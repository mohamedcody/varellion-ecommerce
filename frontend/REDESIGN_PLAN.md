# VARELLION — Frontend Visual Redesign & Quality Implementation Plan

**Document Version:** 1.0.0  
**Target Completion:** Feature-by-Feature with Continuous Verification  
**Standard:** WCAG 2.2 Level AA, Next.js 15 App Router, Zero Regressions  

---

## 1. Implementation Principles & Guardrails

1. **Feature-by-Feature Controlled Execution:** Never refactor the entire application at once. Every phase must compile cleanly (`npm run build`), pass all Vitest tests (`npm test`), and maintain 100% existing functionality (cart persistence, auth tokens, COD checkout, 27 governorates shipping calculations).
2. **Zero Fabrication:** Preserve all existing database IDs, API contracts, and real product specifications. No fake ratings, no fake reviews, no arbitrary marketing claims.
3. **No Breaking Backend or API Changes:** All changes are strictly confined to the frontend presentation layer and UI tokens.

---

## 2. Phase-by-Phase Roadmap

### Phase 1: Tokens, Global Theme & Typography Foundation
- [ ] **Task 1.1 — CSS Design Tokens Overhaul (`globals.css`):**
  - Replace the teal palette (`#12363B`, `#2D7F83`) with Obsidian Charcoal (`#0E0F11`, `#141619`, `#1A1D20`), Warm Ivory (`#FAF9F6`, `#F4F1EA`, `#EAE5D9`), and Brushed Gold (`#C5A059`, `#876725`).
  - Configure semantic Tailwind theme tokens (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--border`, `--ring`).
  - Set baseline typography rules, smooth scrolling, and selection highlights.
- [ ] **Task 1.2 — Google Fonts Integration (`layout.tsx`):**
  - Load `Tajawal` (for primary Arabic body & headings) and `Cinzel` (for brand wordmark and English display) using Next.js `next/font/google`.
  - Expose CSS font variables `--font-tajawal` and `--font-cinzel`.
  - Add accessible Skip to Content bypass link (`#main-content`) for WCAG 2.4.1 compliance.
- [ ] **Verification:** Run `npm test` and build check. Confirm fonts load without layout shift.

---

### Phase 2: Base UI Component Library Hardening
- [ ] **Task 2.1 — Button Component (`Button.tsx`):**
  - Refactor `buttonVariants` to eliminate hardcoded hex colors and use semantic tokens.
  - Upgrade `luxury` variant to Obsidian with gold hairline border.
  - Upgrade `gold` variant to brushed gold with high-contrast text.
  - Ensure all button sizes guarantee at least `44px` height on mobile for WCAG 2.5.8.
- [ ] **Task 2.2 — Badge Component (`Badge.tsx`):**
  - Standardize badge variants (`default`, `luxury`, `gold`, `outline`, `success`, `warning`).
  - Ensure high-contrast gold text (`#876725`) on light backgrounds.
- [ ] **Task 2.3 — Card & Input Components (`Card.tsx`, `Input.tsx`):**
  - Implement refined 10px corner radius, warm ivory hairline borders, and subtle diffuse elevation.
  - Style form inputs with warm ivory backgrounds, gold focus rings, and proper error states.
- [ ] **Verification:** Verify button and input unit tests pass.

---

### Phase 3: Global Shell (Header, Navigation & Footer)
- [ ] **Task 3.1 — Top Announcement Bar & Sticky Header (`Header.tsx`):**
  - Redesign top bar in deep Obsidian Black (`#0E0F11`) with warm ivory typography and gold trust markers.
  - Redesign brand identity mark to a bespoke `VARELLION` typographic logo with serif elegance.
  - Refactor navigation links with refined hover underlines and active gold markers.
  - Upgrade search shortcut button and user profile dropdown with warm ivory / obsidian contrast.
- [ ] **Task 3.2 — Mobile Navigation Drawer (`MobileNav.tsx`):**
  - Ensure mobile navigation feels like a luxury personal concierge drawer, with 44px+ touch targets and clear category navigation.
- [ ] **Task 3.3 — Comprehensive Luxury Footer (`Footer.tsx`):**
  - Replace conflicting teal backgrounds with unified Obsidian Charcoal.
  - Display the 4 Egyptian confidence pillars (inspection prior to payment, COD, 14-day exchange, 27 governorates delivery) with bespoke luxury iconography.
  - Clarify customer support hours, official WhatsApp channel, and payment badges (COD, Visa, Meeza, Vodafone Cash).
- [ ] **Verification:** Verify responsive behavior at 375px (mobile), 768px (tablet), and 1280px (desktop).

---

### Phase 4: Product Discovery & Catalog (Cards, Grid & Filter)
- [ ] **Task 4.1 — Luxury Product Card (`ProductCard.tsx`):**
  - Refactor card to clean white/ivory surface with subtle 1px border.
  - Implement smooth secondary image crossfade on hover when additional images exist.
  - Upgrade price typography with bold tabular numbers (`tabular-nums`) and clean Egyptian Pound formatting.
  - Add discreet stock indicators (e.g., `جاهز للشحن الفوري` or low-stock warning).
  - Streamline the Quick Add to Cart interaction.
- [ ] **Task 4.2 — Catalog Page & Filters (`app/products/page.tsx`):**
  - Redesign category filter pills and sorting dropdown into an editorial toolbar.
  - Improve search input with debounce and instant clearing.
  - Polish empty and loading skeleton states.
- [ ] **Verification:** Test category switching, search queries, and stock counters.

---

### Phase 5: Homepage Redesign (3-Second Luxury Conversion)
- [ ] **Task 5.1 — Editorial Hero Section (`app/page.tsx`):**
  - Replace the generic AI green gradient with a high-impact editorial hero featuring real watch & leather imagery.
  - Deliver immediate value proposition within 3 seconds: what VARELLION sells, 100% genuine materials, inspection before payment, and direct shop CTAs.
- [ ] **Task 5.2 — Egyptian Trust Pillars Bar:**
  - Redesign trust pillars into an understated, cohesive bar with gold accents and clear microcopy.
- [ ] **Task 5.3 — Curated Category Visual Showcase:**
  - Eliminate generic Web3 radial glow overlays.
  - Build tactile visual category cards with authentic leather and timepiece photography and elegant typography.
- [ ] **Task 5.4 — Horology & Leathercraft Guarantee Section:**
  - Showcase full-grain vegetable-tanned leather, 316L stainless steel, and sapphire crystal standards in an editorial layout.
- [ ] **Verification:** Verify visual hierarchy, typography rhythm, and mobile responsive stacking.

---

### Phase 6: Product Detail Page (PDP)
- [ ] **Task 6.1 — PDP Visual Layout (`app/products/[slug]/page.tsx`):**
  - Enhance product gallery with active thumbnail borders and smooth image transitions.
  - Implement clean price display, model SKU, and stock availability signals.
  - Refine action buttons (`أضف إلى سلة المشتريات` and `عرض السلة ومراجعة الطلب`).
  - Display craftsmanship specifications (materials, movement, water resistance) in structured accordions or cards.
- [ ] **Verification:** Test product with multiple images and out-of-stock product behavior.

---

### Phase 7: Shopping Cart Drawer & Checkout Flow
- [ ] **Task 7.1 — Cart Drawer Experience (`CartDrawer.tsx`):**
  - Polish slide-out drawer on left side (matching header icon in RTL).
  - Refine quantity stepper with tactile buttons and clear stock limit notices.
  - Ensure transparent order subtotal with explicit note regarding 27 governorates shipping.
- [ ] **Task 7.2 — Checkout Page & Order Summary (`checkout/page.tsx`, `CheckoutForm.tsx`, `OrderSummaryCard.tsx`):**
  - Refine the two-column checkout layout (form on right in RTL, summary card on left).
  - Polish governorate dropdown with dynamic shipping rates across all 27 governorates.
  - Ensure payment method selector (COD vs Card/Wallet) is crystal clear with zero dark patterns.
  - Enhance mobile summary collapsible accordion.
- [ ] **Verification:** Run `CheckoutForm.test.tsx` and test a full checkout simulation.

---

### Phase 8: Order Tracking & Customer Profile
- [ ] **Task 8.1 — Order Tracking Page (`track-order/page.tsx`):**
  - Refine search inputs for Order Number and Egyptian Mobile Number with inline validation.
  - Polish the order timeline visual progress bar.
- [ ] **Task 8.2 — Customer Profile & Address Book (`profile/page.tsx`):**
  - Polish personal information card and delivery address management.
- [ ] **Verification:** Run `customer.test.ts` and `page.test.tsx`.

---

### Phase 9: Comprehensive End-to-End Verification & Audit
- [ ] **Task 9.1 — Automated Test Suite Execution:** Run full Vitest suite and verify 21/21 passing.
- [ ] **Task 9.2 — Production Build Verification:** Run `npm run build` to ensure 0 TypeScript or linting errors.
- [ ] **Task 9.3 — WCAG 2.2 AA Contrast & Accessibility Review:** Verify all text meets 4.5:1 ratio and touch targets meet 44px.
- [ ] **Task 9.4 — Update Documentation:** Finalize `UI_UX_PROGRESS.md` with completed changes.
