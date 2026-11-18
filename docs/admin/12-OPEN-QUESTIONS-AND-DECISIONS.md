# VARELLION Admin Architecture — Open Questions, Decisions & Architectural Log

> **Document Version:** 2.0.0  
> **Status:** PENDING STAKEHOLDER SIGN-OFF  
> **Target System:** Spring Boot 3.3.4 / Next.js 15.2.1 / PostgreSQL 17.11  

---

## 1. Quality Control & Cross-Check Matrix

Prior to finalizing this architectural planning suite, an exhaustive cross-check was performed against the active VARELLION codebase:

| Verification Dimension | Check Description | Result & Evidence |
| :--- | :--- | :--- |
| **Endpoint Collision** | Verify proposed endpoints do not collide with existing controllers. | **PASSED:** Existing admin endpoints (`GET /api/admin/orders`, `GET /api/admin/orders/{orderNumber}`, `PUT /api/admin/orders/{orderNumber}/status`) are preserved 100% without path alteration. All 65 new endpoints use unique, non-overlapping resource paths under `/api/admin/*`. |
| **DTO Field Alignment** | Verify proposed DTOs match existing domain entity names and types. | **PASSED:** Product fields (`price`, `costPrice`, `stockQuantity`, `reservedQuantity`, `sku`, `nameAr`, `nameEn`), Category fields (`slug`, `nameAr`, `nameEn`), and Order fields (`orderNumber`, `subtotal`, `shippingFee`, `totalAmount`, `orderStatus`) match existing entity attributes exactly. |
| **Database Schema Fit** | Verify proposed queries and foreign keys align with migrations `V1`–`V13`. | **PASSED:** All new tables reference `public.users(id)` (BIGINT) and `public.customers(user_id)` (UUID). No invalid legacy references to `auth.users` exist. |
| **Permission Uniformity** | Verify all 68 endpoints have assigned permission authorities. | **PASSED:** Complete 43-permission matrix covers all controller methods with `@PreAuthorize("hasAuthority('...')")`. |
| **Contract Consistency** | Verify all requests and responses adhere to standard envelopes. | **PASSED:** All success responses wrap data in `ApiResponse<T>`; all error responses wrap failures in `ErrorResponse`. |
| **Frontend Drift Check** | Verify Next.js integration guide matches actual frontend types and services. | **PASSED:** Reuses `Order`, `OrderStatus`, and `ApiResponse` types from `frontend/src/types/index.ts` and `frontend/src/services/adminOrders.ts`. |

---

## 2. Unresolved Business Decisions Requiring Human Input

While the technical architecture is fully defined and ready for execution, the following business decisions require explicit sign-off from human product owners and commercial stakeholders:

---

### Decision 01: Coupon Stacking & Discount Priority Policy
* **Context:** Customers in Egypt frequently seek promotional discounts during seasonal campaigns. If a product or category is already on sale, or if the order qualifies for Free Shipping ($\ge 2,500$ EGP), can a promotional voucher code also be applied?
* **Options:**
  - **Option A (Strict — No Stacking):** Coupons cannot be combined with free shipping or discounted items. If a coupon is applied, free shipping is disabled unless the coupon explicitly includes it.
  - **Option B (Layered — Recommended):** Coupons apply to the subtotal first. If the resulting subtotal remains $\ge 2,500$ EGP, Free Shipping is granted automatically.
  - **Option C (Free Stacking):** Any active coupon can be combined with any offer without restrictions.
* **Architectural Recommendation:** **Option B.** It preserves customer goodwill and avoids unexpected cart friction while safeguarding profitability via minimum subtotal constraints (`min_subtotal`).

---

### Decision 02: Order Address & Recipient Phone Modification Window
* **Context:** In Egyptian e-commerce, customers frequently call after placing an order to correct delivery addresses, specify landmarks, or update recipient phone numbers.
* **Options:**
  - **Option A (Narrow Window):** Modifications permitted ONLY while order is in `PENDING_CUSTOMER_CONFIRMATION`.
  - **Option B (Operational Window — Recommended):** Modifications permitted while order is in `PENDING_CUSTOMER_CONFIRMATION` or `CONFIRMED`. Blocked once order enters `PREPARING` or `SHIPPED`.
  - **Option C (Courier Window):** Modifications permitted even in `PREPARING` until physical courier handover (`SHIPPED`).
* **Architectural Recommendation:** **Option B.** Once an order enters `PREPARING`, shipping waybills and courier dispatch manifests are generated. Allowing address alterations after that stage risks packages being misrouted or dispatched with conflicting labels.

---

