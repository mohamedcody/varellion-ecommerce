# VARELLION Accessories — UI/UX Specification

> **Purpose:** Define the required page experiences, content hierarchy, interaction behavior, and responsive UX for the VARELLION Accessories storefront.
>
> **Scope ownership:** This file owns public-storefront UX and presentation behavior. It does not own canonical design tokens, technical architecture, product/domain types, backend contracts, or factual business data. See files `01`, `04`, `06`, and `08` for those responsibilities.
>
> **Commercial-data rule:** Never invent products, prices, contact details, policies, delivery promises, reviews, ratings, or business claims. Missing facts must not be shown as fake content or internal placeholder constants.

---

## 1. UX North Star

The interface should minimize the effort needed to:

- Understand what VARELLION Accessories offers.
- Discover available products and categories.
- Compare relevant product information.
- Inspect a product and its confirmed specifications.
- Understand the next legitimate action.
- Contact the business or submit an order through an approved, working flow.

The user should not need instructions to navigate the site. Every visible control must have a clear purpose and a working outcome.

### Release milestones and activation rules

This specification primarily defines the public storefront. Follow the two delivery milestones defined in `00_VARELLION_MASTER_BUILD_PROMPT.md`:

- **Milestone A — Public storefront foundation:** Implement the public pages, bilingual shell, approved catalog browsing, product details, and informational pages. Use only owner-approved facts. A cart, checkout, order submission, customer authentication, and admin UI must not be implied to work in this milestone.
- **Milestone B — Functional commerce release:** The backend commerce target is defined in `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md`. Add customer-facing cart/order flows only after the owner-approved launch model and required factual data are recorded in `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md`, and the relevant frontend/backend API contract is agreed and implemented. The backend specification is a target contract, not proof that an endpoint or external integration already works.

If file `06` is missing or the purchase model is unresolved, continue safe Milestone A work and record commerce-dependent UI as blocked. Do not guess which purchasing model the owner approved.

## 2. UX Principles

1. **Clarity before persuasion:** Explain the product and next action before adding visual decoration.
2. **Mobile first:** Prioritize the experience of visitors arriving from social media on a phone.
3. **Truthful commerce:** Display only verified commercial facts and functional interactions.
4. **Progressive disclosure:** Keep listing cards concise and put detailed specifications on the product page.
5. **Consistent patterns:** Use the same global navigation, container behavior, controls, forms, and state patterns across the site.
6. **Accessible by default:** Keyboard operation, visible focus, semantic structure, readable contrast, and screen-reader feedback are requirements rather than polish.
7. **No dead ends:** Each empty, error, or success state should clearly explain what happened and what the user can do next.

## 3. Canonical User Journeys

### Journey A — Social-media visitor

```text
Social post / profile link
        ↓
Home or product landing page
        ↓
Understand brand and offer
        ↓
Explore category or product
        ↓
Inspect product information
        ↓
Use an approved contact / purchase action
```

Priorities: fast first impression, mobile-readable content, quick access to products, and a clear next action.

### Journey B — Product explorer

```text
Shop
 ↓
Search / category filter / sort
 ↓
Product card
 ↓
Product details
 ↓
Approved next action
```

The first release should support lightweight client-side discovery using the available catalog data. Do not add a complicated filtering engine, infinite loading, or pagination unless the catalog size justifies it.

### Journey C — Hesitant buyer

```text
Product details
 ↓
Verified specifications and compatibility
 ↓
Availability and price, when confirmed
 ↓
Approved delivery / payment / return information
 ↓
Contact or purchase action
```

Never use false scarcity, fabricated reviews, fake guarantees, or invented delivery/payment details to force conversion.

### Journey D — Returning visitor

The user can return to Shop, search again, reopen product details, switch language, or contact the business. Favorites, account history, notifications, and saved carts are future features unless the approved scope and backend support them.

## 4. Conversion Hierarchy

Maintain this visual priority:

1. One primary action relevant to the page.
2. A secondary action, only when useful.
3. Supporting information.
4. Low-priority utilities.

Do not style every action with equal emphasis. CTA labels must state the actual outcome. Examples include “Shop products,” “View product,” and “Contact us,” provided the target exists and is approved.

The site-wide primary CTA must follow the purchase/contact decision in `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md`. Until that decision and any required destination are confirmed, use a valid discovery action such as Shop; do not invent a buying action.

## 5. Global Page Shell

All public pages must share a consistent:

- Header / navigation.
- Main content container.
- Page heading and spacing conventions.
- Footer.
- Locale handling and document direction.
- Focus, hover, pressed, disabled, loading, and error patterns.

Use the tokens and component styling from `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md`. Do not define alternative font sizes, colors, border radii, or CSS token names in this document.

## 6. Header and Navigation

### Desktop header

Recommended structure:

`VARELLION wordmark | Home | Shop | About | Contact | Search (if functional) | Language switcher | Approved primary CTA`

A cart icon may appear only if a working cart is part of the approved purchase flow. Do not display inactive or decorative search/cart controls.

### Mobile header

- Show the wordmark, a functional menu control, and only useful utility controls that fit the layout.
- Keep touch targets approximately 44 × 44 CSS pixels where practical.
- Prevent horizontal overflow at 320px.
- The menu opens and closes predictably, includes a visible close action, supports Escape, and returns focus appropriately.
- When the menu is modal, manage focus correctly and prevent background interaction while open.
- Use readable link labels rather than unexplained icon-only navigation.

### Navigation behavior

- Indicate the current page or section accessibly.
- Keep keyboard focus visible.
- Use real links for navigation and buttons for actions.
- Do not create links to unimplemented or out-of-scope pages.
- Include a language switcher because Arabic and English are required.
- The language switcher should retain the equivalent page when a translation exists. Otherwise, use a clear, predictable fallback to the target locale's home or Shop page.

## 7. Home Page

### Primary goal

Help a first-time visitor understand the brand, discover real products, and take one useful next step without scrolling through unnecessary content.

### Canonical section order

1. **Hero:** A concise headline, short supporting copy, one primary CTA, and an optional secondary CTA or approved visual.
2. **Category shortcuts:** Show only categories that have been approved and have products or a useful destination.
3. **Featured products:** Show only products explicitly marked as featured in approved catalog data. Hide this section if there are no eligible products.
4. **Why VARELLION:** Use concise, supportable information about the actual offer or buying experience. Do not invent differentiators or business credentials.
5. **How to order / next steps:** Include only after the owner-approved purchase/contact method is defined. Explain the real steps, not an aspirational flow.
6. **FAQ:** Show only approved questions and answers from the project content source. Hide the section when no approved FAQs exist.
7. **Final CTA:** One relevant action with a valid destination.
8. **Footer:** Shared site navigation, approved contact/social links, legal links, and language switcher.

The header and footer are part of the global shell and should not be duplicated as home-page content sections. Real social proof may be added only when verifiable evidence is supplied; otherwise omit it.

### Hero requirements

The hero must quickly answer:

- What does the brand offer?
- What useful next step can the visitor take?
- Why is the page relevant to this visitor?

Keep copy concise. Use an approved brand/product visual or a clearly identifiable development placeholder. Do not invent product photos or claims.

### Home-page conditional content

Do not render empty category/product sections, fake best-seller lists, fabricated deals, or arbitrary bundles. Do not show discount badges unless the underlying original and current prices are verified. Keep the page calm and focused when the initial catalog is small.

## 8. Shop / Product Listing Page

### Goal

Help visitors scan the available catalog and find products without excessive filtering or visual clutter.

### Page structure

1. Breadcrumb or clear page title, as appropriate.
2. Short introduction only if approved and useful.
3. Search field.
4. Category filter.
5. Sort control.
6. Results count only when calculated from actual data.
7. Responsive product grid.
8. Useful empty state when no results match.

