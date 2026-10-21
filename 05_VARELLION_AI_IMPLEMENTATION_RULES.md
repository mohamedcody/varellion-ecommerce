# VARELLION Accessories — AI Implementation Rules

> **Document type:** AI coding-agent operating rules  
> **Project:** VARELLION Accessories  
> **Version:** 2.1.0  
> **Status:** Canonical  
> **Purpose:** Define how AI agents inspect, plan, implement, validate, and report changes safely.  
> **Primary frontend technical reference:** `04_VARELLION_FRONTEND_ARCHITECTURE.md`  
> **Backend, database, and security reference:** `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md`

---

## 1. Purpose

These rules govern how an AI coding agent works on VARELLION. They describe the **working method and safety gates** for changes; they are not a second frontend architecture document.

The objective is to make the smallest correct, understandable, maintainable change while protecting existing functionality and the approved business requirements.

Priorities:

1. Security and data integrity
2. Correctness and approved scope
3. User experience and accessibility
4. Maintainability
5. Performance
6. Scalability without premature complexity

Do not confuse more code with better engineering.

## 2. Canonical Project Documents

Inspect the relevant available documents before implementation. Use these exact canonical filenames:

1. `00_VARELLION_MASTER_BUILD_PROMPT.md` — overall scope and operating workflow.
2. `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md` — visual identity and design tokens.
3. `02_VARELLION_UI_UX_SPECIFICATION.md` — pages, interactions, and responsive UX.
4. `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md` — business/content rules and product conventions.
5. `04_VARELLION_FRONTEND_ARCHITECTURE.md` — routes, technologies, folder boundaries, domain types, and integration architecture.
6. `05_VARELLION_AI_IMPLEMENTATION_RULES.md` — AI working method and validation rules.
7. `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` — owner-approved catalog, contact information, purchase-mode decision, and approved website/legal copy.
8. `07_VARELLION_MARKETING_CONTENT_GUIDE.md` — optional social-media guidance; not a source of product facts.
9. `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` — backend architecture, API target contracts, database, security, inventory/order rules, operations, and backend acceptance criteria.

If a required file is missing, report the exact filename. Do not claim to have read it or silently replace it with an imagined version. Continue only with work that does not depend on its missing decisions.

### Document ownership

- File `00` controls overall scope and phase boundaries.
- File `01` controls visual design tokens and styling direction.
- File `02` controls page UX and interaction requirements.
- File `03` controls business/content rules and product-content conventions.
- File `04` controls technical architecture and canonical TypeScript domain types.
- File `05` controls the AI's editing, validation, and reporting process.
- File `06` controls owner-approved factual business data and commercial decisions.
- File `07` provides optional social-media guidance only.
- File `08` owns the backend target architecture, database/security requirements, backend API contracts, order/inventory behavior, and backend operational requirements.

Do not duplicate detailed rules owned by another file. Refer to that document instead. The frontend must follow `04`; backend behavior and security must follow `08`; cross-layer behavior must be aligned through an explicit, reviewed API contract rather than competing assumptions.

## 3. Resolve Conflicts Without Guessing

Use this approach when instructions or existing code conflict:

1. Current explicit owner approval controls business facts and commercial decisions.
2. File `00` controls project scope and phase boundaries.
3. Each supporting document controls its assigned domain above.
4. Existing code must be inspected to understand its behavior; it does not silently override approved specifications.
5. File `08` describes the intended backend target; it does not prove an endpoint or integration exists in the repository or deployment. Verify actual implementation separately.
6. When `04` and `08` differ, do not let the frontend invent or silently override backend behavior. Record the mismatch, identify which layer/document must change, and reconcile the owning documents before integrating that behavior.
7. If a material conflict remains unresolved, do not implement the affected behavior. Record its impact and request the smallest owner decision needed. Continue unrelated safe work where possible.

Never silently redefine the brand, pricing, delivery, return, warranty, payment, privacy, or legal terms.

## 4. Mandatory Pre-Edit Inspection

Before editing, inspect the actual repository state relevant to the task. Do not assume a codebase exists just because this is a coding project.

For a code task, inspect as applicable:

- Project tree and package manager.
- `package.json` and lockfile.
- Relevant routes, components, styles, and assets.
- Existing feature logic, hooks, services, types, and mappers.
- Environment configuration and scripts.
- Tests and known failures related to the affected area.
- Relevant project documents and existing references to affected symbols.
- If a backend exists: its actual routes, request/response DTOs, authentication/session model, CSRF/CORS configuration, migrations, tests, and current implementation status; do not assume file `08` is already implemented.
- Whether the task belongs to Milestone A (public storefront foundation) or Milestone B (functional commerce/backend release), as defined in file `00`.

