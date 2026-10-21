# VARELLION Accessories — Backend, Database & Security Specification

> **Document Type:** Backend Architecture, Database, Security & Operations Specification  
> **Project:** VARELLION Accessories  
> **Version:** 1.0.0  
> **Status:** Draft — Decisions captured; implementation and deployment validation required  
> **Primary Backend:** Java + Spring Boot  
> **Database:** PostgreSQL  
> **Database Migrations:** Flyway  
> **Development Environment:** Docker Compose  
> **Architecture Style:** Modular Monolith  
> **Primary Business Language:** Arabic  
> **Secondary Business Language:** English  
> **Currency:** EGP  

---

## 1. Purpose and Scope

This document records the agreed backend and operational requirements for VARELLION Accessories. It is the primary reference for designing the first production-oriented backend, its PostgreSQL schema, security boundaries, REST API contracts, inventory handling, order lifecycle, image storage integration, and operational safeguards.

The first release is a bilingual e-commerce store. Customers can browse products, add products or product variants to a cart, submit an order as a guest, and continue to WhatsApp to discuss/confirm the order. An administrator manages products, categories, stock, shipping rates, and orders through a protected dashboard.

The system must not claim a capability is operational until its backend behavior has been implemented and tested. Documentation examples are requirements or proposed contracts, not proof that an endpoint or external integration already exists.

### In scope for the first release

- Protected administrator sign-in using email/password and Google sign-in for the pre-approved administrator identity.
- One administrator account at launch, with room for roles and additional staff accounts later.
- Product and category management, including Arabic and English translations.
- Product variants, automatically generated SKUs, and stock tracking.
- Product image uploads through Cloudinary, subject to account configuration.
- Guest checkout and order creation in PostgreSQL before the WhatsApp handoff.
- Temporary stock reservations with a 24-hour confirmation window.
- Configurable shipping costs by Egyptian governorate.
- COD as the initial payment method, subject to order confirmation before shipment.
- Guest order lookup using order number and customer phone number, with abuse protection.
- Admin order management, in-dashboard notifications, audit logs, price/stock change history, and database backup operations.
- PostgreSQL migrations managed by Flyway and a Docker Compose development environment.

### Explicitly not in the first-release scope unless separately approved

- Online card payments or a payment gateway.
- Customer accounts and customer authentication.
- General public administrator registration.
- Email/SMS notifications for new orders.
- Customer self-service order cancellation.
- Coupons or an advanced promotions engine.
- Microservices.
- SaaS subscriptions, team accounts, or unrelated digital products.

---

## 2. Confirmed Business and Product Decisions

| Area | Decision |
|---|---|
| Brand | VARELLION Accessories is the only brand name. |
| Languages | Arabic (`ar`) and English (`en`). Product/category records may be saved as drafts with incomplete translations, but require both languages before publication. |
| Currency | Egyptian pound, currency code `EGP`, for products, orders, and shipping in the first release. |
| Product assortment | A varied range of mobile accessories. Actual product records, prices, and stock must be provided/approved by the owner; they must not be invented. |
| Checkout | Guest checkout; customers do not need an account. |
| Order handoff | Save the order in PostgreSQL first, then show a confirmation page containing the order number and a summary, with a button to open a pre-filled WhatsApp message. Opening WhatsApp does not prove the message was sent or the order was confirmed. |
| WhatsApp | Business contact supplied: `01104867352`. Use Egypt's international format for generated links only after validating the number and the exact URL at implementation time. |
| Payment | Cash on delivery (COD) is the initial intended method. Confirm order details with the customer before shipment. No online payment integration is in scope. |
| Customer order fields | Required: customer name, mobile number, governorate, city/area, detailed address. Optional: additional notes. A nearby landmark may be offered as an optional field if the owner approves the UI. |
| Shipping coverage | Intended coverage is all governorates of Egypt. A carrier has not yet been selected. |
| Shipping fees | Configured by governorate through the admin dashboard when known. Until a governorate fee is configured, an order may be created, but the final total must not be presented as confirmed; the fee and total must be confirmed with the customer through WhatsApp before the order is finalized for shipment. |
| Stock reservation | Reserve requested stock atomically when an order is created. If the order is cancelled or the confirmation window expires, release the reservation exactly once. |
| Reservation expiry | 24 hours from order creation, unless a later approved configuration changes it. |
| Products and variants | A product can have variants (for example, colour or cable length). A sellable variant may have its own price and stock. If no variant-specific price is set, the valid base product price may be used. |
| SKU | A sellable simple product gets a backend-generated unique SKU. For variant-based products, each sellable variant gets a unique backend-generated SKU; the parent product has an internal ID and does not need a sellable SKU unless it can itself be sold. |
| Discounts | Initial support is current price plus optional previous price. Calculate discount percentage server-side; only treat it as a discount when the previous price is valid and greater than the current price. No coupon engine in the first release. |
| Product removal | Archive/deactivate products instead of hard-deleting them, especially when historical orders reference them. Preserve historical order lines. |
| Categories | Admin can create/edit/archive categories, with Arabic/English names, slug, and optional image. Detect duplicate/conflicting slugs and preserve products when a category is archived. |
| Images | Admin uploads images through the dashboard. Cloudinary is the initial recommended/selected provider, pending account setup. Store provider asset ID, URL, and metadata in PostgreSQL; do not store image binary contents in PostgreSQL. Keep the provider behind a storage service boundary. |
| Admin account | One administrator at launch. No public administrator registration. Create/bootstrap the first admin through a secured server-side setup process. Structure access control for future roles without building a full staff-management UI now. |
| Admin sign-in | Email/password and Google sign-in. Google sign-in is allowed only for the pre-approved administrator identity; Google authentication must never automatically grant the ADMIN role to any arbitrary account. |
| Session security | Prefer server-managed sessions using `HttpOnly` cookies, `Secure` in production, appropriate `SameSite`, and CSRF protection. Do not store sensitive authentication tokens in `localStorage`. |
| Password reset | Plan an email-based, expiring, single-use reset link once a mail provider is configured. Maintain a documented, controlled server-side recovery procedure for emergencies. Never expose a public reset path that bypasses verification. |
| Order tracking | Guest can look up an order using order number and phone number. Apply rate limits and avoid disclosing full address or other sensitive information. |
| Order cancellation | Customer requests cancellation through WhatsApp in v1; an administrator performs the state change in the dashboard. The backend verifies the state transition and releases stock reservation once. |
| Shipping tracking | Admin may enter carrier name and tracking number; both are optional until a carrier is selected. Admin can update shipped, delivered, and delivery-failed states. |
| Admin notifications | New orders and status updates appear inside the admin dashboard only in v1; no email or other external notifications are required. |
| Historical prices | Snapshot product name, SKU, chosen variant, unit price, quantity, discount and other necessary line details at order creation. Historical orders must not change when catalog data changes. Persist shipping-fee value and its known/unknown status as part of the order. |
| Low-stock alerts | Show admin-dashboard alerts for products/variants at or below a configurable low-stock threshold. |
| Audit log | Record sensitive admin actions, such as product/category changes, prices, stock, shipping fees, order-status updates, and settings changes. Do not log passwords, tokens, or secrets. The normal dashboard must not offer edit/delete actions for audit history. |
| Price/stock history | Maintain a separate history of price and inventory changes, including prior/new values, timestamp, and actor/source where available. |
| Database changes | Use Flyway versioned migrations; do not rely on manual production schema edits. |
| Local development | Use Docker Compose for PostgreSQL with a persistent volume. Keep passwords and service credentials out of Git. |
| Backup | Target daily database backups with an initial 14-day retention period, encrypted and stored separately from the database. Verify restore before launch and periodically after launch. Check managed database backup features first to avoid duplicate cost. |
| Backend structure | Modular Monolith: one Spring Boot application with explicit module boundaries, not microservices in the first release. |
| Team collaboration | Shared Git repository is the current recommendation, with separate `frontend/` and `backend/` directories and independently buildable/deployable applications. Use feature branches and reviewed merges. |

