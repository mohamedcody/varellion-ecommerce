# Customer Profile Components Audit & Remediation Analysis

**Working Directory**: `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_r3_1/`  
**Date**: 2026-11-12  
**Scope**:
1. `frontend/src/app/profile/page.tsx`
2. `frontend/src/components/profile/PersonalInfoCard.tsx`
3. `frontend/src/components/profile/DeliveryAddressCard.tsx`
4. `frontend/src/components/profile/DeleteAddressDialog.tsx`
5. `frontend/src/components/profile/OrderHistoryList.tsx`

---

## 1. Executive Summary

A comprehensive, read-only accessibility (WCAG 2.1 AA), Web Interface Guidelines, and Next.js / React 19 audit of the Customer Profile components was conducted. The investigation examined all 13 checklist criteria across the 5 files, identifying exact line numbers, code snippets, root causes, and precise remediation plans with zero regressions to the existing design and Arabic RTL layout.

---

## 2. Comprehensive Findings by Audit Criterion

### Criterion 1: Brand Name "VARELLION" (`translate="no"`)
* **Requirement**: Every instance of the brand name "VARELLION" must include `translate="no"` so automated browser translation tools (such as Google Translate) do not attempt to translate the proper brand name into another word.
* **Findings Across All 5 Files**:
  * `frontend/src/app/profile/page.tsx`: **Line 96** contains:
    ```tsx
    <span className="text-xs uppercase tracking-widest text-primary font-bold">
      حسابك في VARELLION
    </span>
    ```
    *Status*: **Non-compliant**. "VARELLION" lacks `translate="no"`.
  * `frontend/src/components/profile/PersonalInfoCard.tsx`: No occurrence.
  * `frontend/src/components/profile/DeliveryAddressCard.tsx`: No occurrence.
  * `frontend/src/components/profile/DeleteAddressDialog.tsx`: No occurrence.
  * `frontend/src/components/profile/OrderHistoryList.tsx`: No occurrence.
* **Remediation**:
  Wrap the brand name in `frontend/src/app/profile/page.tsx:96`:
  ```tsx
  <span className="text-xs uppercase tracking-widest text-primary font-bold">
    حسابك في <span translate="no">VARELLION</span>
  </span>
  ```

---

