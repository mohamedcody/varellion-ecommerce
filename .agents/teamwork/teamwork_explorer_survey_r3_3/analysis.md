# Technical Analysis: Cross-Cutting & Verification Survey (Round 3)

## 1. Executive Summary
This report presents the cross-cutting investigation and architectural verification across the 8 customer profile and order tracking files specified in `ORIGINAL_REQUEST.md` (Follow-up 2026-11-12T13:59:53Z).

All 8 files exist, are functional, and have active test suites in Vitest. Specific accessibility, semantic markup, focus state, typography, interactive nesting, and hydration safety issues were confirmed with exact line numbers and concrete remediation plans that strictly comply with the boundary constraint: **Zero modifications outside the 8 specified files**.

---

## 2. Inventory and Import/Export Mapping of the 8 Target Files

| # | File Path | Type | Default Export | Named Exports | Line Count | Status |
|---|---|---|---|---|---|---|
| 1 | `frontend/src/app/profile/page.tsx` | Client (`'use client'`) | `ProfilePage` | None | 194 | Needs Remediation |
| 2 | `frontend/src/components/profile/PersonalInfoCard.tsx` | Client (`'use client'`) | None | `PersonalInfoCard` | 126 | Needs Remediation |
| 3 | `frontend/src/components/profile/DeliveryAddressCard.tsx` | Client (`'use client'`) | None | `DeliveryAddressCard` | 227 | Needs Remediation |
| 4 | `frontend/src/components/profile/DeleteAddressDialog.tsx` | Client (`'use client'`) | None | `DeleteAddressDialog` | 61 | Needs Remediation |
| 5 | `frontend/src/components/profile/OrderHistoryList.tsx` | Client (`'use client'`) | None | `OrderHistoryList` | 170 | Needs Remediation |
| 6 | `frontend/src/app/track-order/page.tsx` | Client (`'use client'`) | `TrackOrderPage` | None | 288 | Needs Remediation |
| 7 | `frontend/src/components/orders/OrderTrackingCard.tsx` | Client (`'use client'`) | None | `OrderTrackingCard` | 275 | Needs Remediation |
| 8 | `frontend/src/components/orders/OrderTrackingTimeline.tsx` | Client (`'use client'`) | None | `OrderTrackingTimeline` | 256 | Needs Remediation |

### Detailed Import & Export Dependencies

1. **`frontend/src/app/profile/page.tsx`**:
   - Imports:
     - `React, { useEffect, useState }` from `'react'`
     - `Link` from `'next/link'`
     - `Customer, CustomerAddress` from `@/types`
     - `customerService` from `@/services/customer`
     - `AuthGuard` from `@/components/auth/AuthGuard`
     - `PersonalInfoCard` from `@/components/profile/PersonalInfoCard`
     - `DeliveryAddressCard` from `@/components/profile/DeliveryAddressCard`
     - `DeleteAddressDialog` from `@/components/profile/DeleteAddressDialog`
     - `OrderHistoryList` from `@/components/profile/OrderHistoryList`
     - `useAuth` from `@/context/AuthContext`
     - `Package, ShoppingBag, ShieldCheck, AlertCircle` from `'lucide-react'`
   - Exports:
     - `default function ProfilePage()`

2. **`frontend/src/components/profile/PersonalInfoCard.tsx`**:
   - Imports:
     - `React, { useState, useEffect }` from `'react'`
     - `Customer` from `@/types`
     - `Input` from `@/components/ui/Input`
     - `Button` from `@/components/ui/Button`
     - `validateProfile` from `@/lib/validations/customer`
     - `ApiError` from `@/services/api`
     - `User, Phone, Mail, CheckCircle2` from `'lucide-react'`
   - Exports:
     - `export function PersonalInfoCard({ customer, onUpdate, isSaving }: PersonalInfoCardProps)`