---

## 3. Architecture Principles

1. Use a **Modular Monolith**: one Spring Boot application organised into cohesive business modules.
2. Keep business logic in services/domain logic, not controllers or persistence entities exposed directly to clients.
3. Use DTOs for API input/output and map between DTOs, domain models, and persistence models as appropriate.
4. Use database constraints as a final integrity boundary in addition to Java validation.
5. Do not trust frontend price, discount, stock, shipping, subtotal, or total values. Recompute them on the server from authoritative data.
6. External integrations (Cloudinary, email provider, and any future carrier integration) must sit behind clear service boundaries.
7. Keep provider-specific secrets on the server. Never return them to Next.js or place them in public environment variables.
8. Implement only features in the approved v1 scope; document future extension points without building fake functionality.
9. Prefer explicit, testable code over excessive abstraction.
10. All state transitions with stock or financial implications must be transactional and concurrency-safe.

---

## 4. Recommended Repository and Backend Structure

Recommended repository layout:

```text
varellion/
├── frontend/                         # Next.js application
├── backend/                          # Java / Spring Boot application
├── docs/                             # Optional architecture and API documentation
├── docker-compose.yml                # Local development dependencies
├── .env.example                      # Names and safe example values only
└── README.md
```

Recommended package organisation inside the backend (exact package names can follow the final Java base package):

```text
.../varellion/
├── config/
├── common/
│   ├── api/
│   ├── errors/
│   ├── validation/
│   └── observability/
├── security/
├── auth/
├── admin/
├── catalog/
│   ├── products/
│   ├── variants/
│   ├── categories/
│   └── translations/
├── inventory/
├── media/
├── shipping/
├── orders/
├── settings/
├── notifications/
└── audit/
```

Within each module, add only the layers that have a clear job. A typical module may contain `controller`, `service`, `repository`, `entity`, `dto`, `mapper`, and tests. Do not create empty packages or force every module to use an identical structure if it adds no value.

### Dependency direction

```text
HTTP Controller
      ↓
Application Service / Use Case
      ↓
Domain Rules + Repository/Integration Interfaces
      ↓
Persistence or External Provider Adapter
```

Shared/common code must not become a dumping ground for unrelated business logic. Catalog modules should not depend on admin UI concepts; the admin UI calls the backend APIs.

---

## 5. Domain Model and Database Design Requirements

This section defines logical entities and required relationships. The implementation team must produce a reviewed ERD and final Flyway migrations before treating the schema as final. Names below are proposed logical names, not mandatory final SQL identifiers.

### 5.1 Administrator identity and security