Do not start by creating replacement files before checking for equivalent existing implementations.

## 5. Choose the Correct Project Mode

### Greenfield — no usable application code exists

- Follow the new-project baseline in file `04` and the approved scope in file `00`.
- Create only the files and routes required for the approved first release.
- Use only owner-approved factual content from file `06`.
- Do not scaffold empty folders or future features simply to make the tree appear complete.

### Brownfield — an application already exists

- Preserve the current package manager and working behavior.
- Map existing implementation to the target architecture before changing it.
- Prefer the smallest safe change over a broad rewrite.
- Do not upgrade frameworks, replace state management, change styling systems, or migrate localization as incidental cleanup.
- Explain significant deviations or migration risks before destructive changes.

Never treat an existing application as an empty project, or an empty planning folder as a broken application.

## 6. Plan Before Non-Trivial Changes

For a meaningful task, prepare a concise plan before editing. It should identify:

- Goal and observable expected behavior.
- Existing behavior and the root problem.
- Files likely to change.
- Dependencies or feature boundaries affected, including any frontend/backend contract changes.
- Whether the work is Milestone A (public storefront) or Milestone B (functional commerce), and which approved decisions/dependencies permit it to proceed.
- Main risks and regression areas.
- Validation commands or manual checks.

Keep the plan proportional to the task. Do not create an elaborate plan for a one-line safe correction.

## 7. Minimal Safe Change

- Change only what is needed to satisfy the request and approved specifications.
- Reuse existing components, services, helpers, and patterns when appropriate.
- Avoid unrelated refactors, formatting churn, mass renames, or dependency changes.
- Do not delete working behavior because another approach looks cleaner.
- Keep functional changes separate from visual redesign when practical.
- If scope must expand to fix the root cause, explain why and keep the expansion focused.

## 8. No Fabricated Business or Backend Behavior

Never invent or imply that the following are real:

- Products, prices, discounts, inventory, product specifications, compatibility, ratings, or reviews.
- Phone numbers, email addresses, WhatsApp numbers, opening hours, social links, or response times.
- Shipping costs/times, return terms, refund terms, warranty coverage, legal statements, or privacy commitments.
- API endpoints, response shapes, authentication behavior, payment status, or order persistence.
- Customer counts, sales figures, certifications, endorsements, guarantees, or other evidence claims.

Use owner-approved values from file `06` for commercial facts. File `06` is currently a required input to the specification set; if it is missing or a needed value is unapproved, do not fabricate it. Omit optional customer-facing content or use a natural, approved neutral state. Never show internal tokens such as `PRICE_TO_BE_DEFINED` to site visitors. Record the missing decision/data as a blocker for the affected release capability.

Examples in specifications are examples—not proof that a product, endpoint, policy, or feature exists.

## 9. API and Data Boundaries

Follow the frontend service, mapper, and domain boundaries defined in file `04`. For Milestone B, follow backend behavior and security requirements in file `08`, integrating only against the actual implemented backend contract.

- Do not place business API calls directly in presentational UI components.
- Do not treat a documented future endpoint as an implemented backend endpoint.
- Do not scatter mock data through JSX or component files.
- Keep mock implementations replaceable without rewriting the UI.
- Normalize API responses at an appropriate boundary instead of leaking transport-specific shapes throughout the application.
- Do not invent database fields or silently change a backend contract.
- Keep business calculations in one reusable, testable source of truth where needed.

## 10. Environment and Secrets

- Use the configuration conventions in file `04`.
- Never hardcode environment-specific hostnames or credentials in UI code.
- Never expose private secrets through `NEXT_PUBLIC_*`, browser bundles, committed files, logs, or user-visible errors.
- Use direct static `process.env.NEXT_PUBLIC_*` access where Next.js requires it for public variable replacement; do not replace it with computed-key access.
- Do not create or change production credentials. Document required environment variables and provide safe empty examples when needed.

## 11. Reuse, Types, and Dependencies

Before creating a new component, hook, type, service, or utility, search for an existing equivalent.

- Keep TypeScript strict and avoid `any`; use `unknown` at genuinely untyped boundaries and validate it.
- Do not silence errors with `@ts-ignore` or broad casts merely to make checks pass.
- Keep one canonical domain model per entity, as defined in file `04`.
- Follow file `01` for colors, typography, spacing, iconography, and visual variants.
- Avoid unnecessary libraries and duplicated state-management, icon, form, or localization solutions.
- Add a dependency only when it satisfies a clear requirement and is compatible with the installed stack.
- Avoid circular dependencies and preserve the documented dependency direction.

## 12. UI Implementation Rules

Use files `01` and `02` for visual and UX requirements, and file `04` for framework and route decisions.

For affected UI, verify as applicable:

- Semantic HTML and correct link/button semantics.
- Visible keyboard focus and usable keyboard behavior.
- Accessible form labels and actionable error messages.
- Appropriate contrast and meaningful alt text.
- Responsive behavior at the breakpoints specified in the design/architecture documents.
- RTL and LTR behavior for both Arabic and English.
- No horizontal overflow, clipped content, or layout shifts introduced by the change.
- Loading, success, empty, and error states for remote or stateful features.
- Reduced-motion support when adding motion.

Do not add ARIA where native semantics already suffice. Do not use clickable `div` elements when a button or link is appropriate.

## 13. E-Commerce, Backend, and Security Rules

Frontend logic improves usability; it is not a trusted security or transaction authority. Use file `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` as the backend target specification, but verify the actual repository implementation and deployment before claiming functionality exists.

### Milestone gates

- **Milestone A — public storefront foundation:** implement the approved public pages, localization, catalog discovery, product details, and owner-approved informational content. Do not imply that cart, checkout, order persistence, authentication, or admin functions work.
- **Milestone B — functional commerce release:** implement the relevant commerce and protected-administration features only after launch decisions and required facts in file `06` are approved, the frontend/backend contract is reviewed, and the actual backend behavior is implemented and tested.
- The target behavior in file `08` includes guest order creation and persistence, inventory reservations, COD workflow, WhatsApp handoff, shipping-fee handling, protected administration, product/category/order/stock management, guest order lookup, audit/history records, and operations safeguards. Treat these as requirements to verify, not as existing capabilities.
- If file `06` is absent or a purchase-model decision is unresolved, continue with independent Milestone A work and record the dependent commerce work as blocked. Do not guess the owner's launch choice.

### Transaction and security invariants

- The backend must validate authoritative product/variant prices, stock, discounts, order totals, payment status, and authorization. Client-supplied prices/totals are never authoritative.
- Stock competition, order creation, reservation expiry, cancellation, and reservation release must follow the transaction/concurrency rules in file `08`; never assume frontend checks can prevent overselling or duplicate orders.
- Never treat a click on a payment button or the opening of WhatsApp as proof of payment, message delivery, order acceptance, or fulfilment confirmation.
- Show an order number or “order recorded” state only after a real backend response confirms order persistence. Do not claim “confirmed for fulfilment” until the approved business/backend workflow reaches that state.
- If the shipping fee is unknown, preserve that status and do not present a fabricated or apparently final total.
- Do not add cart, checkout, COD, WhatsApp order submission, authentication, or admin functionality unless it is in the approved milestone and its actual dependencies exist.
- Hiding an admin action in the UI is not authorization; every protected operation requires backend authorization. Follow the real backend's session-cookie, CSRF, CORS, Google allowlist, bootstrap, and recovery rules in file `08`.
- Do not store sensitive data insecurely or render unsanitized HTML. Never log passwords, access tokens, session identifiers, private credentials, or other secrets.

### Frontend/backend contract gate

Before integrating a feature, agree and verify, as applicable:

- Endpoint and HTTP method, request/response DTOs, stable identifiers, and locale behavior.
- Server-authoritative price and inventory behavior; product/variant selection rules.
- Validation/error response shape, loading/empty/failure behavior, and safe user-visible messages.
- Shipping-fee-known versus pending behavior and order-total semantics.
- Order-state transitions, order-number handling, and duplicate-submit/retry/idempotency behavior supported by the actual backend.
- Authentication/session, authorization, CSRF, CORS, logout, and admin allowlist behavior for protected areas.

Do not invent endpoints or DTOs and represent them as implemented. Record the reviewed contract in the project documentation or generated API documentation. If the contract or a security/transaction decision is unknown, stop the affected integration, document the blocker, and continue unrelated safe work rather than improvising.

## 14. Routes and Localization

Follow the route and localization strategy owned by file `04`.

- Do not create a second localization mechanism alongside the approved one.
- Keep user-facing text translatable; do not scatter hardcoded Arabic/English conditionals across components when the approved message system applies.
- Preserve locale when switching language where an equivalent route exists; handle missing translated slugs gracefully.
- Use URL parameters for shareable catalog state such as search, category, sorting, and pagination when required by the UX specification.
- Do not add unapproved routes or expose future application/admin pages as if they were functional.

## 15. File Creation, Renaming, and Deletion

Before creating, renaming, or deleting a file:

1. Search imports, route usage, dynamic references, configuration, scripts, and tests.
2. Check whether the file is generated or managed by another tool.
3. Confirm the operation is necessary for the task.
4. Update direct references and verify affected imports/routes.

Never delete a file merely because it looks unused. If its use cannot be established safely, leave it in place and report the uncertainty.

