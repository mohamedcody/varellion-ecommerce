# VARELLION Accessories — Admin UX Addendum

> **Document ID:** `09_VARELLION_ADMIN_UX_ADDENDUM.md`  
> **Version:** 1.0.0  
> **Status:** UX specification draft — owner review required before Milestone B implementation  
> **Project:** VARELLION Accessories  
> **Scope:** Protected administrator interface only. Public storefront UX remains owned by file `02`; frontend routes/types by file `04`; backend authorization and API behavior by file `08`.

---

## 1. Purpose and Boundaries

This addendum defines the screen structure, form behavior, states, and safety requirements for the protected administrator interface required by the backend target in file `08`.

It does not prove that admin APIs, sign-in, permissions, or persistence are already implemented. A screen is not functional until it uses the real backend contract and the associated authorization, validation, persistence, and tests pass.

**Milestone rule:** Do not build admin pages during Milestone A. Build them only during Milestone B after the launch model in file `06`, the route decision in file `04`, the API contract, and the relevant backend behavior are approved and available.

## 2. Route and Locale Decision

### Recommended route proposal — approval required

To remain consistent with the site's existing locale routing, the proposed admin routes are:

| Route pattern | Screen |
|---|---|
| `/{locale}/admin/login` | Administrator sign-in |
| `/{locale}/admin` | Dashboard overview |
| `/{locale}/admin/products` | Product list and management |
| `/{locale}/admin/products/new` | Create product |
| `/{locale}/admin/products/[id]/edit` | Edit product |
| `/{locale}/admin/categories` | Category management |
| `/{locale}/admin/orders` | Order list |
| `/{locale}/admin/orders/[id]` | Order detail and status actions |
| `/{locale}/admin/shipping` | Governorate shipping-rate management |
| `/{locale}/admin/inventory` | Stock and low-stock view |
| `/{locale}/admin/history` | Read-only audit and price/stock history |
| `/{locale}/admin/settings` | Approved operational settings only |

`{locale}` is `ar` or `en`; Arabic is the default and uses RTL, English uses LTR. This is a **proposal**, not owner approval. Record the final route and locale choice in file `04` before implementing any admin route. Do not expose links to the admin interface in the public storefront.

Do not add staff-management, analytics, subscriptions, customer accounts, or public admin registration screens in v1. There is one administrator at launch.

## 3. Global Admin Shell

All authenticated admin pages should share:

- A clear `VARELLION Accessories — Admin` label distinct from the public store.
- Main navigation: Dashboard, Products, Categories, Orders, Inventory, Shipping, History; show Settings only for implemented settings.
- Language switcher preserving the equivalent route when available.
- A visible signed-in administrator identity using only information returned by the authenticated backend.
- A real Sign out action that invalidates the server-managed session.
- A main-content heading and breadcrumb or equivalent location indicator.
- Consistent loading, empty, error, disabled, and success states.

The UI must never treat hiding a control as an authorization boundary. The backend must independently authorize every protected action as required by file `08`.

## 4. Sign-In and Session UX

### Screen content

- Email and password fields with visible labels.
- Show/hide password control that does not disclose the value to logs.
- Submit button with loading state and duplicate-submit prevention.
- Google sign-in control only after the approved Google flow is configured and tested.
- Specific, non-sensitive error messages for invalid credentials, denied identity, expired session, network failure, and unavailable service.
- Link to password recovery only when the email provider and the single-use reset flow are implemented and tested.

### Security behavior

- No sign-up or public administrator registration.
- Google sign-in must not grant ADMIN access to arbitrary Google accounts; backend allowlisting is mandatory.
- Use server-managed `HttpOnly` cookies and the production cookie/CSRF/CORS settings required by file `08`.
- Never put session secrets or sensitive auth tokens in `localStorage`, `sessionStorage`, client-visible configuration, or URLs.
- After logout, expired session, or a 401 response, return the user to the appropriate login route without displaying protected data.
- A 403/permission-denied response must show a clear access-denied state, not silently show an empty dashboard.