- `admin_users` or a clearly documented shared `users` table with role/status controls.
- Store email in a normalised form and enforce uniqueness at database level.
- Store password hashes only; never store plaintext passwords.
- Track enabled/disabled status and timestamps. Use a separate role/authority design that can support more administrators later.
- If Google sign-in is enabled, store the validated provider subject/identity or an equivalent secure link; do not use an unverified browser-provided email as proof of identity.
- The initial bootstrap flow must not expose an open public endpoint that grants administrator access.

### 5.2 Products and categories

Logical entities:

- `products`: internal ID, category reference where applicable, publication status, base price in EGP, optional previous price, product type/variant mode, generated SKU only where the parent itself is sellable, archive state, and timestamps.
- `product_translations`: product reference, locale (`ar` or `en`), name, short description, full description, optional SEO title/description, and any approved localised content. Enforce one translation per product per locale.
- `categories`: internal ID, stable slug, optional image reference, archive/publication state, and timestamps.
- `category_translations`: category reference, locale, translated name/description as needed. Enforce one translation per category per locale.
- `product_variants`: parent product reference, attributes such as colour/length, optional variant price override, sellable SKU, active/archive state, and timestamps.
- `variant_translations` only if variant option labels need localised display names; do not add it unless needed.
- `media_assets`: provider, provider asset ID, canonical URL, file type, size, dimensions, alt text by locale if needed, sort order, and product/category relation through a relation table or clear ownership model.
- `product_media` (or equivalent relation): product/variant/media relationship and display order.

A product or category may be saved as a draft with incomplete translations. It must not be published until both Arabic and English mandatory content passes validation. Do not delete historical translation/media references in a way that breaks old order snapshots.

### 5.3 Inventory and stock reservations

Logical entities:

- `inventory_items`: one sellable stock record per simple product or sellable variant, with on-hand quantity and any required version/concurrency control.
- `stock_reservations`: order reference, sellable inventory item, quantity, expiry time, state (`ACTIVE`, `RELEASED`, `CONSUMED` or equivalent), created/released timestamps.
- `inventory_movements` or `stock_change_history`: change amount, stock before/after, reason/source, associated order when applicable, actor, and timestamp.

Do not let both parent product stock and variant stock represent the same units. The schema must define exactly one stock-owning sellable item for each SKU.

### 5.4 Orders and order snapshots

Logical entities:

- `orders`: internal ID, human-facing unique order number, guest customer name and contact/shipping snapshot, currency (`EGP`), subtotal, discount total, shipping-fee amount (nullable when unknown), shipping-fee status, total status/amount, order status, confirmation deadline, timestamps, and relevant cancellation/delivery metadata.
- `order_items`: order reference; product/variant IDs where retained for navigation; immutable snapshots of product name, SKU, selected options, unit price, quantity, discount per unit/line, and line totals. Snapshot fields are authoritative for historical display.
- `order_status_history`: previous status, new status, actor/system source, reason, and timestamp.
- Shipping fields can be placed on `orders` for v1 if there is only one shipment per order; use a separate `shipments` table only if multi-package shipments are needed.

Store shipping amount separately from the product subtotal. When shipping is unknown, do not invent a charge and do not label the total as final. The backend must clearly distinguish `subtotal`, optional known `shippingFee`, `total` when calculable, and a status such as `SHIPPING_FEE_PENDING`/`TOTAL_PENDING`.

### 5.5 Shipping configuration

Logical entities:

- `governorates`: stable identifier and canonical supported value/slug. Decide the authoritative list and spelling before seeding it.
- `shipping_rates`: governorate, amount in EGP, active state, effective dates if needed, and timestamps.
- `shipping_settings`: configurable defaults such as the 24-hour reservation window and low-stock threshold, with safe validation and audit tracking.

Do not invent shipping fees, delivery times, or carrier coverage claims. Rates remain unset until the owner has agreed terms with a carrier. Orders for a governorate with no configured rate may be recorded, but the final total cannot be confirmed until the fee is known.

### 5.6 Audit and history

Logical entities:

- `admin_audit_log`: actor, action, entity type/ID, timestamp, request/correlation ID if available, and a redacted summary of changed fields. Never write passwords, session IDs, reset tokens, Google tokens, or service secrets.
- `price_change_history`: product/variant, previous/current price, previous/current compare-at price where applicable, actor/source, and timestamp.
- `stock_change_history`: inventory item, previous/current quantity or delta, reason, actor/source, related order/reservation when applicable, and timestamp.

History should be append-only from the normal application path. The application must not expose regular edit/delete endpoints for audit/history records. Database administrators can technically alter a database; do not promise absolute immutability without a separately designed tamper-evident or external logging system.

### 5.7 Notifications

For v1, the dashboard should show new orders and relevant state changes using database state/polling or another simple verified approach. Do not add a message broker or real-time transport until it is justified. Notification read/unread behaviour can be implemented simply; if no separate notification table is used, clearly define how the dashboard calculates unseen orders.

---

## 6. Price, Currency, and Discount Rules