## 16. Test and Validation Strategy

Use the commands that actually exist in `package.json` and the current repository. Depending on the change, run:

- TypeScript/type checking.
- Linting.
- Unit/component/integration tests.
- Production build.
- Relevant end-to-end or manual interaction checks.

For UI work, review the changed flow in mobile and desktop sizes and inspect focus, RTL/LTR, and relevant loading/empty/error states. For domain logic, test meaningful normal and edge cases.

Do not change valid tests, suppress lint/type rules, or remove checks merely to obtain a passing result. Fix the underlying issue whenever practical.

### Existing failures

If a check fails, determine whether it is related to the change or existed beforehand when a baseline is available. Report pre-existing failures separately from regressions. If the baseline was not tested, do not assert that a failure was pre-existing.

### Verification honesty

Never claim a test, command, route, API, payment, deployment, or production behavior was verified unless it was actually checked. If a command could not run, state why and mark that check as not verified.

## 17. Regression Review

After implementation, review adjacent behavior likely to be affected. Examples:

- Product card changes: listing, category pages, product details, price/availability display, and responsive layout.
- Navigation changes: locale switch, mobile menu, keyboard behavior, and all linked routes.
- Domain-type changes: mocks, mappers, services, product listing, and product details.
- Environment changes: build-time exposure, configuration consumers, and safe handling when a value is absent.

Do not assume a change is isolated simply because only one file was edited.

## 18. Change Report

After a meaningful task, provide a concise, factual summary with:

- **Implemented:** what behavior changed.
- **Files changed:** exact paths.
- **Validation run:** actual commands and outcomes.
- **Not verified:** important checks that could not be run.
- **Remaining decisions/risks:** only those still relevant.

Do not say “everything works” without evidence. Prefer precise statements such as “the UI was implemented; the real backend integration remains unverified because the API is not available.”

## 19. Approval and Escalation

Do not ask for approval for every small safe implementation detail. Make a minimal, reversible choice when the specification clearly permits it.

Pause and request the smallest necessary owner decision before:

- Destructive changes that could remove important behavior or data.
- Framework or major dependency migrations.
- Authentication, authorization, payment, or order-contract changes.
- Commercial decisions not recorded in file `06`.
- Changes to approved brand positioning, legal content, pricing, returns, warranty, or shipping policy.

When pausing, explain the conflict, why it blocks safe implementation, and the exact decision required. Continue unrelated safe work where possible.

## 20. Final Quality Gate

Before marking a meaningful task complete, confirm the applicable items:

- [ ] The requirement and acceptance criteria are understood.
- [ ] Relevant code and canonical documents were inspected.
- [ ] The correct Greenfield/Brownfield approach was used.
- [ ] No unrelated behavior was changed.
- [ ] Existing abstractions were reused where appropriate.
- [ ] No unsupported business facts or backend behavior were invented.
- [ ] No secrets or sensitive data were exposed.
- [ ] Domain types and service boundaries remain consistent across `04` and the reviewed backend contract in `08`.
- [ ] Loading, empty, error, and success behavior is handled where relevant.
- [ ] Responsive layout, accessibility, and RTL/LTR were considered where relevant.
- [ ] Relevant tests, lint, type checks, and build were run where available.
- [ ] Failures and unverified checks are reported honestly.
- [ ] Potential regressions were reviewed.
- [ ] The final report lists actual changes and remaining blockers.

A checkbox must not be marked complete unless the corresponding check was actually performed.

## 21. Source and Implementation Status

At the time of this specification revision, file `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` was not among the supplied project documents. Treat its absence as a real dependency, not permission to create approved business facts. The AI may prepare a clearly labelled template only if requested, but must not fill it with invented live products, prices, contact details, or legal promises.

Before describing a feature as complete, distinguish these states in reports:

- **Specified:** described in a planning document.
- **Implemented:** present in the codebase.
- **Tested:** relevant checks actually ran and passed.
- **Configured:** required external services/secrets/environment values are set safely.
- **Deployed:** running in the intended environment and verified there.

A feature must not be described as operational merely because it is specified, has a mock, compiles, or has a UI control.

## 22. Golden Rule

> **Understand the request. Inspect the real project. Follow the owning specification. Make the smallest safe change. Test honestly. Report clearly.**

The goal is not to generate more code. The goal is to leave VARELLION more correct, consistent, maintainable, and trustworthy than it was before.

---

## Document Status

```text
Document: VARELLION AI Implementation Rules
Version: 2.1.0
Brand: VARELLION Accessories
Primary Frontend Reference: 04_VARELLION_FRONTEND_ARCHITECTURE.md
Backend Reference: 08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md
Authority: AI editing, validation, cross-layer coordination, and reporting process
```