## 5. Dashboard Overview

Show only server-returned values and alerts that are actually supported by the implemented API. Potential widgets:

- New/unreviewed orders.
- Orders grouped by actual available statuses.
- Low-stock products/variants according to the configured threshold.
- Recent operational notifications.
- Useful shortcuts to Products and Orders.

Do not show fabricated revenue charts, visitor counts, conversion rates, growth percentages, sales figures, or sample orders. Hide a widget if the API does not provide its data. Empty state should explain that no corresponding records are available yet.

## 6. Product Management

### Product list

Columns or mobile-card fields:

- Product name, in the current locale.
- SKU when available; for variant-based products show the relevant sellable SKU.
- Category.
- Publication state (draft/published/archived as supported by the domain model).
- Price and currency when known.
- Stock or variant stock when supplied by the backend.
- Last update when supplied by the backend.
- Actions the current authenticated user is authorized to perform.

Provide search and practical filters only where supported. Show loading, no-products, no-matching-results, error, and retry states. Do not infer stock from publication status.

### Create/edit form

Group fields logically:

1. **Basic information:** slug/identity as allowed by the backend, Arabic and English name and description, category.
2. **Commercial fields:** base price, previous price if genuinely applicable, publication state, featured flag where approved.
3. **Variants:** option name/value, variant price override when valid, stock, SKU returned/generated by backend. Do not generate a supposedly authoritative SKU only in the browser.
4. **Technical details:** product-specific specifications and compatibility only when verified.
5. **Images:** upload, preview, reorder where supported, alt text in Arabic and English, remove/replace with confirmation. Respect the Cloudinary workflow defined in file `08` and the setup process in file `10`.
6. **SEO:** locale-specific titles/descriptions where the backend/domain contract supports them.

Publication must be blocked with field-level validation when required Arabic/English data is missing. Display backend validation errors near their fields. Preserve user input when a recoverable request fails. Warn about unsaved changes when leaving a dirty form.

Archive/deactivate products instead of hard-deleting products referenced by historical orders. Historical order lines must remain stable.

## 7. Category Management

The list/form should support the approved category taxonomy, Arabic and English names, slug, optional image, and active/archived state as supported by the API.

- Detect and display backend-reported duplicate/conflicting slug errors.
- Confirm before archive/deactivation and explain consequences.
- Do not delete or orphan products as a side effect of category archival.
- Do not introduce a new public category taxonomy without owner approval in file `06` and the rules in file `03`.

## 8. Order Management

### Order list

Display only backend-supported fields, for example order number, creation time, customer name, phone in a suitably masked/list-safe form where possible, current state, shipping-fee known/pending status, and total only when the backend says it is known. Include search/filter by order number, date, and status only if supported by the real API.

### Order detail

Present:

- Order number and current status.
- Snapshot of product names, variants, SKU, unit price, quantity, discount, and line totals from order creation.
- Customer-provided name and delivery/contact fields, visible only to authorized administrators.
- Shipping fee and total with an explicit pending/unknown state when not yet configured.
- Payment method/status consistent with COD and the actual workflow.
- Reservation expiry or related state if exposed by the backend.
- Carrier/tracking fields only when supported and applicable.
- Order timeline/audit entries if the API supports them.

### Status changes and confirmation

- Only present status transitions allowed by the backend state-transition contract.
- Use a confirmation dialog for consequential transitions such as cancellation, shipping, delivery, or delivery failure.
- Describe the actual effect before confirmation when known; do not promise stock restoration unless the backend confirms the operation.
- Disable duplicate submissions while an action is pending. If a request times out, refresh/reconcile the server state before offering a retry that might duplicate an operation.
- Show success only after the backend confirms the state change. On failure, keep the last confirmed state visible and explain the next safe action.
- A customer opening WhatsApp does not prove that the customer sent a message or confirmed the order.

## 9. Inventory and Shipping Rates

### Inventory

