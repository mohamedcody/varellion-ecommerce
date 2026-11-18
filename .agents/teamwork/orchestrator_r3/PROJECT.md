# Project: VARELLION Customer Profile & Order Tracking Remediation

## Architecture
- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4.
- Target Pages:
  - Customer Profile: `frontend/src/app/profile/page.tsx`
  - Order Tracking: `frontend/src/app/track-order/page.tsx`
- Target Components:
  - Profile: `PersonalInfoCard.tsx`, `DeliveryAddressCard.tsx`, `DeleteAddressDialog.tsx`, `OrderHistoryList.tsx`
  - Orders: `OrderTrackingCard.tsx`, `OrderTrackingTimeline.tsx`
- Shared Primitives:
  - `Button.tsx` (exports `Button` and `buttonVariants` via CVA)
  - `Input.tsx` (generates or adopts `id` and associates `<label htmlFor={id}>`)
  - `Card.tsx` (`CardTitle` renders `<h3>`)
- Boundaries:
  - Strictly limited to the 8 identified target files.
  - Zero modifications to files outside the 8 target files.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Brand Name Protection (Profile) | Add `translate="no"` to "VARELLION" brand name in `profile/page.tsx:96` | M1 | survey_1 |
| 2 | Visible Keyboard Focus (Profile) | Add `focus-visible:ring-*` focus ring styles to interactive links in `profile/page.tsx:108,115` | M1 | survey_1 |
| 3 | Decorative Icons A11y (Profile) | Add `aria-hidden="true"` to 16 decorative icons in `page.tsx`, `PersonalInfoCard.tsx`, `DeliveryAddressCard.tsx`, `DeleteAddressDialog.tsx` | M1 | survey_1 |
| 4 | Error Banner A11y (Profile) | Add `role="alert"` and `aria-live="polite"` to error banner in `profile/page.tsx:127` | M1 | survey_1 |
| 5 | Async Success Messages (Profile) | Add `role="status"` and `aria-live="polite"` to async success banners in `PersonalInfoCard.tsx:65` and `DeliveryAddressCard.tsx:102` | M1 | survey_1 |
| 6 | Form Labels & Autocomplete (Profile) | Explicit `id`, `name="fullName"`, `autoComplete="name"`, `name="phoneNumber"`, `autoComplete="tel"` in `PersonalInfoCard.tsx` | M1 | survey_1 |
| 7 | Textarea Labels & Autocomplete (Profile) | `<label htmlFor="detailedAddress">` and `<textarea id="detailedAddress" name="detailedAddress" autoComplete="street-address">` in `DeliveryAddressCard.tsx` | M1 | survey_1 |
| 8 | Heading Hierarchy (Profile) | Fix heading level in `OrderHistoryList.tsx` empty state (`<h3>` instead of `<h4>` under `CardHeader`) | M1 | survey_1 |
| 9 | Interactive Nesting (Profile) | Eliminate `<Button>` inside `<Link>` in `OrderHistoryList.tsx:104,157` using `Link` styled via `buttonVariants` | M1 | survey_1 |
| 10 | Date Hydration Safety (Profile) | Guard `toLocaleDateString` in `OrderHistoryList.tsx:142` against SSR hydration mismatch via `isMounted` state and `suppressHydrationWarning` | M1 | survey_1 |
| 11 | Brand Name Protection (Order Tracking) | Add `translate="no"` to "VARELLION" in `OrderTrackingCard.tsx:150` and `OrderTrackingTimeline.tsx:33,131` | M1 | survey_2 |
| 12 | Visible Keyboard Focus (Order Tracking) | Add `focus-visible:ring-*` to breadcrumb `<Link>` and demo `<button>` in `track-order/page.tsx:136,235` | M1 | survey_2 |
| 13 | Reduced Motion Safeguards (Order Tracking) | Add `motion-reduce:animate-none` to `animate-spin` and `animate-pulse` animations in `track-order/page.tsx:219,265` and `OrderTrackingTimeline.tsx:202` | M1 | survey_2 |
| 14 | Interactive Nesting (Order Tracking) | Eliminate `<Button>` inside `<a>` in `OrderTrackingCard.tsx:156` by styling `<a>` with `buttonVariants` | M1 | survey_2 |
| 15 | Typographical Curly Quotes (Order Tracking) | Replace straight double quotes with curly quotes `“` and `”` around customer notes in `OrderTrackingCard.tsx:137` | M1 | survey_2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Full Remediation & Verification | Remediate all 15 audit findings across all 8 files, verify build and test passes with zero regressions | none | IN_PROGRESS |

## Interface Contracts
### Button & Link Styling Contract
- When converting nested `<Button>` inside `<Link>` or `<a>` to a single interactive tag:
  - Import `buttonVariants` from `@/components/ui/Button`
  - Style `<Link>` or `<a>` with `cn(buttonVariants({ variant, size }), customClasses)`
  - Retain all child text, icons (with `aria-hidden="true"`), and `href`
  - Do NOT wrap `<Button>` inside `<Link>` or `<a>`

### Form Input & Label Contract
- In `PersonalInfoCard.tsx`:
  - Pass `id="fullName"`, `name="fullName"`, `autoComplete="name"`
  - Pass `id="phoneNumber"`, `name="phoneNumber"`, `autoComplete="tel"`, `type="tel"`
- In `DeliveryAddressCard.tsx`:
  - `<label htmlFor="detailedAddress">`
  - `<textarea id="detailedAddress" name="detailedAddress" autoComplete="street-address">`

### Hydration Contract
- In `OrderHistoryList.tsx`:
  - Add `const [isMounted, setIsMounted] = useState(false);`
  - Add `useEffect(() => { setIsMounted(true); }, []);`
  - In JSX: `suppressHydrationWarning` and fallback rendering when not mounted.

## Code Layout
- `frontend/src/app/profile/page.tsx` (Customer Profile Page)
- `frontend/src/components/profile/PersonalInfoCard.tsx` (Personal Info Card)
- `frontend/src/components/profile/DeliveryAddressCard.tsx` (Delivery Address Card)
- `frontend/src/components/profile/DeleteAddressDialog.tsx` (Delete Address Dialog)
- `frontend/src/components/profile/OrderHistoryList.tsx` (Order History List)
- `frontend/src/app/track-order/page.tsx` (Order Tracking Page)
- `frontend/src/components/orders/OrderTrackingCard.tsx` (Order Tracking Card)
- `frontend/src/components/orders/OrderTrackingTimeline.tsx` (Order Tracking Timeline)