### First-release discovery features

Implement these lightweight features when actual catalog data is available:

- Text search across approved product name, short description, and category labels in the active locale.
- Filter by the approved category taxonomy.
- Sort by price ascending or descending only for products with known numeric prices and a common comparable currency.
- A clear-filters action when a filter or query is active.

Do not implement complex price ranges, inventory filters, remote search, infinite loading, or pagination unless there is an actual product/data requirement. Do not compare prices expressed in different currencies. If a product lacks a known price, it must not be incorrectly treated as zero during sorting.

### Desktop behavior

- Search and controls should be compact and easy to scan.
- Use a filter sidebar only if the available filter set justifies the space; otherwise use a horizontal control row.
- Product cards must align consistently without forcing all descriptions to be the same length.

### Mobile behavior

- Keep search reachable near the top of Shop.
- Use a simple inline category control, compact selector, or accessible filter sheet if the UI needs one.
- A filter sheet must have clear Apply / Reset / Close behavior and correct keyboard/focus handling.
- Do not hide essential controls behind hover.

### Empty and no-result states

Distinguish between:

- No approved products have been published.
- Search/filter criteria return no matches.
- Product data failed to load.

Use a localized, helpful message and a valid recovery action. Never fill an empty listing with made-up products.

## 9. Product Card

Use one canonical, uncluttered card structure throughout the site. The standard information order is:

1. Product image or clearly labelled placeholder.
2. Category label, when useful and available.
3. Product name.
4. Short description / key benefit.
5. Price and currency, only when approved and known.
6. Availability, only when the data is reliable and current.
7. One clear action, such as “View product.”

### Card rules

- Keep product name and key information visually prominent.
- Use the same structure and spacing in every grid context.
- Keep image aspect ratios consistent and use an intentional object-fit behavior.
- Use localized alt text that describes the actual image; use empty alt text only for purely decorative imagery.
- Do not show ratings, review counts, old prices, discount percentages, “best seller,” “new,” or stock urgency without verified source data and an approved data field.
- Prefer a product-details link over a non-functional add-to-cart button when the purchase model is undecided.
- Avoid nesting interactive controls inside another interactive link.

## 10. Product Details Page

### Goal

Help the visitor understand the actual product and decide on a legitimate next step.

### Canonical content order

1. Breadcrumbs.
2. Product image/gallery.
3. Product name.
4. Price and currency, when known.
5. Availability, when reliably known.
6. Short, factual value proposition.
7. Approved primary action.
8. Key specifications and compatibility, when supplied.
9. Full description, when supplied.
10. Delivery, payment, returns, and warranty information only when approved.
11. Related products only when a real relationship and eligible catalog entries exist.
12. FAQ only when approved product-specific or general answers are available.

### Behavior

- Keep the main product action easy to find on desktop and mobile.
- A mobile sticky action area may be used only if it does not obscure content, form controls, browser UI, or accessibility focus. It must respect safe-area insets and remain dismissible or unobtrusive.
- Do not display a missing price as zero or as an internal token.
- Do not display a stock state unless supported by the canonical product model and current data source.
- If the product slug does not match a published product, show a localized not-found state and a link back to Shop.
- Draft/unpublished products must not be exposed through public listing or detail pages.

## 11. Search UX

Search must be useful only if it is connected to the available product data.

Required states:

- Idle / empty query.
- Matching results.
- No results.
- Cleared query.
- Loading or error only when the search actually depends on an asynchronous source.

For a local first-release catalog, filtering may happen client-side. Do not show an artificial loading spinner for a synchronous local search.

Search rules:

- Provide a visible label or accessible name.
- Support keyboard entry and clearing the query.
- Search according to the active locale's approved names and descriptions.
- Preserve the query when it helps the user navigate between the listing and results.
- A no-results state should offer clear recovery, such as clearing the query or browsing all products.
- Do not suggest products that do not exist in the approved catalog.