- Use `EGP` consistently in the first release.
- Store money as an exact decimal type such as PostgreSQL `NUMERIC`, not binary floating point.
- Define a consistent currency scale and rounding policy (typically two decimal places unless the business approves otherwise).
- Validate that current prices are non-negative and within documented bounds.
- If a previous/compare-at price is present, require it to be greater than the current price before presenting a discount.
- Calculate the discount percentage on the server; do not trust a percentage sent by the frontend.
- A variant-specific price overrides the base product price only when explicitly set and valid; otherwise use the valid base price.
- At order creation, calculate each line from authoritative catalog prices and save the immutable snapshot.
- Never accept the client-provided subtotal, discount amount, stock quantity, shipping amount, or total as authoritative.
- If shipping is unknown for the selected governorate, the order may be recorded but the final total must remain pending. The UI and WhatsApp message must say that shipping and the final total need confirmation.
- Preserve historical prices even when the product, variant, or category is edited or archived later.

---

## 7. Order Lifecycle and State Transitions

Use a documented state machine rather than allowing arbitrary status edits. Proposed initial statuses (final enum names may be refined before coding):

- `PENDING_CUSTOMER_CONFIRMATION`: order persisted; WhatsApp handoff has not itself confirmed customer intent.
- `PENDING_SHIPPING_FEE`: shipping rate is unknown; final total is not yet confirmed.
- `CONFIRMED`: administrator has verified order details and the customer accepts the final amount/payment terms.
- `PREPARING`: order is being prepared.
- `SHIPPED`: handed to a carrier; carrier/tracking details may be present.
- `DELIVERED`: delivery is recorded as completed.
- `DELIVERY_FAILED`: delivery attempt failed or carrier reported failure.
- `CANCELLED`: valid cancellation completed.
- `EXPIRED`: confirmation window expired before confirmation.

The final data model may represent shipping-fee status separately from order status to avoid overloading one status field. The API and dashboard must make pending information clear.

### Required behaviour

1. Validate request fields and server-side product/variant identifiers.
2. Load current product/variant price and stock from the database.
3. Calculate subtotal/discount server-side.
4. Resolve shipping fee for the selected governorate. If not configured, mark it pending and do not claim a final total.
5. Atomically reserve each requested sellable item's stock and create reservation rows.
6. Persist order and immutable order item snapshots in a single transaction, or use a carefully designed transactional sequence that cannot leave orphan reservations or partial orders.
7. Return the persisted order number and safe summary to the frontend.
8. Show the confirmation page with order number/details and an explicit button to open a pre-filled WhatsApp message.
9. Do not infer WhatsApp message sent/delivered from browser navigation.
10. Administrator confirms details and shipping amount before moving the order into a confirmed/preparation flow.
11. Release reservations exactly once on valid cancellation or expiration. Consume/convert the reservation according to the documented state transition when the order is confirmed and processed.
12. Prevent invalid transitions, such as cancelling a delivered order through the ordinary cancellation endpoint.
13. Keep an order-status history and admin audit entry for administrative state changes.

### WhatsApp payload

Generate a URL using the configured business number and URL-encoded message. Include only appropriate order data: order number, product/variant labels, quantities, unit/line prices, known subtotal/discount, and an explicit note if shipping or final total is pending. Do not put unnecessary personal or sensitive data in the URL. Validate URL length and avoid logging full message URLs if they contain customer data.

---

## 8. Inventory Concurrency and 24-Hour Reservation Expiry

This is a critical correctness boundary.

- The default reservation window is 24 hours after order creation.
- The reservation expiry timestamp must be generated by the backend/server, not trusted from the client.
- Stock reservation must be atomic and safe under concurrent requests. Use a transaction and suitable row locking, atomic conditional update, or an equivalent proven strategy.
- A reservation must have a single terminal outcome. An `ACTIVE` reservation can be released or consumed once; later calls must be idempotent and must not return stock a second time.
- A scheduled backend job should find expired, still-pending orders/reservations and release eligible reservations transactionally.
- Cancellation and expiration must share the same guarded release logic to avoid double restoration.
- If the scheduler runs twice or multiple application instances execute the job, processing must remain safe. Use row locking/claiming or a concurrency-safe update condition.
- If a reservation is no longer eligible because the order was confirmed or another state transition won the race, do not release it.
- Keep reservation and stock movement history for troubleshooting.
- Add integration tests for simultaneous attempts to reserve the last units, duplicate cancellation, expiration racing with confirmation, and repeated scheduler runs.
- Configure the expiry window centrally; changing the value affects new orders unless a deliberate migration policy says otherwise.

The application must define the exact point at which reserved stock becomes sold/consumed, and how to restore it if a confirmed order is later cancelled before shipment. This transition must be explicit and tested before production.

---

## 9. Security Specification

### 9.1 Authentication and sessions

- Use Spring Security as the security enforcement point.
- Support email/password sign-in for the administrator.
- Support Google sign-in only for the approved admin identity/account link.
- Verify Google identity evidence on the server using a maintained, correct OIDC/token-validation integration. Validate issuer, audience/client ID, signature, expiry, and subject; do not trust a client-posted email alone.
- Google login must not create or elevate arbitrary users to the `ADMIN` role. The verified Google subject/email must be linked to a pre-provisioned administrator according to the approved account bootstrap policy.
- Use a server-managed session and cookie-based authentication, with `HttpOnly`; set `Secure` in production and select an appropriate `SameSite` setting. Apply CSRF protection to state-changing cookie-authenticated requests.
- Do not store session tokens, access tokens, refresh tokens, or other credentials in `localStorage`.
- Regenerate the session identifier after successful authentication and invalidate the session on logout.
- Apply appropriate session expiry/idle timeout and secure cookie settings.
- Prevent session fixation and ensure CORS is restricted to the known frontend origin(s); do not use wildcard origins with credentialed requests.

