# VARELLION Admin Architecture — Reference Analysis & Inventory

> **Document Version:** 2.0.0  
> **Status:** APPROVED SPECIFICATION  
> **Date:** November 2026  
> **Scope:** Comprehensive audit of repository documentation, architectural records, reference projects, and contradiction reconciliation.  

---

## 1. Reference Discovery & Evidence Policy

In accordance with **RULE 1 (Research Before Design)**, all project references across documentation, codebases, migrations, design guides, and external prototypes were surveyed and inspected.

### Evidence Hierarchy & Reconciliation Rules:
1. **Running Implementation & Schema Constraints are Supreme:** When written documentation conflicts with production Java code or active PostgreSQL database constraints, the running implementation is treated as ground truth.
2. **Explicit Contradiction Logging:** No contradiction between documentation and source code is silently resolved or discarded; every discrepancy is explicitly documented in Section 3.
3. **Reference Classification:** Every document is classified as **VERIFIED (Active Ground Truth)**, **HISTORICAL / DOCUMENTED CLAIM (Informational)**, or **EXTERNAL REFERENCE (Inspirational / Non-Binding)**.

---

## 2. Exhaustive Reference Inventory

| Reference Name | Location | Purpose & Primary Scope | How It Affects the Admin Design |
| :--- | :--- | :--- | :--- |
| **Project Context & System Architecture** | `PROJECT_CONTEXT.md` | Authoritative single-file technical knowledge base (Nov 13, 2026). Details full stack, business rules, API reference, flows, security hardening, and known debt. | **Primary Baseline:** Defines response envelopes (`ApiResponse`, `ErrorResponse`), 27-governorate shipping logic, order state machine, token lifecycles, and 10 non-negotiable AI agent rules. |
| **Database Schema Reference** | `docs/database/DATABASE_SCHEMA.md` | Documentation of database tables, constraints, check conditions, order states, and inventory reservation rules. | Provides historical reference for migrations `V1`–`V5`. Highlighted critical documentation drift against migrations `V6`–`V13`. |
| **Flyway Migrations (Source of Truth)** | `backend/src/main/resources/db/migration/` (`V1`–`V13`) | Authoritative DDL scripts defining tables, triggers, indexes, and foreign keys. | Enforces existing primary keys (UUID for products/categories/orders, BIGINT for users), RLS policies, check constraints (`reserved_quantity <= stock_quantity`), and `@Version` column. |
| **Product Requirements Document** | `docs/product-requirements.md` | Initial product specification outlining product categories, customer value propositions, and administrative feature lists. | Establishes the 4 core administrative requirements: Executive Dashboard, Product Catalog Management, Order Processing Pipeline, Customer Directory. |
| **Architecture Decision Records** | `docs/architecture-decisions.md` | ADR-001 through ADR-005: Next.js App Router unification, styling design tokens, API client, optimistic cart, and 4-tier shipping. | Informs Next.js integration strategy (unified repository with `/admin` route group) and highlights shipping tier discrepancy with backend code. |
| **Frontend Integration Plan** | `docs/superpowers/plans/2026-10-30-frontend-api-integration.md` | Historical implementation plan for wiring Next.js frontend to Spring Boot endpoints. | Establishes client-side error handling conventions, auth hydration (`/api/auth/refresh`), and API client architecture (`requestApi`). |
| **Order Creation & Checkout Gate Plan** | `docs/superpowers/plans/2026-11-03-order-creation-and-checkout-gate.md` | Specification for checkout, pessimistic locking, idempotency, and cart clearance. | Guides admin order cancellation and stock restoration logic, ensuring symmetry between order creation and cancellation. |
| **Order Tracking Backend Plan** | `docs/superpowers/plans/2026-11-02-order-tracking-backend.md` | Design of guest order tracking via order number and normalized Egyptian phone number. | Informs administrative order search: admins must be able to search orders using the same normalized Egyptian phone numbers (`01[0125][0-9]{8}`). |
| **Security & Threat Model Audit** | `docs/audits/SECURITY_AUDIT.md` | OWASP ASVS Level 2 audit analyzing authentication, JWT lifecycles, IDOR, SSRF, and credential exposure. | Establishes requirements for RBAC: replacing binary role checks with granular authorities and introducing append-only admin audit logs. |
| **Reference Audit** | `docs/audits/REFERENCE_AUDIT.md` | Prior audit (Nov 4, 2026) evaluating documentation integrity and project artifacts. | Reaffirms evidence policy: distinguish verified code from historical claims; never assume documentation equals working code. |
| **Coding Conventions Guide** | `docs/development/CODING_CONVENTIONS.md` | Java layering rules, DTO naming, controller annotations, exception hierarchy, and validation patterns. | Dictates naming and package structure for new Admin controllers, services, DTOs, and repositories (e.g. `com.varellion.store.admin.*`). |
| **Backend Testing Inventory & Execution** | `docs/testing/BACKEND_TEST_INVENTORY.md` & `TEST_EXECUTION_REPORT.md` | Claims regarding test suites, MockMvc fixtures, and profile setup. | Dictates testing patterns for admin modules: MockMvc with `@WithMockUser` and `@TestPropertySource(locations = "classpath:application-test.properties")`. |
| **Luxury Design System** | `DESIGN_SYSTEM.md` | Brand palette (Obsidian `#0E0F11`, Warm Ivory `#FAF9F6`, Brushed Gold `#C5A059`), typography (Tajawal/Cinzel), and accessibility rules. | Informs Admin UI frontend design: administrative screens must adhere to luxury design tokens while meeting WCAG 2.1 AA standards. |
| **Next.js Admin Dashboard Reference** | `_references/next-shadcn-dashboard-starter` | Reference template containing Shadcn UI components, data tables, RBAC nav hooks, and layout structures. | Serves as architectural benchmark for designing Next.js admin frontend components, table layouts, filters, and client-side route guards. |
| **Bruno API Collection** | `bruno/` | Automated API testing collection covering auth, profile, catalog, and orders. | Dictates API verification suites for all proposed admin endpoints. |