## 12. About Page

### Goal

Explain the brand and the purpose of the store without inventing company history or credibility claims.

### Recommended structure

1. Page title and concise brand introduction.
2. What the brand offers, based on approved positioning.
3. Product/category focus, based on the actual catalog.
4. Brand principles or service approach only when confirmed by the owner.
5. A useful next step to Shop or Contact.

Do not invent founding dates, founder biographies, company size, warehouse locations, sourcing claims, certifications, partnerships, or business achievements. The final text must come from approved bilingual content in file `06` or another owner-approved source. If details are not yet available, keep the page minimal rather than adding fictional history.

## 13. Contact Page

### Goal

Give visitors a reliable way to contact the business and communicate what happens after they do so.

### Content hierarchy

1. Page title and short invitation.
2. Verified contact channels that have been supplied and approved.
3. Contact form only if a real form-submission destination is configured.
4. Expected response time only if the owner has confirmed it.
5. Links to relevant FAQ or policies when they help answer common questions.

### Recommended form fields

- Name — required.
- Email or phone/contact method — require at least one valid contact method, according to the implemented form contract.
- Subject — optional unless operationally required.
- Message — required.
- Privacy notice link near the submit action.

Do not require both email and phone without a business reason. Use a visible label for every field, clearly indicate required fields, validate input, and show specific inline errors.

### Submission rules

- Submit only to a configured and functioning endpoint or approved contact mechanism.
- Show success only after the destination confirms submission.
- If no submission backend/contact destination exists, do not show a fake working form or false success message. Record the missing destination as a launch blocker and show only verified alternatives.
- Never expose raw server errors or sensitive request data.

## 14. Privacy Policy Page

### Goal

Present the owner-approved privacy notice in a readable, accessible layout.

Requirements:

- Use the approved legal text from file `06` or another source explicitly approved by the owner and reviewed for the business's actual practices.
- Use a narrow reading column, clear headings, a contents list only if the policy is long enough to benefit, and legible paragraph spacing.
- Show an effective/updated date only when an actual date has been approved.
- Keep the page available in Arabic and English with equivalent, reviewed meaning.
- Do not invent claims about cookies, analytics, third-party processors, data retention, deletion rights, security controls, or data sharing.

If the approved policy is missing, report the legal content as a launch blocker. Do not publish invented legal terms or present draft placeholder copy as a finalized policy.

## 15. Terms and Conditions Page

### Goal

Present the business's approved terms in a clear reading layout.

Requirements:

- Use the owner-approved text based on the actual purchase model and operating practices.
- Do not invent refund, cancellation, delivery, payment, warranty, liability, or dispute-resolution terms.
- Include an effective date only if it has been confirmed.
- Provide equivalent reviewed Arabic and English versions.
- Ensure links and section headings remain readable on mobile.

If the content has not been approved, record it as a launch blocker rather than fabricating a legal policy.

## 16. Cart Page — Conditional

The cart is not automatically included in the first release. Build it only if the approved purchase model in file `06` explicitly requires a cart and specifies a real next step for submitting or continuing the order.

If enabled, the cart should provide:

- Product identity and image.
- Confirmed unit price, currency, and quantity.
- Quantity update and remove actions.
- Subtotal calculated from known numeric values.
- Clear empty-cart state with a link to Shop.
- A clear next action whose destination exists.
- An understandable unavailable-product state if inventory support exists.

Do not invent shipping charges, taxes, discounts, total fees, or stock. Do not persist cart data in a way that implies server-side order creation. State any local-only behavior accurately. If required product prices or the order destination are missing, do not present the cart as a completed commerce feature.

## 17. Checkout / Order Submission — Conditional

Checkout or order submission is built only after the owner approves the buying model and the implementation has a genuine order-submission destination.

Before implementation, file `06` must define at least:

- The intended purchase method.
- Required customer/order fields.
- The destination that receives the order.
- How submission success/failure is confirmed.
- Any owner-approved payment, shipping, cancellation, or confirmation rules displayed to the customer.

A frontend-only form must not claim that it created or submitted an order unless a real destination confirms the operation. Do not implement online payments, COD confirmation, order numbers, shipping calculations, or confirmation emails by simulation.

If COD is eventually approved, explain COD only as the agreed business process; do not imply that an order is accepted or confirmed before the real submission mechanism confirms it.

## 18. Forms and Validation

All forms must include the relevant behaviors:

- Visible, programmatically associated labels.
- Clear required/optional indicators.
- Helpful placeholders only when they add value.
- Client-side validation for usability, with server-side validation where a backend exists.
- Inline, localized error messages that explain how to recover.
- A submission/loading state that prevents accidental duplicate submissions where appropriate.
- A confirmed success state only after success is returned by the real destination.
- A failure state with a retry or alternative action where appropriate.
- Keyboard operation and screen-reader announcements for status changes.

Do not rely on color alone to communicate errors. Preserve safe user-entered values after recoverable errors when appropriate.

## 19. Empty States

Every empty state should answer:

1. What is empty or what happened?
2. Why might it be empty, if that is known?
3. What can the user do next?

Examples of relevant states include no published products, no search matches, no matching category, empty cart (if enabled), and no related products. Do not expose implementation details or invent explanations.

## 20. Error States

Use human, localized language. For example:

> We couldn't load the products right now. Please try again.

Provide Retry only when another attempt is meaningful. For invalid or removed product routes, provide a not-found explanation and a valid Shop link. Keep stack traces, API payloads, and raw exception names out of customer-facing UI; log technical detail only through the project's approved logging mechanism.

## 21. Loading States

- Use skeletons for content-heavy asynchronous regions when the approximate layout is known.
- Keep the layout stable while data loads.
- Use small localized progress feedback for actions such as form submission.
- Do not display a full-page blocking spinner for a small region update.
- Do not create fake loading states for local synchronous operations.
- Respect reduced-motion preferences.

## 22. Footer

Include only relevant, working links:

- VARELLION wordmark.
- Home, Shop, About, and Contact links.
- Privacy Policy and Terms links.
- Approved contact channels and social profiles, if available.
- Language switcher if it is not already clear and accessible in the header.
- Copyright text using a valid dynamic year or an owner-approved fixed statement.

Do not invent social account URLs, email addresses, phone numbers, or response-hour commitments. Avoid long, decorative link lists.

## 23. Responsive Layout and Container Metrics

Use one consistent main-container rule across public pages:

- Maximum content width: **1280px**.
- Horizontal page padding: **16px** at 320–767px, **24px** at 768–1023px, and **32px** at 1024px and wider.
- Center the container when the viewport exceeds its maximum width.
- Use a consistent section-spacing rhythm based on the tokens in file `01`; avoid page-specific arbitrary margins.
- Images must stay within their containers and preserve an intentional aspect ratio.

These are the canonical UX layout metrics for the first release. Implement them through shared layout primitives rather than repeating unrelated hardcoded values on every page.

## 24. Product Grid Metrics

Use the following responsive product-grid targets:

| Viewport width | Columns | Notes |
|---|---:|---|
| 320–359px | 1 | Keep product names, price, and action comfortably readable. |
| 360–767px | 2 | Ensure images and controls remain usable at narrow widths. |
| 768–1023px | 3 | Tablet layout. |
| 1024–1279px | 3 | Desktop with spacious cards. |
| 1280px and wider | 4 | Use the maximum container width; do not stretch cards excessively. |

Use CSS Grid or an equivalent shared responsive layout. Cards in the same row should align well without clipping content. If real product imagery is not available, use the placeholder rules from file `01` and do not mix placeholders with fake official assets.

## 25. Responsive QA Viewports