### 9.2 Admin authorization

- The backend must check the role/authority on every admin operation; hiding frontend routes/buttons is not security.
- Use method-level authorization where appropriate as a second layer in addition to route-level rules.
- Public endpoints should be allowlisted explicitly; admin APIs must be denied by default.
- Do not include a public admin signup endpoint.
- Bootstrap the first admin through a one-time secure setup process or deployment secret-backed command. Disable/remove the bootstrap path after use, and never ship default credentials.
- Prepare for future roles (for example `ADMIN`, `PRODUCT_MANAGER`, `ORDER_MANAGER`) but implement only the initial admin authority unless extra accounts are approved.

### 9.3 Passwords and recovery

- Store only strong password hashes using a maintained `PasswordEncoder` appropriate for Spring Security.
- Never log passwords or return credential fields in API responses.
- Rate-limit login and recovery endpoints; use generic error messages that do not expose whether an account exists.
- Password reset, once email delivery is configured, must use a cryptographically random, single-use, expiring token. Store only a secure hash of the reset token where practical, invalidate it after use, and avoid putting tokens in logs or analytics.
- Provide a documented break-glass recovery process requiring controlled server access. It must not be a public endpoint that bypasses authentication.
- Require re-authentication or another protection for particularly sensitive administrative actions if justified.

### 9.4 Input, API, and browser security

- Use Bean Validation on request DTOs and repeat all critical validation server-side.
- Use parameterised ORM/repository operations; do not build SQL from untrusted strings.
- Avoid unsafe HTML rendering and dangerous deserialisation patterns.
- Return a consistent, sanitised error schema without stack traces or internal host/database details.
- Add rate limiting for authentication, guest order lookup, order submission, image upload, and other abuse-prone endpoints. Choose thresholds through configuration and testing.
- Guest order lookup must not expose full address, detailed notes, or other sensitive data. Apply a generic failure response, rate limits, and a careful matching strategy for order number plus phone number; consider an additional secret/OTP if threat review shows the two values are insufficient.
- Protect state-changing cookie-authenticated endpoints against CSRF.
- Validate allowed frontend origins and configure CORS with credentials deliberately.
- Use HTTPS in production.
- Keep secrets in deployment environment/secret management, never in Git, frontend bundles, or `NEXT_PUBLIC_*` variables.
- Redact personal data from application logs where not operationally required.

### 9.5 Image upload security

- Allow uploads only to authorised administrators.
- Enforce file size, allowed image formats, and image content/signature checks; do not trust filename or browser MIME type alone.
- Configure transformation/delivery presets on the server where possible.
- Keep Cloudinary API secrets on the backend. Use short-lived/restricted upload credentials if a direct-to-provider browser upload design is eventually chosen.
- Verify provider responses and store only safe metadata. Use random/generated storage identifiers rather than user-controlled paths.
- Limit upload rate and handle failed uploads/cleanup without leaving corrupt product references.

### 9.6 Audit log and sensitive-data rules

Never log or expose:

- Plaintext passwords or password reset tokens.
- Session IDs, authentication tokens, Google credentials, API secrets, or database credentials.
- Full payment credentials (no online payments exist in v1).
- More customer personal data than required to diagnose an issue.

Audit entries should record who did what, to which record, when, and a redacted change summary. Normal API users must not be able to edit/delete audit entries.

---

## 10. Google Sign-In Requirements

Google is an additional administrator authentication method, not a public administrator-registration system.

- Configure an approved Google OAuth/OIDC client for the actual production and development origins.
- Keep client identifiers in appropriate environment configuration; keep private credentials on the server.
- Validate the Google credential/token server-side and ensure the intended audience/client ID matches the configured application.
- Resolve the authenticated identity against the pre-provisioned admin account/link.
- If the identity is not approved, deny access and do not create an admin account or change any existing account's role/enabled state.
- Establish the server session only after identity verification and admin authorization succeed.
- Add tests for wrong audience, expired/invalid tokens, unapproved Google users, disabled admin accounts, and successful approved login.
- Document local callback/origin configuration separately from production configuration.

---

## 11. REST API Contract Outline

The endpoints below are a proposed contract to refine during implementation. They must not be described as already implemented until code and tests verify them. Use a consistent `/api/v1` prefix unless the team deliberately adopts another versioning strategy before coding.

### Public catalog

```text
GET    /api/v1/products
GET    /api/v1/products/{slug}
GET    /api/v1/categories
GET    /api/v1/categories/{slug}
```

Support query parameters for search/category/sort/page only to the extent required by the v1 UI. Validate sort keys and pagination limits. Return localised product/category content based on a validated locale (`ar` or `en`) or a documented request convention.

### Guest orders and tracking

```text
POST   /api/v1/orders
GET    /api/v1/orders/lookup
```

Order creation input should contain sellable product/variant IDs and quantities plus customer name, phone, governorate, city/area, detailed address, and optional notes. It must not accept client-authoritative prices, discounts, shipping amount, stock, or total. The lookup endpoint must require the documented order-number + phone verification and return only limited, non-sensitive status information.

### Admin authentication