3. **`frontend/src/components/profile/DeliveryAddressCard.tsx`**:
   - Imports:
     - `React, { useState, useEffect }` from `'react'`
     - `CustomerAddress` from `@/types`
     - `Button` from `@/components/ui/Button`
     - `Input` from `@/components/ui/Input`
     - `ShippingGovernorateSelect` from `@/components/checkout/ShippingGovernorateSelect`
     - `validateAddress` from `@/lib/validations/customer`
     - `ApiError` from `@/services/api`
     - `MapPin, Plus, Edit2, Trash2, CheckCircle2` from `'lucide-react'`
   - Exports:
     - `export function DeliveryAddressCard({ address, onSaveAddress, onDeleteRequest, isSaving }: DeliveryAddressCardProps)`

4. **`frontend/src/components/profile/DeleteAddressDialog.tsx`**:
   - Imports:
     - `React` from `'react'`
     - `Dialog` from `@/components/ui/Dialog`
     - `Button` from `@/components/ui/Button`
     - `Trash2, AlertTriangle` from `'lucide-react'`
   - Exports:
     - `export function DeleteAddressDialog({ isOpen, onClose, onConfirm, isDeleting }: DeleteAddressDialogProps)`

5. **`frontend/src/components/profile/OrderHistoryList.tsx`**:
   - Imports:
     - `React, { useEffect, useState }` from `'react'`
     - `Link` from `'next/link'`
     - `ordersService` from `@/services/orders`
     - `Order, OrderStatus` from `@/types`
     - `Card, CardHeader, CardTitle, CardContent` from `@/components/ui/Card`
     - `Badge` from `@/components/ui/Badge`
     - `Button` from `@/components/ui/Button`
     - `Package, Clock, ArrowLeft, ShoppingBag, Truck, CheckCircle2` from `'lucide-react'`
   - Exports:
     - `export function OrderHistoryList()`

6. **`frontend/src/app/track-order/page.tsx`**:
   - Imports:
     - `React, { useState, useEffect, Suspense }` from `'react'`
     - `useSearchParams` from `'next/navigation'`
     - `Link` from `'next/link'`
     - `ordersService` from `@/services/orders`
     - `Order` from `@/types`
     - `Input` from `@/components/ui/Input`
     - `Button` from `@/components/ui/Button`
     - `Card, CardHeader, CardTitle, CardContent` from `@/components/ui/Card`
     - `OrderTrackingCard` from `@/components/orders/OrderTrackingCard`
     - `Search, Package, Phone, ShieldCheck, AlertCircle, Loader2, Sparkles, ArrowRight, HelpCircle` from `'lucide-react'`
   - Exports:
     - `export default function TrackOrderPage()`

7. **`frontend/src/components/orders/OrderTrackingCard.tsx`**:
   - Imports:
     - `React` from `'react'`
     - `Image` from `'next/image'`
     - `Link` from `'next/link'`
     - `Order` from `@/types`
     - `cn` from `@/lib/utils`
     - `OrderTrackingTimeline` from `./OrderTrackingTimeline`
     - `Card, CardHeader, CardTitle, CardContent` from `@/components/ui/Card`
     - `Button` from `@/components/ui/Button`
     - `Package, MapPin, Phone, ShieldCheck, Printer, ShoppingBag, MessageCircle, FileText, BadgeCheck` from `'lucide-react'`
   - Exports:
     - `export function OrderTrackingCard({ order }: OrderTrackingCardProps)`

8. **`frontend/src/components/orders/OrderTrackingTimeline.tsx`**:
   - Imports:
     - `React` from `'react'`
     - `OrderStatus, OrderStatusHistory` from `@/types`
     - `CheckCircle2, Package, Truck, Home, AlertCircle, Clock, ShieldCheck` from `'lucide-react'`
     - `cn` from `@/lib/utils`
   - Exports:
     - `export function OrderTrackingTimeline({ status, createdAt, updatedAt, governorate, statusHistory }: OrderTrackingTimelineProps)`