At minimum, inspect the actual rendered UI at:

- 320px
- 360px
- 375px
- 390px
- 414px
- 768px
- 1024px
- 1280px
- 1440px and wider

Check for horizontal scroll, clipped text, menu overflow, distorted imagery, cramped controls, inconsistent container edges, sticky actions obscuring content, and broken RTL/LTR layouts. Do not claim visual verification unless the rendered UI was actually inspected.

## 26. RTL and LTR Behavior

The active locale determines the document language and direction. The technical locale-route implementation belongs to file `04`.

For Arabic:

- Use RTL document direction and natural text alignment.
- Prefer CSS logical properties such as `margin-inline-start` and `padding-inline-end`.
- Check icons individually; do not mirror every icon automatically.
- Ensure product galleries, controls, breadcrumbs, pagination, and menus remain understandable.
- Use the approved Arabic font and line-height from file `01`.

For English:

- Use LTR direction and the approved Latin font from file `01`.
- Confirm that Arabic product names or mixed-script text still render naturally where they appear.

Both locales must have equivalent core functionality and complete user-facing strings. Do not ship a page with mixed hardcoded English and translated Arabic controls. Use reviewed category labels and copy from the approved content source.

## 27. Accessibility Requirements

Build toward WCAG 2.2 AA-quality interaction patterns where applicable, and verify rather than assume conformance.

Requirements include:

- Semantic landmarks and a logical heading hierarchy.
- Keyboard access to all interactive elements.
- Clearly visible focus indicators.
- Sufficient text and control contrast as defined and verified alongside file `01`.
- Descriptive accessible names for icon-only controls.
- Useful text alternatives for meaningful images.
- Correct labels and error associations for form inputs.
- Focus management for menus, dialogs, and filter sheets.
- Screen-reader announcements for asynchronous success/error status.
- Touch targets around 44 × 44 CSS pixels where practical.
- No color-only status information.
- Respect for `prefers-reduced-motion`.

Use ARIA only when native HTML semantics do not sufficiently express the control's behavior.

## 28. Motion and Interaction Feedback

The motion system and timing tokens are defined in file `01`. This document sets the UX limits:

- Animate only to provide state feedback or support orientation.
- Keep hover, pressed, focus, and open/close feedback subtle and consistent.
- Do not rely on hover for information or actions.
- Avoid continuous floating motion, giant parallax effects, long entrances, scrolling gimmicks, and animation on every card.
- Ensure actions remain usable when reduced motion is enabled.
- Do not use animation to hide slow loading or confusing interaction.

## 29. Content Density and Visual Hierarchy

A typical content section may use an optional eyebrow, heading, supporting copy, primary content, and an optional action—but should not include every element automatically.

Prefer:

- Short, scannable copy.
- Clear headings.
- Consistent spacing.
- Meaningful visual anchors.
- Sufficient whitespace.

Avoid turning the storefront into a documentation page, filling space with repeated cards, or adding sections only because a generic template includes them.

## 30. CTA Rules

A CTA label must accurately describe the result. Examples, when the destination is implemented and approved:

- Shop products.
- View product.
- Browse category.
- Contact us.
- Send message.
- Continue to order, only when a real order flow exists.

Avoid vague or misleading labels such as “Click here,” repeated “Learn more” labels with no context, “Buy now” for a non-buying interaction, or “Order confirmed” without confirmed submission.

Every CTA must have a valid destination and a defined success/failure behavior when it triggers an action. Do not include dead links or buttons with empty handlers.

## 31. FAQ UX

Use only owner-approved FAQs with approved answers, sourced from file `06` or another explicitly approved business-content source. Potential topics include compatibility, delivery, payment, warranty, and returns, but those questions must not be answered with invented policies.

FAQ behavior should include:

- Clear, descriptive question labels.
- Keyboard-accessible disclosure controls.
- Exposed expanded/collapsed state for assistive technology.
- Readable answer width and spacing on mobile.
- No misleading claims or unsupported promises.