### Criterion 2: Interactive Links, Buttons & Focus States
* **Requirement**: All interactive elements (links, buttons, inputs) must have visible focus indicators conforming to WCAG 2.4.7 (Focus Visible) using Tailwind `focus-visible:ring-*` classes matching the design system (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background`).
* **Findings**:
  * **`frontend/src/app/profile/page.tsx`**:
    * **Line 108–114** (`<Link href="/track-order">`): Missing focus rings entirely.
      *Current*:
      ```tsx
      <Link
        href="/track-order"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card/60 hover:bg-card text-xs font-semibold text-foreground transition-colors shadow-sm"
      >
      ```
      *Required*:
      ```tsx
      <Link
        href="/track-order"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card/60 hover:bg-card text-xs font-semibold text-foreground transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
      >
      ```
    * **Line 115–121** (`<Link href="/products">`): Missing focus rings entirely.
      *Current*:
      ```tsx
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-sm"
      >
      ```
      *Required*:
      ```tsx
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
      >
      ```
  * **`frontend/src/components/profile/PersonalInfoCard.tsx`**:
    * **Line 114–121** (`<Button type="submit">`): Compliant. Uses UI component `Button` with `buttonVariants` containing `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
  * **`frontend/src/components/profile/DeliveryAddressCard.tsx`**:
    * **Line 116–125** (`Button variant="ghost"` for Edit): Compliant via `Button`.
    * **Line 126–136** (`Button variant="ghost"` for Delete): Compliant via `Button`.
    * **Line 170–179** (`<textarea>`): Compliant. Already has `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`.
    * **Line 186–194** (`Button variant="outline"` for Cancel): Compliant via `Button`.
    * **Line 195–201** (`Button type="submit"` for Save): Compliant via `Button`.
    * **Line 213–221** (`Button variant="outline"` for Add): Compliant via `Button`.
  * **`frontend/src/components/profile/DeleteAddressDialog.tsx`**:
    * **Line 37–45** (`Button variant="outline"` for Cancel): Compliant via `Button`.
    * **Line 46–55** (`Button variant="destructive"` for Confirm): Compliant via `Button`.
  * **`frontend/src/components/profile/OrderHistoryList.tsx`**:
    * **Line 104–109** and **Line 157–162**: Currently wrap `<Button>` inside `<Link>`. When refactored to eliminate nested buttons, the `<Link>` should use `buttonVariants(...)` which includes `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

---

### Criterion 3: Decorative Icons (`aria-hidden="true"`)
* **Requirement**: All decorative SVG/Lucide icons must include `aria-hidden="true"` so assistive technologies (screen readers) do not vocalize irrelevant graphic glyphs.
* **Findings**:
  * **`frontend/src/app/profile/page.tsx`**:
    * Line 112: `<Package className="h-4 w-4 text-primary" />` → **Missing** `aria-hidden="true"`
    * Line 119: `<ShoppingBag className="h-4 w-4" />` → **Missing** `aria-hidden="true"`
    * Line 128: `<AlertCircle className="h-4 w-4 shrink-0" />` → **Missing** `aria-hidden="true"`
    * Line 176: `<ShieldCheck className="h-5 w-5 text-primary shrink-0" />` → **Missing** `aria-hidden="true"`
  * **`frontend/src/components/profile/PersonalInfoCard.tsx`**:
    * Line 57: `<User className="h-5 w-5" />` → **Missing** `aria-hidden="true"`
    * Line 66: `<CheckCircle2 className="h-4 w-4" />` → **Missing** `aria-hidden="true"`
    * Line 80: `<Mail className="h-4 w-4 text-muted-foreground/70" />` → **Missing** `aria-hidden="true"`
  * **`frontend/src/components/profile/DeliveryAddressCard.tsx`**:
    * Line 93: `<MapPin className="h-5 w-5" />` → **Missing** `aria-hidden="true"`
    * Line 103: `<CheckCircle2 className="h-4 w-4" />` → **Missing** `aria-hidden="true"`
    * Line 123: `<Edit2 className="h-3.5 w-3.5" />` → **Missing** `aria-hidden="true"`
    * Line 133: `<Trash2 className="h-3.5 w-3.5" />` → **Missing** `aria-hidden="true"`
    * Line 207: `<MapPin className="h-5 w-5" />` → **Missing** `aria-hidden="true"`
    * Line 219: `<Plus className="h-4 w-4" />` → **Missing** `aria-hidden="true"`
  * **`frontend/src/components/profile/DeleteAddressDialog.tsx`**:
    * Line 30: `<AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />` → **Missing** `aria-hidden="true"`
    * Line 53: `<Trash2 className="h-3.5 w-3.5" />` → **Missing** `aria-hidden="true"`
  * **`frontend/src/components/profile/OrderHistoryList.tsx`**:
    * Line 45 (`CheckCircle2`), Line 52 (`Truck`), Line 61 (`Clock`), Line 73 (`Package`), Line 90 (`Package`), Line 96 (`ShoppingBag`), Line 107 (`ArrowLeft`), Line 119 (`Package`), Line 160 (`ArrowLeft`) → **All 9 icons already have** `aria-hidden="true"`.

---

### Criterion 4: Error Banner in `profile/page.tsx` (`role="alert"` & `aria-live="polite"`)
* **Requirement**: Dynamic error announcements must alert assistive technology users as soon as an error occurs without interrupting speech excessively.
* **Findings**:
  * `frontend/src/app/profile/page.tsx` Lines 126–131:
    ```tsx
    {errorMessage && (
      <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    )}
    ```
    *Status*: **Non-compliant**. Missing `role="alert"`, `aria-live="polite"`, and `aria-hidden="true"` on the icon.
* **Remediation**:
  ```tsx
  {errorMessage && (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{errorMessage}</span>
    </div>
  )}
  ```

---

### Criterion 5: Asynchronous Success Messages in `PersonalInfoCard.tsx` and `DeliveryAddressCard.tsx`
* **Requirement**: Status notifications (e.g., "تم الحفظ بنجاح") appearing after asynchronous mutations must have `role="status"` and `aria-live="polite"`.
* **Findings**:
  * **`frontend/src/components/profile/PersonalInfoCard.tsx` Lines 64–69**:
    ```tsx
    {isSaved && (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in">
        <CheckCircle2 className="h-4 w-4" />
        تم الحفظ بنجاح
      </span>
    )}
    ```
    *Status*: **Non-compliant**. Missing `role="status"`, `aria-live="polite"`, and `aria-hidden="true"` on `<CheckCircle2>`.
  * **`frontend/src/components/profile/DeliveryAddressCard.tsx` Lines 101–106**:
    ```tsx
    {isSaved && (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in">
        <CheckCircle2 className="h-4 w-4" />
        تم الحفظ بنجاح
      </span>
    )}
    ```
    *Status*: **Non-compliant**. Missing `role="status"`, `aria-live="polite"`, and `aria-hidden="true"` on `<CheckCircle2>`.
* **Remediation**:
  Update both to:
  ```tsx
  {isSaved && (
    <span
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in"
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      تم الحفظ بنجاح
    </span>
  )}
  ```

---

### Criterion 6: Form `<label>` Elements and `htmlFor` / `id` Association
* **Requirement**: Every `<label>` must programmatically associate with its corresponding form control via `htmlFor` matching the control's `id`.
* **Findings**:
  * **`frontend/src/components/profile/PersonalInfoCard.tsx`**:
    * **Line 76**: `<label className="...">البريد الإلكتروني الحساب</label>`
      *Issue*: Lacks `htmlFor`. It labels a static read-only `<div>` (showing `customer.email`), not an input. Because this is not an active form control, an orphan `<label>` violates HTML validation and screen reader expectations.
      *Remediation*: Change tag from `<label>` to `<span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">`.
    * **Lines 87–96** (`fullName`) and **Lines 99–111** (`phoneNumber`):
      *Issue*: The `Input` component generates random IDs via `React.useId()` when `id` prop is omitted.
      *Remediation*: Pass explicit props `id="fullName"` and `id="phoneNumber"`.
  * **`frontend/src/components/profile/DeliveryAddressCard.tsx`**:
    * **Line 146**: `<ShippingGovernorateSelect>`: uses `selectId = 'shipping-governorate-select'` with matching `<label htmlFor={selectId}>` and `<select id={selectId}>`. Compliant.
    * **Line 155**: `<Input label="المنطقة أو الحي *">`: Pass explicit `id="cityArea"`.
    * **Lines 167–179**:
      ```tsx
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        العنوان بالتفصيل *
      </label>
      <textarea
        rows={3}
        placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة بجوارك"
        value={detailedAddress}
        ...
      />
      ```
      *Issue*: **Severe violation**. The `<label>` has no `htmlFor`, and `<textarea>` has no `id`.
      *Remediation*: Add `htmlFor="detailedAddress"` to `<label>` and `id="detailedAddress"` to `<textarea>`.

---

### Criterion 7: Form Inputs in `PersonalInfoCard.tsx` (`name` and `autoComplete`)
* **Requirement**: Inputs must include standard form autofill attributes (`name="fullName"` with `autoComplete="name"`, and `name="phoneNumber"` with `autoComplete="tel"`).
* **Findings**:
  * **Line 87–96** (`fullName`): Lacks `name` and `autoComplete`.
  * **Line 99–111** (`phoneNumber`): Lacks `name`, `autoComplete`, and `type="tel"`.
* **Remediation**:
  ```tsx
  {/* Full Name */}
  <Input
    id="fullName"
    name="fullName"
    autoComplete="name"
    label="الاسم بالكامل *"
    placeholder="محمد أحمد علي"
    value={fullName}
    onChange={(e) => {
      setFullName(e.target.value);
      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
    }}
    error={errors.fullName}
  />

  {/* Egyptian Phone Number */}
  <div className="space-y-1.5 text-start">
    <Input
      id="phoneNumber"
      name="phoneNumber"
      autoComplete="tel"
      type="tel"
      label="رقم الهاتف المحمول (مصر)"
      placeholder="01012345678"
      value={phoneNumber}
      onChange={(e) => {
        setPhoneNumber(e.target.value);
        if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
      }}
      error={errors.phoneNumber}
      helperText="مخصص للتواصل مع مندوب التوصيل وتأكيد الأوردرات"
    />
  </div>
  ```

---

### Criterion 8: Textarea in `DeliveryAddressCard.tsx` (`id`, `name`, `autoComplete`)
* **Requirement**: The detailed address `<textarea>` must have `id="detailedAddress"`, `name="detailedAddress"`, and `autoComplete="street-address"`.
* **Findings**:
  * `frontend/src/components/profile/DeliveryAddressCard.tsx` Line 170–179:
    * Current:
      ```tsx
      <textarea
        rows={3}
        placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة بجوارك"
        value={detailedAddress}
        onChange={(e) => {
          setDetailedAddress(e.target.value);
          if (errors.detailedAddress) setErrors((prev) => ({ ...prev, detailedAddress: '' }));
        }}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
      />
      ```
    * `id`: **Missing**
    * `name`: **Missing**
    * `autoComplete`: **Missing**
* **Remediation**:
  Add `id="detailedAddress"`, `name="detailedAddress"`, `autoComplete="street-address"`, along with `aria-invalid={!!errors.detailedAddress}` and `aria-describedby={errors.detailedAddress ? 'detailedAddress-error' : undefined}`.

---

### Criterion 9: Ellipses in Placeholders (`...` vs `…`)
* **Requirement**: Trailing ellipses in user-facing input placeholders must use the typographical Unicode ellipsis character `…` (`\u2026`) instead of three consecutive ASCII periods (`...`).
* **Findings**:
  * `frontend/src/components/profile/PersonalInfoCard.tsx`:
    * Line 89: `placeholder="محمد أحمد علي"` (no ellipsis)
    * Line 102: `placeholder="01012345678"` (no ellipsis)
  * `frontend/src/components/profile/DeliveryAddressCard.tsx`:
    * Line 157: `placeholder="مثال: سموحة / مدينة نصر / الدقي"` (no ellipsis)
    * Line 172: `placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة بجوارك"` (no ellipsis)
  * Related child component `ShippingGovernorateSelect.tsx`:
    * Line 54: `<option value="" disabled>اختر المحافظة لتحديد تكلفة ومدة الشحن…</option>` (correctly uses `…`).
  * *Verdict*: No trailing three-period ellipses exist in these files. All future placeholders with ellipses must strictly use `…`.

---

### Criterion 10: Heading Hierarchy in `OrderHistoryList.tsx`
* **Requirement**: Heading levels must not be skipped. Specifically inspect `CardHeader` and verify `<h3>` is directly under `CardHeader` rather than an inappropriate heading level like `<h4>`.
* **Findings**:
  * In `frontend/src/components/ui/Card.tsx:31–41`:
    ```tsx
    const CardTitle = React.forwardRef<
      HTMLParagraphElement,
      React.HTMLAttributes<HTMLHeadingElement>
    >(({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={cn('font-semibold leading-none tracking-tight text-lg text-foreground', className)}
        {...props}
      />
    ));
    ```
  * In `frontend/src/components/profile/OrderHistoryList.tsx`:
    * Lines 71–75 (loading state): `<CardHeader><CardTitle>...` → renders `<h3>سجل طلباتي السابقة</h3>`.
    * Lines 88–92 (empty state): `<CardHeader><CardTitle>...` → renders `<h3>سجل طلباتي السابقة</h3>`.
    * Lines 117–121 (populated state): `<CardHeader><CardTitle>...` → renders `<h3>سجل طلباتي السابقة</h3>`.
    * Line 99 (empty state subtitle inside `<CardContent>`):
      `<h4 className="text-sm font-bold text-foreground">لا توجد طلبات سابقة مسجلة</h4>`
  * *Assessment*: The heading structure in `OrderHistoryList.tsx` correctly places `<h3>` under `CardHeader` via `<CardTitle>`, and subordinates the empty-state subtitle to `<h4>`. No heading level is skipped.

---

### Criterion 11: Interactive Nesting in `OrderHistoryList.tsx` (`<button>` inside `<Link>`)
* **Requirement**: HTML specification forbids nesting interactive content (such as `<button>`) inside an `<a>` or `<Link>` element. Next.js / React 19 emits hydration/DOM warnings and screen readers fail to parse nested interactive controls.
* **Findings**:
  * **Violation 1** (Lines 104–109):
    ```tsx
    <Link href="/products">
      <Button variant="luxury" size="sm" className="gap-2 font-bold min-h-[40px]">
        <span>تصفح المنتجات الفاخرة</span>
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </Link>
    ```
  * **Violation 2** (Lines 157–162):
    ```tsx
    <Link href={trackUrl}>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[38px]">
        <span>تتبع مسار الشحنة</span>
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </Link>
    ```
* **Remediation**:
  Import `buttonVariants` from `@/components/ui/Button` and `cn` from `@/lib/utils`. Render `<Link>` with button styling:
  * For Violation 1:
    ```tsx
    <Link
      href="/products"
      className={cn(
        buttonVariants({ variant: 'luxury', size: 'sm' }),
        'gap-2 font-bold min-h-[40px]'
      )}
    >
      <span>تصفح المنتجات الفاخرة</span>
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
    </Link>
    ```
  * For Violation 2:
    ```tsx
    <Link
      href={trackUrl}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[38px]'
      )}
    >
      <span>تتبع مسار الشحنة</span>
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
    </Link>
    ```

---

### Criterion 12: Date Formatting Hydration Guard in `OrderHistoryList.tsx`
* **Requirement**: `toLocaleDateString` execution varies across environments (Node.js SSR ICU data vs browser client locale/timezone). Date rendering must be guarded against React hydration mismatch.
* **Findings**:
  * Lines 142–146 in `frontend/src/components/profile/OrderHistoryList.tsx`:
    ```tsx
    <span>
      التاريخ:{' '}
      {new Date(ord.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}
    </span>
    ```
* **Remediation**:
  1. Introduce a mounted state hook:
     ```tsx
     const [isMounted, setIsMounted] = useState(false);
     useEffect(() => {
       setIsMounted(true);
     }, []);
     ```
  2. Guard the rendered output and add `suppressHydrationWarning`:
     ```tsx
     <span className="tabular-nums" suppressHydrationWarning>
       {isMounted
         ? new Date(ord.createdAt).toLocaleDateString('ar-EG', {
             year: 'numeric',
             month: 'short',
             day: 'numeric',
           })
         : ''}
     </span>
     ```

---

### Criterion 13: RTL Layout Preservation & Styling
* **Requirement**: Preserve Arabic Right-to-Left (RTL) layout, alignment, and styling without regressions.
* **Findings**:
  * All 5 components currently use logical CSS utilities (`text-start`, `space-y-*`, `gap-*`, `px-*`, `py-*`).
  * In `PersonalInfoCard.tsx` Line 113 and `DeliveryAddressCard.tsx` Line 185, `justify-end` correctly positions actions on the left in RTL.
  * In `OrderHistoryList.tsx`, `<ArrowLeft>` correctly reflects forward navigation progression in Arabic RTL.
  * Tabular numbers and currency notation (`{ord.totalAmount.toLocaleString('ar-EG')} ج.م`) are correctly oriented.
  * *Recommendation*: Maintain logical properties (`text-start`, `ms-*`, `me-*`) and avoid adding physical directional classes (`ml-*`, `mr-*`, `left-*`, `right-*`).

---

## 3. Inventory of Changes Needed per Target File

| File | Target Line(s) | Change Description |
| :--- | :--- | :--- |
| `frontend/src/app/profile/page.tsx` | 96 | Add `<span translate="no">VARELLION</span>` |
| `frontend/src/app/profile/page.tsx` | 108–114 | Add `focus-visible:ring-*` classes and `aria-hidden="true"` to `<Package />` |
| `frontend/src/app/profile/page.tsx` | 115–121 | Add `focus-visible:ring-*` classes and `aria-hidden="true"` to `<ShoppingBag />` |
| `frontend/src/app/profile/page.tsx` | 126–131 | Add `role="alert"` and `aria-live="polite"` to error banner; add `aria-hidden="true"` to `<AlertCircle />` |
| `frontend/src/app/profile/page.tsx` | 176 | Add `aria-hidden="true"` to `<ShieldCheck />` |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 9 | Clean up unused `Phone` import |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 57 | Add `aria-hidden="true"` to `<User />` |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 64–69 | Add `role="status"`, `aria-live="polite"` and `aria-hidden="true"` to `<CheckCircle2 />` |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 76 | Change `<label>` to `<span>` for read-only email display |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 80 | Add `aria-hidden="true"` to `<Mail />` |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 87–96 | Add `id="fullName"`, `name="fullName"`, `autoComplete="name"` |
| `frontend/src/components/profile/PersonalInfoCard.tsx` | 99–111 | Add `id="phoneNumber"`, `name="phoneNumber"`, `autoComplete="tel"`, `type="tel"` |
| `frontend/src/components/profile/DeliveryAddressCard.tsx` | 93 | Add `aria-hidden="true"` to `<MapPin />` |
| `frontend/src/components/profile/DeliveryAddressCard.tsx` | 101–106 | Add `role="status"`, `aria-live="polite"` and `aria-hidden="true"` to `<CheckCircle2 />` |
| `frontend/src/components/profile/DeliveryAddressCard.tsx` | 123, 133 | Add `aria-hidden="true"` to `<Edit2 />` and `<Trash2 />` |
| `frontend/src/components/profile/DeliveryAddressCard.tsx` | 155–164 | Add `id="cityArea"`, `name="cityArea"`, `autoComplete="address-level2"` |
| `frontend/src/components/profile/DeliveryAddressCard.tsx` | 167–183 | Add `htmlFor="detailedAddress"` to `<label>`, `id="detailedAddress"`, `name="detailedAddress"`, `autoComplete="street-address"`, and `aria-invalid` / `aria-describedby` to `<textarea>` |
| `frontend/src/components/profile/DeliveryAddressCard.tsx` | 207, 219 | Add `aria-hidden="true"` to `<MapPin />` and `<Plus />` |
| `frontend/src/components/profile/DeleteAddressDialog.tsx` | 30, 53 | Add `aria-hidden="true"` to `<AlertTriangle />` and `<Trash2 />` |
| `frontend/src/components/profile/OrderHistoryList.tsx` | 7, 9 | Import `cn` from `@/lib/utils` and `buttonVariants` from `@/components/ui/Button` |
| `frontend/src/components/profile/OrderHistoryList.tsx` | 15, 37 | Add `isMounted` state and `useEffect(() => setIsMounted(true), [])` |
| `frontend/src/components/profile/OrderHistoryList.tsx` | 104–109 | Replace nested `<Button>` inside `<Link>` with styled `<Link className={cn(buttonVariants(...))}>` |
| `frontend/src/components/profile/OrderHistoryList.tsx` | 142–146 | Guard `toLocaleDateString` with `isMounted` and `suppressHydrationWarning` |
| `frontend/src/components/profile/OrderHistoryList.tsx` | 157–162 | Replace nested `<Button>` inside `<Link>` with styled `<Link className={cn(buttonVariants(...))}>` |