```text
POST   /api/v1/admin/auth/login
POST   /api/v1/admin/auth/google
POST   /api/v1/admin/auth/logout
GET    /api/v1/admin/auth/session
POST   /api/v1/admin/auth/forgot-password
POST   /api/v1/admin/auth/reset-password
```

The exact Google flow (credential ID token submission vs server redirect/callback) must be selected and implemented consistently. Password-reset endpoints remain disabled until a mail provider is configured and tested; do not expose a non-working UI flow as if it were operational.

### Admin catalog and media

```text
POST   /api/v1/admin/products
PUT    /api/v1/admin/products/{id}
POST   /api/v1/admin/products/{id}/publish
POST   /api/v1/admin/products/{id}/archive
POST   /api/v1/admin/products/{id}/variants
PUT    /api/v1/admin/variants/{id}
POST   /api/v1/admin/categories
PUT    /api/v1/admin/categories/{id}
POST   /api/v1/admin/categories/{id}/archive
POST   /api/v1/admin/media/images
```

### Admin orders, shipping and settings

```text
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/{id}
POST   /api/v1/admin/orders/{id}/confirm
POST   /api/v1/admin/orders/{id}/prepare
POST   /api/v1/admin/orders/{id}/ship
POST   /api/v1/admin/orders/{id}/deliver
POST   /api/v1/admin/orders/{id}/delivery-failed
POST   /api/v1/admin/orders/{id}/cancel
GET    /api/v1/admin/shipping-rates
PUT    /api/v1/admin/shipping-rates/{governorateId}
GET    /api/v1/admin/notifications
GET    /api/v1/admin/audit-log
GET    /api/v1/admin/history/prices
GET    /api/v1/admin/history/inventory
```

Avoid a general unrestricted `PATCH status` endpoint if it would allow invalid state transitions. Prefer use-case endpoints or a validated state transition service.

### API design requirements

- Use DTOs and validation; never serialise JPA entities directly.
- Use consistent HTTP status codes and error codes.
- Do not include internal exception text in responses.
- Support idempotency or duplicate-submit protection for order creation where practical, especially around network retries.
- Paginate admin order and audit/history lists.
- Restrict filter/sort fields to a known allowlist.
- Document the real contract with OpenAPI after implementation stabilises.

---

## 12. Error Response and Observability

Use a consistent safe error format, for example:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Please check the submitted information.",
  "fieldErrors": {
    "phone": "Enter a valid phone number."
  },
  "traceId": "server-generated-correlation-id"
}
```

This is a proposed shape; refine it consistently across the frontend and backend. Do not return stack traces, SQL messages, credentials, or internal infrastructure details.

- Log unexpected server failures with a correlation/trace ID.
- Redact phone/address/notes unless needed and approved for operational logs.
- Add health/readiness endpoints appropriate to the deployment platform without exposing environment secrets.
- Keep production logs structured and avoid logging full WhatsApp URLs that contain customer data.

---

## 13. Database Integrity, Migrations, and Transaction Rules

- PostgreSQL is the source of truth for catalog, orders, stock, reservations, shipping rates, account/role data, and audit/history records.
- Use Flyway versioned migrations for schema changes and repeatable migrations only for appropriate repeatable database objects.
- Never edit an already-applied versioned migration in a shared/production environment; add a new migration instead.
- Use foreign keys and unique constraints for SKU, slug, locale-per-entity, order number, normalised admin email, and other true uniqueness rules.
- Use check constraints where helpful for non-negative amounts/quantities and valid numeric ranges.
- Index columns used for product listing, order lookup, reservation expiry processing, foreign keys where appropriate, and admin filtering. Validate index choices against actual queries.
- Keep transaction boundaries explicit. Order creation, reservation creation, order item snapshot creation, and stock reservation must not leave partial state.
- Do not hold database transactions open while waiting on Cloudinary, email, or a user/browser action. External side effects require careful ordering and compensating cleanup if needed.
- Avoid database cascades that delete historical order snapshots or audit records.
- Test migrations against a clean database and a representative upgrade path before release.

---

## 14. Automated Jobs

The v1 backend requires a safe reservation-expiry job.

- Select orders/reservations that are expired and still eligible for release.
- Process them in a transaction using concurrency-safe locking/conditional updates.
- Release inventory once, mark reservation state, and record a stock movement/audit event as appropriate.
- Re-running the same job must be harmless (idempotent).
- Do not expire orders that are confirmed or already moved to an incompatible state.
- Choose the execution interval (for example, every few minutes) during implementation based on operational needs; 24 hours is the reservation lifetime, not necessarily the scheduler interval.
- Add tests for overlapping job execution and cancellation/confirmation races.

Do not add a message broker or distributed scheduler in the modular monolith unless deployment topology requires it.

---

## 15. Image Storage Service

Use a provider-neutral interface such as:

```text
StorageService
  ├── uploadImage(file, metadata)
  ├── deleteOrArchiveImage(providerAssetId)  # only when safe and required
  └── buildDeliveryUrl(asset, transformationOptions)