### Decision 03: Product Deletion vs. Compulsory Soft-Deletion / Archival
* **Context:** When a product is discontinued, administrators may attempt to delete it. However, if that product has been ordered in the past, hard-deleting the row from `public.products` violates foreign key constraints on `public.order_items` or breaks historical reporting.
* **Options:**
  - **Option A (Strict Soft-Delete Only — Recommended):** Products are never permanently deleted from the database. The delete action sets `is_active = false`. Discontinued products are hidden from the storefront but preserved in the database for accounting.
  - **Option B (Conditional Hard-Delete):** If `COUNT(order_items WHERE product_id = :id) == 0`, allow physical deletion. If ordered, enforce soft-delete (`is_active = false`).
  - **Option C (Cascade with Snapshot Disconnect):** Disconnect `order_items.product_id` by setting to NULL, then hard-delete the product.
* **Architectural Recommendation:** **Option B.** It allows cleaning up mistake entries or drafts that were never purchased, while strictly protecting historical order integrity.

---

### Decision 04: Administrative Staff Onboarding Workflow
* **Context:** How should new operational staff (order fulfillment managers, support agents) receive their credentials?
* **Options:**
  - **Option A (Super Admin Direct Creation — Recommended for Phase 1):** `SUPER_ADMIN` creates the user account directly via `POST /api/admin/users`, setting a temporary secure password, which the user changes upon first login.
  - **Option B (Email Magic Invitation):** `SUPER_ADMIN` enters the staff member's email; the backend generates a secure time-limited token and sends an invitation email.
  - **Option C (Google OAuth Allowlist Only):** Staff accounts must sign in with Google; their role is determined by an admin-managed database allowlist.
* **Architectural Recommendation:** **Option A.** The backend does not currently have an active transactional outbound email gateway integrated (e.g. SendGrid / SES). Option A provides immediate operational capability without adding an external third-party email service dependency.

---

### Decision 05: Third-Party Shipping Carrier Integration Strategy
* **Context:** Currently, courier dispatch manifests are exported via CSV for manual handover to local Egyptian logistics carriers (e.g. Bosta, Aramex, Mylerz).
* **Options:**
  - **Option A (CSV Manifest Export — Recommended for Current Scope):** Operations staff export filtered orders to CSV/Excel and upload them to the carrier portal.
  - **Option B (Direct Carrier API Webhooks):** Implement direct REST integrations with Bosta/Aramex APIs to generate air waybills (AWBs) and receive automated tracking webhooks.
* **Architectural Recommendation:** **Option A for Phase 1–5, Option B as a Future Phase.** Beginning with CSV manifest export provides immediate compatibility with all Egyptian courier networks without coupling the core application to proprietary third-party carrier APIs.

---

## 3. Architectural Decision Log (ADR Summary)

| Decision ID | Title | Status | Primary Rationale |
| :--- | :--- | :---: | :--- |
| **ADR-ADMIN-01** | **Multi-Role RBAC with 43 Authorities** | **APPROVED** | Replaces brittle binary role string (`ROLE_ADMIN`) with normalized roles and fine-grained method security (`@PreAuthorize`). |
| **ADR-ADMIN-02** | **Append-Only Immutable Audit Logging** | **APPROVED** | Mandates that all administrative mutations record actor ID, client IP, action, and JSON state diff in `public.admin_audit_logs`. |
| **ADR-ADMIN-03** | **Dynamic 27-Governorates Shipping Engine** | **APPROVED** | Moves hardcoded rates from `OrderService.java` to database tables (`shipping_zones`) seeded with live rates (50, 60, 65, 75, 85 EGP). |
| **ADR-ADMIN-04** | **Optimistic Locking on Catalog Entities** | **APPROVED** | Adds `@Version Long version` to `Product` and `Category` entities to eliminate lost updates during concurrent admin edits. |
| **ADR-ADMIN-05** | **Deadlock-Free Ascending Pessimistic Locking** | **APPROVED** | Mandates sorting `productId`s ascending before acquiring `@Lock(LockModeType.PESSIMISTIC_WRITE)` during multi-item inventory transactions. |
| **ADR-ADMIN-06** | **Uniform Response & Error Envelopes** | **APPROVED** | Preserves existing `ApiResponse<T>` and `ErrorResponse` structures across all 68 admin endpoints to prevent frontend serialization drift. |

---

## 4. Conclusion & Next Steps

All architectural designs, database impact analyses, security matrices, and API contracts are finalized, documented, and cross-referenced. 

**Execution is halted in accordance with RULE 2 (Strict Project Integrity).** Upon human stakeholder sign-off and selection of preferences for the open questions above, implementation can begin immediately with **Phase 1 of the Implementation Roadmap**.