---

## 3. UI Primitives Investigation & Nested Button Pattern Resolution

### A. The Interactive Nesting Challenge
In Next.js / HTML5, nesting a `<button>` inside an `<a>` or `<Link>` element produces invalid HTML (`HTMLButtonElement` inside `HTMLAnchorElement`), causing accessibility violations (screen readers encounter nested focusable interactive nodes) and unpredictable hydration/event-bubbling issues.

In the current codebase, this anti-pattern exists in:
1. `OrderHistoryList.tsx` line 104-109:
   ```tsx
   <Link href="/products">
     <Button variant="luxury" size="sm" className="gap-2 font-bold min-h-[40px]">
       <span>تصفح المنتجات الفاخرة</span>
       <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
     </Button>
   </Link>
   ```
2. `OrderHistoryList.tsx` line 157-162:
   ```tsx
   <Link href={trackUrl}>
     <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[38px]">
       <span>تتبع مسار الشحنة</span>
       <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
     </Button>
   </Link>
   ```
3. `OrderTrackingCard.tsx` line 156-170:
   ```tsx
   <a href={`https://wa.me/201012345678?text=${whatsappMessage}`} ...>
     <Button variant="outline" size="sm" ...>
       <MessageCircle className="h-4 w-4" aria-hidden="true" />
       <span>تواصل عبر واتساب</span>
     </Button>
   </a>
   ```

### B. Investigation of `Button.tsx`
Inspection of `frontend/src/components/ui/Button.tsx`:
- `Button` is implemented as a standard `React.forwardRef<HTMLButtonElement, ButtonProps>` returning `<button>`.
- **`asChild` (Radix UI Slot pattern) is NOT implemented.**
- Crucially, `Button.tsx` **exports `buttonVariants`** created with `class-variance-authority`:
  ```tsx
  const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
    { ... }
  );
  export { Button, buttonVariants };
  ```

### C. Resolution Strategy Respecting Scope Boundaries
Since `frontend/src/components/ui/Button.tsx` is **outside** the 8 permitted files, we **must NOT edit `Button.tsx`**.
Instead, in `OrderHistoryList.tsx` and `OrderTrackingCard.tsx`:
1. Import `buttonVariants` from `@/components/ui/Button`.
2. Apply `className={cn(buttonVariants({ variant: '...', size: '...' }), '...')}` directly to `<Link>` or `<a>`.
3. Eliminate the nested `<Button>` component entirely.

This yields:
- 100% compliant HTML (single interactive element).
- Identical visual appearance, hover states, transitions, and padding.
- Built-in `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- Zero modifications to files outside the 8 target files.

### D. Investigation of Other UI Primitives
- **`Card.tsx`**:
  - `CardTitle` renders `<h3>` (`React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>`).
  - In `OrderHistoryList.tsx`, line 99 contains `<h4 className="text-sm font-bold text-foreground">لا توجد طلبات سابقة مسجلة</h4>`. Changing this to `<h3>` eliminates heading level skipping.
- **`Input.tsx`**:
  - Supports `id`, `name`, `autoComplete`, `label`, `error`, `helperText`.
  - Computes `const inputId = id || generatedId`.
  - When `id` is passed, `<label htmlFor={inputId}>` and `<input id={inputId}>` are automatically and deterministically associated.
- **`Dialog.tsx`**:
  - Fully accessible dialog with focus trapping, ESC key listener, and `aria-modal="true"`.
  - Close button already possesses `focus-visible:ring-2 focus-visible:ring-ring`.

---

## 4. Build Configuration & Tooling Verification

