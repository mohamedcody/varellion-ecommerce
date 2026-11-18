# Dispatch

## 2026-11-12T14:04:38Z
Remediate the Web Interface Guidelines, accessibility (WCAG), and UX audit findings directly in production across customer profile and order tracking components on the VARELLION platform.

Working directory: /home/mohamed-saad/Desktop/BRAND
Integrity mode: development

## Requirements

### R1. Customer Profile Components Remediation
Remediate all Web Interface Guidelines and accessibility issues identified across customer profile pages and components (`frontend/src/app/profile/page.tsx`, `frontend/src/components/profile/PersonalInfoCard.tsx`, `frontend/src/components/profile/DeliveryAddressCard.tsx`, `frontend/src/components/profile/DeleteAddressDialog.tsx`, and `frontend/src/components/profile/OrderHistoryList.tsx`):
- Brand name "VARELLION" must include `translate="no"`.
- Interactive links and buttons must include visible focus indicators (`focus-visible:ring-*`).
- Decorative icons must have `aria-hidden="true"`.
- Error banner must have `role="alert"` and `aria-live="polite"`.
- Asynchronous success messages must have `role="status"` and `aria-live="polite"`.
- Form `<label>` elements must be programmatically associated with inputs via `htmlFor` matching input `id`.
- Form inputs must include appropriate `name` and standard `autoComplete` attributes (`fullName` with `name`, `phoneNumber` with `tel`, and `detailedAddress` with `street-address`).
- Input placeholder ellipsis must use the typographical ellipsis character `…`.
- Heading hierarchy in `OrderHistoryList.tsx` must be corrected so heading levels are not skipped (`<h3>` directly under `CardHeader`).
- Eliminate invalid interactive nesting by ensuring `<button>` elements are not nested inside `<Link>` or `<a>` elements.
- Guard date formatting (`toLocaleDateString`) against hydration mismatches using a mounted state or equivalent pattern.

### R2. Order Tracking Components Remediation
Remediate all Web Interface Guidelines and accessibility issues identified across order tracking pages and components (`frontend/src/app/track-order/page.tsx`, `frontend/src/components/orders/OrderTrackingCard.tsx`, and `frontend/src/components/orders/OrderTrackingTimeline.tsx`):
- Brand name "VARELLION" must include `translate="no"`.
- Breadcrumb links and buttons must include visible focus indicators (`focus-visible:ring-*`).
- Input placeholders ending in ellipsis must use typographical `…`.
- Loading and pulsing animations must respect user motion preferences by including `motion-reduce:animate-none`.
- Eliminate invalid interactive nesting by ensuring `<Button>` components are not nested inside `<a>` elements.
- Replace straight double quotes with typographical curly quotes (`“` `”`) in user-facing message copy.

### R3. Scope Boundary and UI Preservation
Strictly restrict changes to fixing the specified audit findings within the 8 identified files. Preserve all existing design styling, visual layout, and Arabic RTL rendering intact with zero regressions.

## Acceptance Criteria

### Customer Profile Remediation
- [ ] Brand name "VARELLION" in `frontend/src/app/profile/page.tsx` has `translate="no"`.
- [ ] Links and buttons in `frontend/src/app/profile/page.tsx` have `focus-visible:ring-*` styles.
- [ ] Decorative icons in `frontend/src/app/profile/page.tsx`, `PersonalInfoCard.tsx`, `DeliveryAddressCard.tsx`, and `DeleteAddressDialog.tsx` have `aria-hidden="true"`.
- [ ] The error banner in `frontend/src/app/profile/page.tsx` has `role="alert"` and `aria-live="polite"`.
- [ ] Async success texts in `PersonalInfoCard.tsx` and `DeliveryAddressCard.tsx` have `role="status"` and `aria-live="polite"`.
- [ ] Form labels in `PersonalInfoCard.tsx` and `DeliveryAddressCard.tsx` are associated with their target inputs via `htmlFor` and `id`.
- [ ] Inputs in `PersonalInfoCard.tsx` have `name="fullName"` with `autoComplete="name"`, and `name="phoneNumber"` with `autoComplete="tel"`.
- [ ] Textarea in `DeliveryAddressCard.tsx` has `id`, `name="detailedAddress"`, and `autoComplete="street-address"`.
- [ ] Trailing ellipses in placeholders across `PersonalInfoCard.tsx`, `DeliveryAddressCard.tsx`, and `track-order/page.tsx` use `…`.
- [ ] Heading hierarchy in `OrderHistoryList.tsx` has `<h3>` instead of `<h4>` under `CardHeader`.
- [ ] No buttons or button components are nested inside `<Link>` or `<a>` tags in `OrderHistoryList.tsx` or `OrderTrackingCard.tsx`.
- [ ] `toLocaleDateString` in `OrderHistoryList.tsx` is guarded against hydration mismatch.

### Order Tracking Remediation
- [ ] Brand name "VARELLION" in `OrderTrackingCard.tsx` and `OrderTrackingTimeline.tsx` has `translate="no"`.
- [ ] Breadcrumb link and button in `frontend/src/app/track-order/page.tsx` have `focus-visible:ring-*`.
- [ ] Animations in `frontend/src/app/track-order/page.tsx` and `OrderTrackingTimeline.tsx` include `motion-reduce:animate-none`.
- [ ] Straight quotes around order tracking copy in `OrderTrackingCard.tsx` are replaced with curly quotes `“` and `”`.

### Verification & Quality Gates
- [ ] `npm --prefix frontend run build` completes with 0 errors.
- [ ] No files outside the 8 specified components are modified.
- [ ] Arabic RTL layout and styling remain visually intact.