- List sellable products/variants and stock values returned by the server.
- Indicate low stock only using the configured threshold and backend-provided/current values.
- Stock adjustments require an authorized mutation, an explicit reason when supported by the API, clear before/after feedback, and audit/history recording in the backend.
- Never implement stock reservation, sold-quantity calculation, or inventory writes as browser-only state.

### Shipping

- Manage rates by the approved Egyptian governorate list provided by the backend/owner data.
- Show configured versus unconfigured rates distinctly.
- Unknown fee is not zero. Do not calculate or show a confirmed order total if the shipping fee is unknown.
- Validate non-negative currency amounts and display currency consistently in Arabic and English.
- Ask for confirmation before changing a live rate and show success only after backend persistence is confirmed.

## 10. Notifications, Audit Log, and History

- In-dashboard notifications are in scope for v1 only where the backend provides them; external email/SMS notifications are not implied.
- Audit history is read-only in the normal interface. Do not provide edit/delete controls for audit records.
- Price/stock history should display timestamp, relevant product/variant, previous/new values, and actor/source only when supplied by the API.
- Do not display credentials, tokens, passwords, reset tokens, or secret configuration in logs or screens.

## 11. Settings and External Services

Expose a setting only when it is explicitly designed, backed by a real API, and authorized. Do not create frontend forms that merely store settings in memory. External-service readiness must be tracked using file `10`; do not display API secrets in the dashboard.

Cloudinary, Google OAuth, and email-provider setup does not mean the integration is complete. Each integration must pass the verification tests in files `08` and `10` before its UI is presented as operational.

## 12. Shared UX and Accessibility Requirements

- Arabic defaults to RTL; English defaults to LTR. Direction applies to inputs, forms, icons with directional meaning, tables, menus, and dialogs.
- Every control has a visible label or an accessible name; form fields include inline validation and error association.
- Keyboard navigation and visible focus are required. Dialogs manage focus, support Escape when appropriate, and return focus to the invoking control.
- Tables remain usable on narrow screens via responsive cards or a deliberately designed horizontal-scroll region.
- Touch targets should be approximately 44 × 44 CSS pixels where practical.
- Never rely on color alone for status; include text/icons/labels.
- Respect reduced-motion preferences and the design tokens in file `01`.
- Avoid exposing full customer addresses or personal details in list screens when unnecessary.

## 13. Required States for Every Screen

For each data-backed screen and mutation, define and test:

- Initial loading and pending mutation state.
- Normal success state.
- Empty state and empty-filter state.
- Validation failure.
- Unauthorized (401) and forbidden (403) state.
- Network/server failure with safe retry guidance.
- Not-found state for a missing or archived resource where appropriate.
- Duplicate/retry behavior for consequential mutations.
- Confirmation and cancellation for destructive/consequential actions.

Do not create success screens that are disconnected from a confirmed server result.

## 14. Acceptance Checklist

- [ ] Final admin route/locale choice is recorded in file `04` and approved before implementation.
- [ ] Sign-in methods match configured and tested backend support; no public registration exists.
- [ ] Only the pre-approved administrator identity can receive admin access.
- [ ] Unauthorized requests cannot access admin pages or APIs; backend authorization is independently tested.
- [ ] Logout, session expiration, CSRF, and CORS behavior work against the actual deployment contract.
- [ ] Product/category forms support Arabic and English validation.
- [ ] SKU, price, stock, reservation, and order totals remain backend-authoritative.
- [ ] Product archiving preserves historical order lines.
- [ ] Unknown shipping rates are not represented as zero or a confirmed total.
- [ ] Order state transitions follow the backend's explicit transition matrix.
- [ ] Image upload validates type/size and keeps Cloudinary secrets server-side.
- [ ] Audit history is read-only and sensitive secrets are never displayed.
- [ ] Loading, empty, error, forbidden, and success states are tested.
- [ ] RTL/LTR, keyboard accessibility, mobile table behavior, and visible focus are checked.

> **Governing rule:** Admin UX makes real operations understandable and safe; it never substitutes for backend authorization, data integrity, or verified integration behavior.