### Package Versions & Environments
- **Framework**: Next.js `^15.2.1` (App Router)
- **React**: React `^19.0.0` and `react-dom: ^19.0.0`
- **TypeScript**: `^5.8.2` (Target: `ES2022`, ModuleResolution: `bundler`, Strict: `true`)
- **Styling**: Tailwind CSS `^4.0.9` with `@tailwindcss/postcss: ^4.0.9` and `postcss: ^8.5.3`
- **Class Merging**: `clsx: ^2.1.1`, `tailwind-merge: ^3.0.2`, `class-variance-authority: ^0.7.1`
- **Icons**: `lucide-react: ^1.16.0`
- **Testing**: `vitest: ^5.0.5`, `@testing-library/react: ^16.3.3`, `jsdom: ^30.1.3`

### Build & Test Commands
- Full build: `npm --prefix frontend run build` (invokes `next build`)
- Type check: `npm --prefix frontend run type-check` (invokes `tsc --noEmit`)
- Unit/Integration tests: `npm --prefix frontend test` (invokes `vitest run`)
- Linting: `npm --prefix frontend run lint` (invokes `next lint`)

---

## 5. Existing Tests & Verification Suite

Active test suites directly covering profile and order tracking:
1. `frontend/src/app/profile/__tests__/page.test.tsx`:
   - Verifies loading skeleton shimmer (`profile-skeleton`)
   - Verifies customer name and address rendering
   - Verifies profile update form submission
2. `frontend/src/app/track-order/__tests__/page.test.tsx`:
   - Verifies end-to-end DELIVERED status reflection, timeline stages
   - Verifies Egyptian phone normalization
   - Verifies field validation errors on empty submission
   - Verifies demo order filling and error banner clearing
3. `frontend/src/components/orders/__tests__/OrderTrackingCard.test.tsx`:
   - Verifies DELIVERED status badge (`order-status-badge`) and timeline synchronization
4. `frontend/src/components/orders/__tests__/OrderTrackingTimeline.test.tsx`:
   - Verifies 4-stage lifecycle (received, preparing, shipped, delivered)
   - Verifies `statusHistory` timestamp rendering
   - Verifies active state (`الآن`) and completed state (`مكتمل`)
   - Verifies resilience against missing or invalid `createdAt` dates

All proposed remediation changes are fully compatible with these existing tests. None of the tests assert invalid markup (such as expecting a `<button>` inside `<Link>`).

---

## 6. Date Hydration Safety Patterns in Next.js 15

### Cause of Hydration Mismatches
When `toLocaleDateString('ar-EG', ...)` runs during Node.js server prerendering, the server's ICU locale configuration and system timezone (e.g. UTC) can produce formatted dates differing from the client browser's local timezone (e.g. `Africa/Cairo` / UTC+2 or local OS locale). In Next.js 15 / React 19, this discrepancy causes hydration mismatch warnings or bailouts.

### Codebase Standard Pattern
Across this project, client-only initialization uses the `isMounted` state pattern (e.g. in `CartContext.tsx`):
```tsx
const [isMounted, setIsMounted] = useState(false);
useEffect(() => {
  setIsMounted(true);
}, []);
```

### Remediation for `OrderHistoryList.tsx`
In `OrderHistoryList.tsx`, line 142 currently executes `new Date(ord.createdAt).toLocaleDateString(...)`.
Although `OrderHistoryList` loads orders in `useEffect`, providing an explicit hydration guard ensures total safety across SSR, static optimization, and testing environments:
```tsx
const [isMounted, setIsMounted] = useState(false);
useEffect(() => {
  setIsMounted(true);
}, []);
```
And in JSX:
```tsx
<span suppressHydrationWarning>
  التاريخ:{' '}
  {isMounted
    ? new Date(ord.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''}
</span>
```
Combining `isMounted` with `suppressHydrationWarning` completely prevents any hydration error.

---

## 7. Precise File-by-File Remediation Matrix

### 1. `frontend/src/app/profile/page.tsx`
- **Line 96**:
  - Current: `حسابك في VARELLION`
  - Remediate: `حسابك في <span translate="no">VARELLION</span>`