If there are no approved answers, omit the FAQ section rather than publishing speculative content.

## 32. Trust and Social Proof

Use only real, verifiable signals supplied by the owner. Examples may include real product photography, clear approved contact information, and approved policy pages.

Never invent or imply:

- Customer counts or satisfaction percentages.
- Reviews or ratings.
- Sales volume.
- Official partnerships or certifications.
- Guaranteed delivery dates.
- Warranty coverage.
- Secure/payment-provider claims that have not been implemented and verified.

Do not use fake countdowns, false scarcity, fake purchase notifications, forced newsletter popups on first paint, or intrusive chat widgets.

## 33. Product Data and UX Boundaries

The canonical product domain type, publication state, and availability enum are owned by file `04`. This document must not define a competing TypeScript `Product` interface.

This UX specification expects the interface to handle the following distinctions without confusing users:

- A product not published to the public catalog.
- A published product whose stock is unavailable, when reliable stock data exists.
- A product with missing approved price information.
- A missing or invalid product route.
- A catalog with no approved products.

Use only status values supported by the canonical model. Do not infer stock from the existence of an image or from the presence of a product record. Keep internal status codes out of customer-facing copy; map supported states to reviewed localized labels.

## 34. Non-Goals for the First Release

Unless files `00` and `06` explicitly approve and support a feature, do not build:

- Fake user accounts or dashboards.
- Fake admin pages.
- Non-persisting cart/checkout/order confirmation.
- Payment processing without an approved provider and real backend.
- Favorites, order history, or notifications that do not persist.
- Reviews, ratings, or social proof without real evidence.
- Complex filtering infrastructure unsupported by the catalog size.
- Promotional pricing, bundles, or best-seller rankings without approved data.
- Intrusive chat, newsletter, or permission popups.

## 35. Page Acceptance Checklist

### Home

- [ ] The brand offer and the next action are clear above the fold.
- [ ] Only valid category/product sections appear.
- [ ] No unsupported claims, fake social proof, or fake deals are shown.
- [ ] The CTA has a real destination.

### Shop

- [ ] Search, category filter, and price sorting work on approved data.
- [ ] Results, empty, no-match, and relevant error states are handled.
- [ ] Product cards use the canonical hierarchy.
- [ ] Unknown prices are not treated as zero.

### Product details

- [ ] The route maps to a published product slug.
- [ ] Only approved product facts are displayed.
- [ ] Missing price, availability, or optional details are handled safely.
- [ ] The CTA matches the approved buying/contact flow.

### About and legal pages

- [ ] About content contains no invented history or achievements.
- [ ] Privacy and Terms use approved legal content in both locales.
- [ ] Missing required legal content is reported as a launch blocker.

### Contact and conditional commerce pages

- [ ] Contact channels are verified and approved.
- [ ] Forms submit only to a real destination and never fake success.
- [ ] Cart/checkout are present only if the approved purchase model requires them.
- [ ] Order confirmation appears only after actual submission confirmation.

### Global UX

- [ ] Header and footer links work.
- [ ] Language switching works and preserves the equivalent route when available.
- [ ] RTL/LTR are both inspected.
- [ ] The site has no horizontal overflow at target sizes.
- [ ] Controls are keyboard accessible with visible focus.
- [ ] Reduced motion is respected.
- [ ] No internal placeholder tokens appear to customers.

## 36. UX Success Criteria

A first-time mobile visitor should be able to:

- Understand the brand's approved offer quickly.
- Reach the real product catalog without unnecessary steps.
- Find a product using search or category browsing.
- Understand the available, verified product information.
- Know exactly what happens after selecting the primary action.
- Contact the business only through a real, approved channel.

The site should feel effortless and trustworthy—not impressive for its own sake. A visually complete page is not considered complete if its actions are misleading, its content is invented, or its critical business decisions remain unresolved.