```

Cloudinary is the chosen starting provider, subject to service account/configuration setup. Keep the concrete implementation separate from catalog services.

- Persist provider name, provider asset/public ID, secure delivery URL, format, dimensions, byte size, alt text if used, and display order.
- Upload should use bounded payload sizes, safe file-type inspection, and clear error handling.
- Ensure product image ordering can be managed by admin.
- Avoid deleting a shared image asset while it is still referenced by a product or historical requirement.
- Use responsive image delivery and transformations where appropriate; do not assume the free quota will be sufficient forever. Monitor usage and review cost before launch.
- A future provider change should be possible by implementing another adapter and migrating asset metadata, not by rewriting product/domain logic.

---

## 16. Local Development and Configuration

### Docker Compose

Use Docker Compose for local PostgreSQL, with a persistent named volume. The Spring Boot app may run directly on the host for development or in a container; document one default workflow and support the other only if useful.

### Environment configuration

Provide `.env.example` with variable names and safe placeholder values only. Do not commit `.env`, production credentials, Cloudinary secrets, Google secrets, SMTP passwords, database passwords, or signing keys.

Expected configuration areas (final variable names should be aligned with actual code):

```text
SPRING_PROFILES_ACTIVE
DATABASE_URL / datasource URL
DATABASE_USERNAME
DATABASE_PASSWORD
APP_PUBLIC_BASE_URL
FRONTEND_ORIGINS
GOOGLE_CLIENT_ID
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
MAIL_HOST / MAIL_USER / MAIL_PASSWORD (only once configured)
ORDER_RESERVATION_HOURS=24
LOW_STOCK_THRESHOLD (configurable default)
```

Do not assume any listed integration credentials exist yet. Keep frontend-exposed environment variables separate from backend secrets.

### Profiles

- `local`/development profile: safe local configuration and local database.
- `test` profile: isolated test data/database; never point tests at production.
- `production` profile: HTTPS assumptions, secure cookies, strict CORS/origins, external secret configuration, migrations reviewed, and logs redacted.

Do not use automatic destructive schema generation in production. Flyway should own schema evolution.

---

## 17. Backup, Restore, and Recovery

- Target daily PostgreSQL backup and 14-day initial retention.
- Store encrypted backups separately from the primary database/system.
- First check managed PostgreSQL backup/PITR capabilities and costs. Avoid overlapping backup products without clear additional benefit.
- Define who can access/restore backups and protect backup credentials separately.
- Before launch, perform an actual restore into an isolated environment and validate product, translation, inventory, order, reservation, and audit/history consistency.
- Schedule restore drills periodically; a backup that has never been restored is not proven recoverable.
- Document the expected recovery point and recovery time with the chosen hosting provider before production launch. Do not promise exact RPO/RTO until tested and provisioned.
- Images stored in Cloudinary need their own account/asset recovery considerations; a PostgreSQL backup only saves image metadata, not the underlying image files.

---

## 18. Testing and Quality Gates

### Unit tests

- Price/discount calculation and rounding.
- SKU generation rules and collision handling.
- Product publication validation for both locales.
- Order line snapshot construction.
- Order-state transition rules.
- Shipping-fee pending/known calculation.
- Inventory reservation release/consume logic.
- Phone normalisation/validation.
- Input and error mapping.

### Integration tests

- Flyway migrations against PostgreSQL.
- Repository constraints, unique indexes, and foreign keys.
- Create product/category, add translations, publish, archive.
- Upload integration adapter contract using mocked provider or a dedicated test account; do not require production credentials for normal unit tests.
- Create guest order, save snapshots and reservation, return order number.
- Shipping rate unknown vs configured.
- Guest order lookup requires matching order number and phone and returns minimal data.
- Admin-only endpoints reject unauthenticated and non-admin requests.
- Session cookie, CSRF, logout, and CORS behavior.
- Google login allowlist and token validation cases.
- Password reset token expiry/single use once mail is wired.
- Audit and price/stock history generation.

### Concurrency and race tests

- Two orders competing for the last available unit.
- Duplicate cancellation requests.
- Reservation expiration racing with admin confirmation.
- Scheduler running more than once or concurrently.
- Duplicate order submission/retry after a timeout.

### Quality gates

Use the scripts actually present in the project. Verify, where applicable:

```text
[ ] Compile/build succeeds
[ ] Tests pass
[ ] Flyway migrations apply on a clean PostgreSQL database
[ ] Upgrade path tested on a representative existing database
[ ] Security authorization tests pass
[ ] No secrets are committed or exposed
[ ] No unverified business facts appear in responses
[ ] Order creation cannot oversell stock
[ ] Reservations release exactly once
[ ] Historical order totals/snapshots do not change after catalog edits
[ ] Arabic and English publication rules work
[ ] Image upload validates type/size and fails safely
[ ] Backup restore has been tested
[ ] Frontend/backend API contract has been checked together
```

Never claim checks passed if they have not been run.

---

## 19. Deployment Readiness

The deployment provider for the backend/database has not yet been selected. Before production release, make and document decisions about:

- Frontend hosting and public site URL.
- Spring Boot hosting/runtime and HTTPS termination.
- Managed PostgreSQL vs self-managed PostgreSQL.
- Database backup/PITR plan and region.
- Cloudinary account/usage plan.
- Google OAuth authorized origins/redirect URIs.
- Mail provider for password recovery.
- CORS allowlist and cookie domain/SameSite/Secure settings.
- Secret storage/rotation.
- Health checks, logging, monitoring, and alerting.
- Database migration procedure and rollback/forward-fix plan.
- Data retention and privacy/legal content approved by the owner.

Local development must not be presented as production deployment. Keep staging and production credentials/data separate. Do not enable the real admin login in a public production environment until the bootstrap process and allowlist have been tested.

---

## 20. Team Workflow for Three Collaborators

The initial team arrangement discussed is:

- Project owner: backend, database, API contracts, Spring Security, migrations, and backend tests.
- One collaborator: frontend and integration with the agreed API contract.
- Third collaborator: role to be agreed by the team; do not assume an assignment in this spec.

Recommended repository: one Git repository with `frontend/` and `backend/` directories, independently buildable and deployable.

- Work on feature branches; do not commit directly to `main` for routine feature work.
- Review changes before merging.
- Agree on DTO schemas, endpoint paths, locale behavior, order statuses, and error responses before implementing frontend/backend in parallel.
- Do not share production secrets in Git, screenshots, chat logs, or example files.
- Use `.env.example` for documented variable names only.
- Run the relevant test/build checks before merging.
- Keep migrations backward-compatible where practical; coordinate any schema/API breaking change with the frontend collaborator.

---

## 21. Items Still Requiring Owner/Team Decisions

These items were not fully settled in the discussion and must remain explicit decisions rather than invented values:

1. Exact Spring Boot, Java, PostgreSQL, Node/Next.js, and library versions. Select compatible supported versions at implementation start and pin them.
2. Final application base package and exact module/class names.
3. The authoritative Egyptian governorate list, spellings, and seeded slugs.
4. Actual product catalog, variants, prices, inventory quantities, photos, and product-specific technical details.
5. Exact low-stock threshold default and whether it can vary by SKU/variant.
6. Exact order-number format (must be unique and must not expose sequential database IDs unnecessarily).
7. Exact set of order statuses and allowed transition matrix; suggested states in this document must be refined and tested before coding.
8. Exact rule for when a reserved unit becomes consumed/sold and stock restoration if a confirmed order is cancelled before shipping.
9. Whether guest order tracking additionally requires a one-time code or secret link after threat review; order number + phone must be rate-limited and data exposure kept minimal.
10. Cloudinary account and plan; Google OAuth client setup; mail provider and configuration.
11. Backend, database, and frontend production hosting provider and deployment region.
12. Carrier name, tracking integration (if any), shipping prices per governorate, delivery times, and returns/warranty/legal policies.
13. The final approved privacy notice describing collection/use of customer name, phone, address, notes, and order records.
14. Whether the optional nearby-landmark field will be included.
15. Backup retention and recovery targets after comparing managed database capabilities and costs.
16. Who will fulfil the third collaborator role.

---

## 22. Implementation Order

Recommended engineering sequence:

1. Create repository skeleton, backend build configuration, Docker Compose, and local PostgreSQL.
2. Add Flyway baseline migrations and confirm clean startup.
3. Implement global error handling, configuration, health checks, DTO validation, and persistence conventions.
4. Implement admin bootstrap, Spring Security sessions, CSRF/CORS, password login, and Google allowlist flow.
5. Implement category/product/translation/variant/SKU models and admin APIs.
6. Implement secure image upload integration and store media metadata.
7. Implement inventory and concurrency-safe reservation operations.
8. Implement guest order creation, item snapshots, shipping-fee-pending behavior, and WhatsApp handoff response.
9. Implement 24-hour reservation expiry, idempotent release, admin order transitions, and order history.
10. Implement governorate shipping rate management and shipping/tracking fields.
11. Implement guest order lookup, rate limits, and minimal response fields.
12. Implement audit log, price/stock history, low-stock alerts, and admin dashboard notification API.
13. Implement password recovery once email provider setup is available.
14. Add automated tests, run concurrency/security tests, and test database backup restoration.
15. Integrate with the frontend against a reviewed API contract.
16. Configure staging, deployment secrets, HTTPS, backups, monitoring, and production smoke tests.

Do not skip security or data-integrity testing to accelerate the UI integration.

---

## 23. Definition of Done

The backend is not ready for production merely because it compiles. Before calling the v1 backend complete, the team must verify:

- Admin login works through approved email/password and Google paths.
- No arbitrary Google account can obtain admin access.
- Unauthenticated/non-admin callers cannot access admin APIs.
- CSRF/session/CORS settings are correct for the actual deployment.
- Product/category publication requires both Arabic and English data.
- SKU uniqueness is enforced by the database, including concurrent creation.
- All customer-provided prices/totals are ignored as authoritative; server prices are used.
- Orders are saved before the WhatsApp handoff is shown.
- Unknown shipping fees never appear as a fabricated value or a confirmed final total.
- Stock reservations cannot oversell inventory and expire/release exactly once.
- Historic order item values remain stable after catalog edits/archives.
- Guest order lookup is rate-limited and exposes only minimal information.
- Admin operations are audited and price/stock changes are recorded.
- Image upload is restricted, validated, and secrets stay server-side.
- Flyway works on clean and upgrade test databases.
- Automated tests, security tests, and restore drills have actually run and their outcomes are documented.
- Production hosting, credentials, Google OAuth, Cloudinary, email, shipping configuration, and approved legal content are configured before the relevant feature is represented as live.

---

## 24. Governing Principle

> **Build the simplest reliable system that preserves customer data, protects administrator access, prevents inventory/price inconsistencies, and can grow without a rewrite.**

VARELLION must prioritize security, data correctness, clear customer communication, and maintainable code over unnecessary technical complexity. Do not invent business facts, claim external integrations are live before configuration/testing, or sacrifice order and inventory integrity for convenience.