- **Line 108-114**:
  - Current: `<Link href="/track-order" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card/60 hover:bg-card text-xs font-semibold text-foreground transition-colors shadow-sm">`
  - Remediate: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Line 112**: `<Package className="h-4 w-4 text-primary" />` -> Add `aria-hidden="true"`
- **Line 115-121**:
  - Current: `<Link href="/products" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-sm">`
  - Remediate: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Line 119**: `<ShoppingBag className="h-4 w-4" />` -> Add `aria-hidden="true"`
- **Line 126-131**:
  - Current: `<div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">`
  - Remediate: Add `role="alert"` and `aria-live="polite"`
- **Line 128**: `<AlertCircle className="h-4 w-4 shrink-0" />` -> Add `aria-hidden="true"`
- **Line 176**: `<ShieldCheck className="h-5 w-5 text-primary shrink-0" />` -> Add `aria-hidden="true"`

### 2. `frontend/src/components/profile/PersonalInfoCard.tsx`
- **Line 57**: `<User className="h-5 w-5" />` -> Add `aria-hidden="true"`
- **Line 65**:
  - Current: `<span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in">`
  - Remediate: Add `role="status"` and `aria-live="polite"`
- **Line 66**: `<CheckCircle2 className="h-4 w-4" />` -> Add `aria-hidden="true"`
- **Line 80**: `<Mail className="h-4 w-4 text-muted-foreground/70" />` -> Add `aria-hidden="true"`
- **Line 87-96**:
  - Current:
    ```tsx
    <Input
      label="الاسم بالكامل *"
      placeholder="محمد أحمد علي"
      ...
    />
    ```
  - Remediate: Add `id="fullName"`, `name="fullName"`, `autoComplete="name"`. Ensure trailing ellipsis uses `…` if ellipsis is added.
- **Line 100-111**:
  - Current:
    ```tsx
    <Input
      label="رقم الهاتف المحمول (مصر)"
      placeholder="01012345678"
      ...
    />
    ```
  - Remediate: Add `id="phoneNumber"`, `name="phoneNumber"`, `autoComplete="tel"`. Ensure placeholder ellipsis uses `…` if applicable.

### 3. `frontend/src/components/profile/DeliveryAddressCard.tsx`
- **Line 93**: `<MapPin className="h-5 w-5" />` -> Add `aria-hidden="true"`
- **Line 102**:
  - Current: `<span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in">`
  - Remediate: Add `role="status"` and `aria-live="polite"`
- **Line 103**: `<CheckCircle2 className="h-4 w-4" />` -> Add `aria-hidden="true"`
- **Line 123**: `<Edit2 className="h-3.5 w-3.5" />` -> Add `aria-hidden="true"`
- **Line 133**: `<Trash2 className="h-3.5 w-3.5" />` -> Add `aria-hidden="true"`
- **Line 155-164**:
  - Current:
    ```tsx
    <Input
      label="المنطقة أو الحي *"
      placeholder="مثال: سموحة / مدينة نصر / الدقي"
      ...
    />
    ```
  - Remediate: Add `id="cityArea"`, `name="cityArea"`, `autoComplete="address-level2"`. Ensure ellipsis uses `…`.
- **Line 167-179**:
  - Current:
    ```tsx
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      العنوان بالتفصيل *
    </label>
    <textarea
      rows={3}
      placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة بجوارك"
      ...
    />
    ```
  - Remediate: Add `htmlFor="detailedAddress"` to `<label>`. Add `id="detailedAddress"`, `name="detailedAddress"`, and `autoComplete="street-address"` to `<textarea>`. Ensure placeholder ellipsis uses `…`.
- **Line 207**: `<MapPin className="h-5 w-5" />` -> Add `aria-hidden="true"`
- **Line 219**: `<Plus className="h-4 w-4" />` -> Add `aria-hidden="true"`

