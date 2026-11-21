# Handoff Report — Order Tracking Components Audit (R2)

**Author:** teamwork_explorer_survey_r3_2  
**Recipient:** Project Orchestrator (9a4236a7-3bf1-4100-947a-3c4f8baa61ed)  
**Date:** 2026-11-12T14:16:30Z  
**Type:** Hard Handoff (Investigation Complete)

---

## 1. Observation

Direct code examination of the three assigned files revealed the following exact observations:

### Observation 1.1: Brand Name "VARELLION" Missing `translate="no"`
- **File:** `frontend/src/components/orders/OrderTrackingCard.tsx`
  - **Line 150:**
    ```tsx
    <span>ضمان VARELLION الملكي وخدمة العملاء</span>
    ```
    "VARELLION" is rendered as plain text within Arabic copy without `<span translate="no">`.
- **File:** `frontend/src/components/orders/OrderTrackingTimeline.tsx`
  - **Line 33:**
    ```ts
    description: 'فحص جودة القطع وتغليفها في صندوق VARELLION الفاخر',
    ```
    Rendered at Line 213 as `{step.description}` without `translate="no"`.
  - **Line 131:**
    ```tsx
    <span>هذا الطلب تم إلغاؤه. للتواصل وإعادة التفعيل، يرجى محادثة خدمة عملاء VARELLION.</span>
    ```
    "VARELLION" is rendered as plain text without `<span translate="no">`.

### Observation 1.2: Missing Visible Keyboard Focus Indicators (`focus-visible:ring-*`)
- **File:** `frontend/src/app/track-order/page.tsx`
  - **Line 136 (Breadcrumb Link):**
    ```tsx
    <Link href="/" className="hover:text-foreground transition-colors">
      الرئيسية
    </Link>
    ```
    Lacks `focus-visible:ring-*` or `focus-visible:outline-none`.
  - **Line 235 (Demo Order Button):**
    ```tsx
    <button
      type="button"
      onClick={handleApplyDemoOrder}
      className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      <span>تجربة أوردر افتراضي للاختبار</span>
    </button>
    ```
    Lacks `focus-visible:ring-*` or `focus-visible:outline-none`.

### Observation 1.3: Input Placeholders Ellipsis Status
- **File:** `frontend/src/app/track-order/page.tsx`
  - **Line 172:** `placeholder="مثال: VAR-20261028-4821"` (No ellipsis present).
  - **Line 192:** `placeholder="010xxxxxxxx"` (No ellipsis present).
  - **Line 220:** `<span>بحث…</span>` uses typographical `…` (U+2026).
  - **Line 279:** `جاري تحميل بوابة تتبع الشحنات…` uses typographical `…` (U+2026).
  Neither placeholder ends in three dots `...`.

### Observation 1.4: Missing Reduced Motion Safeguard (`motion-reduce:animate-none`)
- **File:** `frontend/src/app/track-order/page.tsx`
  - **Line 219:**
    ```tsx
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    ```
    Has `animate-spin` without `motion-reduce:animate-none`.
  - **Line 265:**
    ```tsx
    <div role="region" aria-label="بيانات تتبع الطلب" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    ```
    Has enter transition without `motion-reduce:animate-none`.
- **File:** `frontend/src/components/orders/OrderTrackingTimeline.tsx`
  - **Line 202:**
    ```tsx
    <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse">
      الآن
    </span>
    ```
    Has `animate-pulse` without `motion-reduce:animate-none`.

### Observation 1.5: Invalid Interactive Nesting (`<Button>` inside `<a>`)
- **File:** `frontend/src/components/orders/OrderTrackingCard.tsx`
  - **Lines 156–171:**
    ```tsx
    <a
      href={`https://wa.me/201012345678?text=${whatsappMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 min-w-[140px]"
    >
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer min-h-[40px]"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span>تواصل عبر واتساب</span>
      </Button>
    </a>
    ```
    An interactive `<Button>` (native `<button>`) is nested inside an `<a>` element.

### Observation 1.6: Straight Double Quotes in User Copy
- **File:** `frontend/src/components/orders/OrderTrackingCard.tsx`
  - **Line 137:**
    ```tsx
    <span className="text-foreground italic max-w-[65%] text-end">
      "{order.customerNotes}"
    </span>
    ```
    Straight ASCII quotes `"` enclose `{order.customerNotes}`.