---

## 3. Discovered Contradictions & Reconciled Truths

During forensic analysis, several significant contradictions were uncovered between earlier documentation files and the active codebase. Each is analyzed below with its authoritative reconciliation:

### Contradiction 1: Database Migration State & User Account Decoupling
* **Documentation Claim (`docs/database/DATABASE_SCHEMA.md:4`):**
  - Asserts that only 5 migrations (`V1` to `V5`) exist.
  - States that `public.customers.user_id` is a foreign key referencing legacy Supabase `auth.users(id)`.
  - States that `public.order_status_history.actor_id` is a UUID referencing `auth.users(id)`.
* **Actual Source Code & Active Migrations:**
  - Active migrations extend from `V1` through `V13` in `backend/src/main/resources/db/migration/`.
  - Migration `V6` created internal `public.users` table with `id BIGSERIAL`.
  - Migration `V8` dropped the `auth.users` foreign key on `customers` and introduced `user_account_id BIGINT REFERENCES public.users(id)`.
  - Migration `V13` dropped the PostgreSQL trigger, converted `order_status_history.actor_id` from UUID to `BIGINT`, and added `FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL`.
* **Reconciliation Verdict:**
  - `DATABASE_SCHEMA.md` is outdated (written October 2026).
  - The live truth is **Migrations `V1`–`V13`**. All new admin user references, audit log actors, and customer linkages must use `BIGINT` referencing `public.users(id)`.

---

### Contradiction 2: Regional Shipping Tiers & Pricing Calculation
* **Documentation Claim (`docs/architecture-decisions.md:38-42` - ADR-005):**
  - Specifies 4 shipping zones:
    - Zone 1: Greater Cairo — 50 EGP
    - Zone 2: Alex, Delta & Canal — 65 EGP
    - Zone 3: Upper Egypt — 80 EGP
    - Zone 4: Frontier & Remote — 100 EGP
* **Actual Source Code (`OrderService.java:106-129`):**
  - Implements 5 distinct shipping zones:
    - Zone 1 (Cairo, Giza, Qalyubia): **50.00 EGP**
    - Zone 2 (Alexandria, Matrouh): **60.00 EGP**
    - Zone 3 (Delta & Canal): **65.00 EGP**
    - Zone 4 (Northern Upper Egypt - Fayoum, Beni Suef, Minya, Asyut): **75.00 EGP**
    - Zone 5 (Deep Upper Egypt & Frontiers - Sohag, Qena, Luxor, Aswan, Red Sea, Sinai, New Valley): **85.00 EGP**
    - Free Shipping Threshold: Subtotal $\ge$ **2,500.00 EGP**.
* **Reconciliation Verdict:**
  - `OrderService.java` is the authoritative production calculation currently executed during checkout.
  - The proposed Shipping Management module must seed its default `shipping_zones` table with the **exact 5 live rates (50, 60, 65, 75, 85 EGP)** to preserve pricing continuity for customers.

---

### Contradiction 3: Order Lifecycle Transitions
* **Documentation Claim (`docs/product-requirements.md:15`):**
  - Lists simplified order pipeline: `PENDING -> PROCESSING -> SHIPPED -> DELIVERED -> CANCELLED`.
* **Actual Source Code (`OrderStatus.java:1-54` & `Order.java:75`):**
  - Enforces 10 discrete enum states:
    `PENDING_CUSTOMER_CONFIRMATION`, `CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`, `DELIVERY_FAILED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`.
  - Governed by strict state machine transitions in `OrderStatus.canTransitionTo()`. Terminal states (`DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`) can never transition out.
* **Reconciliation Verdict:**
  - `OrderStatus.java` is the authoritative finite state machine (FSM).
  - All Admin Order APIs and frontend dialogs must operate against the 10 real enum states and enforce `canTransitionTo()`.

---

### Contradiction 4: Role-Based Access Control Scope
* **Documentation Claim (`_references/next-shadcn-dashboard-starter/docs/nav-rbac.md`):**
  - Describes client-side RBAC where navigation visibility is filtered using Clerk organization memberships and permissions.
* **Actual Backend Source Code:**
  - The backend uses custom Spring Security with JWT tokens issued from `public.users`.
  - No third-party auth provider (Clerk, Auth0) is used in production.
  - Navigation visibility in the frontend must be driven strictly by the authorities present in the backend JWT token.
* **Reconciliation Verdict:**
  - External reference documentation is informational only.
  - The VARELLION Admin RBAC model must be implemented natively in Spring Security and mapped directly to Next.js route guards.

---

## 4. Unresolved Business Decisions Requiring Stakeholder Approval

While technical architecture can be fully designed, the following business policy decisions must be decided by human stakeholders before final deployment:

1. **Coupon Stacking Policy:** Can promo coupons be combined with site-wide category sales, or is only a single promotional benefit applied per order?
2. **Order Modification Window:** Under what strict conditions may an administrator alter an order's delivery address or recipient phone number once the order is in `PREPARING` status?
3. **Product Deletion vs. Soft-Delete / Archival:** Should products with past order history be permanently deletable if soft-deleted, or strictly archived (`is_active = false`) to guarantee report integrity?
4. **Administrative User Provisioning:** Should Super Admins be able to invite new administrators via email link with a temporary password, or should invitations require manual database activation?

These questions are analyzed in full detail in [12-OPEN-QUESTIONS-AND-DECISIONS.md](./12-OPEN-QUESTIONS-AND-DECISIONS.md).