### 4. `frontend/src/components/profile/DeleteAddressDialog.tsx`
- **Line 30**: `<AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />` -> Add `aria-hidden="true"`
- **Line 53**: `<Trash2 className="h-3.5 w-3.5" />` -> Add `aria-hidden="true"`

### 5. `frontend/src/components/profile/OrderHistoryList.tsx`
- **Line 99**:
  - Current: `<h4 className="text-sm font-bold text-foreground">لا توجد طلبات سابقة مسجلة</h4>`
  - Remediate: Replace with `<h3 className="text-sm font-bold text-foreground">لا توجد طلبات سابقة مسجلة</h3>` to prevent heading skip under `CardHeader`.
- **Line 104-109**:
  - Current: `<Link href="/products"><Button variant="luxury" size="sm" className="gap-2 font-bold min-h-[40px]"><span>تصفح المنتجات الفاخرة</span><ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /></Button></Link>`
  - Remediate:
    ```tsx
    <Link
      href="/products"
      className={cn(buttonVariants({ variant: 'luxury', size: 'sm' }), "gap-2 font-bold min-h-[40px]")}
    >
      <span>تصفح المنتجات الفاخرة</span>
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
    </Link>
    ```
- **Line 157-162**:
  - Current: `<Link href={trackUrl}><Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[38px]"><span>تتبع مسار الشحنة</span><ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /></Button></Link>`
  - Remediate:
    ```tsx
    <Link
      href={trackUrl}
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[38px]")}
    >
      <span>تتبع مسار الشحنة</span>
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
    </Link>
    ```
- **Line 142-146**:
  - Add `const [isMounted, setIsMounted] = useState(false); useEffect(() => { setIsMounted(true); }, []);`
  - Remediate date span with `suppressHydrationWarning` and `isMounted ? ... : ''`.

### 6. `frontend/src/app/track-order/page.tsx`
- **Line 136**:
  - Current: `<Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>`
  - Remediate: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs`.
- **Line 219**:
  - Current: `<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />`
  - Remediate: Add `motion-reduce:animate-none` -> `<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />`
- **Line 235-242**:
  - Current: `<button type="button" onClick={handleApplyDemoOrder} className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer">`
  - Remediate: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs`.
- **Placeholders**: Verify that any placeholder ending in ellipsis uses the single typographical character `…` (Unicode U+2026).

### 7. `frontend/src/components/orders/OrderTrackingCard.tsx`
- **Line 149**:
  - Current: `ضمان VARELLION الملكي وخدمة العملاء`
  - Remediate: `ضمان <span translate="no">VARELLION</span> الملكي وخدمة العملاء`
- **Line 137**:
  - Current: `"{order.customerNotes}"`
  - Remediate: `“{order.customerNotes}”` (replace straight quotes with typographical curly quotes `“` U+201C and `”` U+201D).
- **Line 156-170**:
  - Current:
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
  - Remediate:
    ```tsx
    <a
      href={`https://wa.me/201012345678?text=${whatsappMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        "flex-1 min-w-[140px] gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer min-h-[40px]"
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      <span>تواصل عبر واتساب</span>
    </a>
    ```

### 8. `frontend/src/components/orders/OrderTrackingTimeline.tsx`
- **Line 33**:
  - Current: `فحص جودة القطع وتغليفها في صندوق VARELLION الفاخر`
  - Remediate: `فحص جودة القطع وتغليفها في صندوق <span translate="no">VARELLION</span> الفاخر`
- **Line 131**:
  - Current: `هذا الطلب تم إلغاؤه. للتواصل وإعادة التفعيل، يرجى محادثة خدمة عملاء VARELLION.`
  - Remediate: `هذا الطلب تم إلغاؤه. للتواصل وإعادة التفعيل، يرجى محادثة خدمة عملاء <span translate="no">VARELLION</span>.`
- **Line 202**:
  - Current: `<span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse">الآن</span>`
  - Remediate: Add `motion-reduce:animate-none` -> `... animate-pulse motion-reduce:animate-none">`