### Observation 1.7: Decorative Icons Accessibility
- All 17 rendered icon instances across the 3 files (`ShieldCheck`, `Loader2`, `Search`, `Sparkles`, `AlertCircle`, `FileText`, `MapPin`, `MessageCircle`, `Printer`, `Package`, `CheckCircle2`, `Icon`) already explicitly declare `aria-hidden="true"`.

### Observation 1.8: RTL Layout & BiDi Direction
- Both pages and components properly initialize with `text-start`.
- `dir="ltr"` is correctly applied to phone numbers, order numbers, and timeline progression timestamps.
- The 4-step timeline stepper naturally mirrors in RTL across the 4-column grid.

---

## 2. Logic Chain

1. **Brand Name Isolation (Obs 1.1 -> Remediation 1):**
   Automated browser translation plugins (such as Google Translate) attempt to translate non-English terms unless flagged with `translate="no"`. Wrapping every instance of "VARELLION" in `<span translate="no">VARELLION</span>` guarantees brand preservation across all client environments.
2. **Accessible Keyboard Focus (Obs 1.2 -> Remediation 2):**
   WCAG 2.4.7 (Focus Visible) and WCAG 2.4.11 (Focus Appearance) require that keyboard-focused interactive elements provide a noticeable visual change. Adding standard Tailwind focus-ring utility classes (`rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) satisfies this requirement without disrupting existing default styles.
3. **Typography Standardization (Obs 1.3 & 1.6 -> Remediation 3 & 6):**
   Web Interface Guidelines require typographical punctuation over ASCII approximations. Replacing ASCII straight quotes `"{order.customerNotes}"` with curly quotes `“{order.customerNotes}”` (U+201C and U+201D) adheres to high-end typographic polish.
4. **Vestibular & Reduced Motion Accessibility (Obs 1.4 -> Remediation 4):**
   WCAG 2.3.3 (Animation from Interactions) and modern UI standards require that non-essential decorative animations can be disabled by users with motion sensitivities. Adding `motion-reduce:animate-none` ensures that when `prefers-reduced-motion: reduce` is enabled, spinners, pulses, and transitions freeze gracefully.
5. **DOM Hierarchy and Valid Interactive HTML (Obs 1.5 -> Remediation 5):**
   HTML5 Section 4.5.1 expressly prohibits nesting interactive content (`<button>`) inside an `<a>` element. This causes dual tab-stops, accessibility screen reader announcement collisions, and unpredictable event bubbling. Because `buttonVariants` is exported by `@/components/ui/Button`, removing `<Button>` and directly styling the `<a>` element with `buttonVariants({ variant: 'outline', size: 'sm' })` preserves identical visual styling and eliminates the invalid DOM nesting.

---

## 3. Caveats

- **Scope Boundary:** Investigation was strictly read-only and confined to `frontend/src/app/track-order/page.tsx`, `frontend/src/components/orders/OrderTrackingCard.tsx`, and `frontend/src/components/orders/OrderTrackingTimeline.tsx`.
- **Existing Test Coverage:** Two Vitest test suites (`OrderTrackingCard.test.tsx` and `OrderTrackingTimeline.test.tsx`) exist and test badge labels, test IDs, and timeline states. None of the proposed remediations alter `data-testid` attributes or key Arabic text asserted by tests.
- **WhatsApp Query String:** In `OrderTrackingCard.tsx` Line 35, the brand name "VARELLION" inside `encodeURIComponent` was intentionally left untouched because it is a URI query parameter string for WhatsApp API, not DOM text.

---

## 4. Conclusion & Precise Remediation Plan

The following concrete changes are recommended for implementation:

### Change 1: `frontend/src/app/track-order/page.tsx`
1. **Line 136 (Breadcrumb focus ring):**
   ```tsx
   // Before:
   <Link href="/" className="hover:text-foreground transition-colors">
   // After:
   <Link href="/" className="hover:text-foreground transition-colors rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
   ```
2. **Line 219 (Loader reduced motion):**
   ```tsx
   // Before:
   <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
   // After:
   <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
   ```
3. **Line 235 (Demo button focus ring):**
   ```tsx
   // Before:
   <button
     type="button"
     onClick={handleApplyDemoOrder}
     className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
   >
   // After:
   <button
     type="button"
     onClick={handleApplyDemoOrder}
     className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
   >
   ```
4. **Line 265 (Region enter animation reduced motion):**
   ```tsx
   // Before:
   <div role="region" aria-label="بيانات تتبع الطلب" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
   // After:
   <div role="region" aria-label="بيانات تتبع الطلب" className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
   ```

### Change 2: `frontend/src/components/orders/OrderTrackingCard.tsx`
1. **Lines 5 & 10 (Imports):**
   ```tsx
   // Remove unused Link import from line 5:
   // import Link from 'next/link'; (delete or omit)
   // Update Button import at line 10:
   import { Button, buttonVariants } from '@/components/ui/Button';
   ```
2. **Line 137 (Typographical curly quotes on notes):**
   ```tsx
   // Before:
   <span className="text-foreground italic max-w-[65%] text-end">
     "{order.customerNotes}"
   </span>
   // After:
   <span className="text-foreground italic max-w-[65%] text-end">
     “{order.customerNotes}”
   </span>
   ```
3. **Line 150 (Brand name translate="no"):**
   ```tsx
   // Before:
   <span>ضمان VARELLION الملكي وخدمة العملاء</span>
   // After:
   <span>ضمان <span translate="no">VARELLION</span> الملكي وخدمة العملاء</span>
   ```
4. **Lines 156–171 (Eliminate nested <Button> inside <a>):**
   ```tsx
   // Before:
   <a
     href={`https://wa.me/201012345678?text=${whatsappMessage}`}
     target="_blank"
     rel="noopener noreferrer"
     className="flex-1 min-w-[140px]"
   >
     <Button
       variant="outline"
       size="sm"
       className="w-full gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer min-h-[40px]"
     >
       <MessageCircle className="h-4 w-4" aria-hidden="true" />
       <span>تواصل عبر واتساب</span>
     </Button>
   </a>
   // After:
   <a
     href={`https://wa.me/201012345678?text=${whatsappMessage}`}
     target="_blank"
     rel="noopener noreferrer"
     className={cn(
       buttonVariants({ variant: 'outline', size: 'sm' }),
       'flex-1 min-w-[140px] gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 min-h-[40px] cursor-pointer'
     )}
   >
     <MessageCircle className="h-4 w-4" aria-hidden="true" />
     <span>تواصل عبر واتساب</span>
   </a>
   ```

### Change 3: `frontend/src/components/orders/OrderTrackingTimeline.tsx`
1. **Lines 16–21 & 33 (StepInfo & VARELLION translate="no"):**
   ```tsx
   // In StepInfo interface:
   interface StepInfo {
     id: string;
     label: string;
     description: React.ReactNode;
     icon: React.ElementType;
   }

   // In TRACKING_STEPS array:
   {
     id: 'preparing',
     label: 'التجهيز الملكي والفحص',
     description: (
       <>
         فحص جودة القطع وتغليفها في صندوق <span translate="no">VARELLION</span> الفاخر
       </>
     ),
     icon: Package,
   },
   ```
2. **Line 131 (VARELLION translate="no" in cancellation notice):**
   ```tsx
   // Before:
   <span>هذا الطلب تم إلغاؤه. للتواصل وإعادة التفعيل، يرجى محادثة خدمة عملاء VARELLION.</span>
   // After:
   <span>
     هذا الطلب تم إلغاؤه. للتواصل وإعادة التفعيل، يرجى محادثة خدمة عملاء{' '}
     <span translate="no">VARELLION</span>.
   </span>
   ```
3. **Line 202 (Pulsing badge reduced motion):**
   ```tsx
   // Before:
   <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse">
     الآن
   </span>
   // After:
   <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse motion-reduce:animate-none">
     الآن
   </span>
   ```

---

## 5. Verification Method

Once implemented, the changes can be independently verified via:
1. **Build Validation:**
   ```bash
   npm --prefix frontend run build
   ```
   Must pass with 0 errors, validating TypeScript types and JSX syntax.
2. **Test Suite Execution:**
   ```bash
   npm --prefix frontend test -- src/components/orders/
   ```
   Must pass all tests in `OrderTrackingCard.test.tsx` and `OrderTrackingTimeline.test.tsx`.
3. **DOM Inspection & Verification:**
   - Verify `translate="no"` exists on all rendered `VARELLION` brand spans.
   - Verify `<a href="...whatsapp...">` does not contain any `<button>` child element.
   - Verify curly quotes `“` and `”` enclose customer notes.
   - Verify keyboard tab navigation highlights breadcrumb link and demo button with visible ring.
   - Verify `motion-reduce:animate-none` is present on spinner, enter transition, and timeline active pulse.
