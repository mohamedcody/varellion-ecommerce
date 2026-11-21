## 2026-10-31T13:20:31Z

Investigate reported issues in the VARELLION Ecommerce project, identify their exact root causes, select the most appropriate existing Agent Skills, and produce a comprehensive root-cause analysis report and remediation plan.

Working directory: /home/mohamed-saad/Desktop/BRAND
Integrity mode: demo
The team must NOT: assume reported issues are confirmed without independent code verification and reproduction, modify source code, create or modify migration files, modify database schemas, change API contracts, install dependencies, change frontend or backend architecture, apply automatic fixes, delete files, or commit and push changes.

## Requirements

### R1. Skill Discovery and Selection
Inspect available repository-level and global Agent Skills (without inventing non-existent skills), read their complete instructions, and select the most appropriate skill for each reported problem. For each issue, document in a structured table the issue, selected skill, skill path, selection rationale, and references used. If a skill is unavailable, explicitly report it.

### R2. Systematic Root Cause Investigation & Data Flow Tracing
Independently investigate, reproduce without modifying source files, and determine the exact root cause for the following 7 reported issues:
1. Backend-Driven Catalog Filtering mismatch in `frontend/src/app/products/page.tsx` vs `GET /api/products?category=...&q=...&sort=...`.
2. Potential N+1 queries in `Product.images` (`ProductService.java` and `CartService.java`).
3. Potential N+1 queries in `CategoryService.getActiveCategories()`.
4. CartContext concurrency race condition during rapid item additions.
5. API timeout behavior when a custom AbortSignal is supplied (`api.ts:105`).
6. Missing design system documentation in Git (inspect untracked design docs: `DESIGN_SYSTEM.md`, `REDESIGN_PLAN.md`, `UI_UX_AUDIT.md`, `UI_UX_PROGRESS.md`).
7. Live Paymob callback verification.
For frontend issues, trace: UI Component → State → Hooks → Service Layer → API Client → HTTP Request → Backend Response → State Update → UI Rendering.
For backend issues, trace: Controller → Service → Repository → Entity → DB Query → DTO Mapping → API Response.
For cart issues, inspect: request ordering, response ordering, optimistic updates, state replacement, and error recovery.
Distinguish symptoms from root causes, cite exact file paths and line numbers, and assess customer impact and severity.

### R3. Reference-Driven Solution Design and Implementation Plan
Compare actual behavior against project specifications, architecture documents, and tests (`specs/`, `references/`, `docs/`, `README.md`, `AGENTS.md`, `DESIGN_SYSTEM.md`, `REDESIGN_PLAN.md`, `UI_UX_AUDIT.md`, `UI_UX_PROGRESS.md`). Design technically valid, reference-driven solutions for each confirmed issue without modifying code. Formulate an actionable, prioritized implementation plan ranking tasks by security/financial correctness, critical functional bugs, data consistency, performance, and maintainability.

### R4. Final Investigation Report Delivery
Deliver the final comprehensive Markdown report directly to `docs/audits/VARELLION_ROOT_CAUSE_INVESTIGATION.md` (creating parent directories if needed). The report must include all specified sections:
- Section A: Executive Summary (overall project findings, confirmed/unconfirmed counts, critical risks).
- Section B: Skill Selection Report (name, path, selection rationale, instructions followed).
- Section C: Reference Analysis (specifications, source files, tests, conflicting or missing docs).
- Section D: Root Cause Analysis (severity, exact file and line, root cause, evidence, reproduction steps, customer impact, confidence).
- Section E: Proposed Fix (recommended solution, alternatives, trade-offs, potential regressions, required tests).
- Section F: Execution Priority (ranked by security, critical bugs, data consistency, performance, maintainability).
- Section G: Implementation Plan (independent tasks with objectives, affected files, selected skill, references, steps, acceptance criteria, test strategy).
- Section H: Final Recommendation (answering the 6 specific questions: exact root causes, first fix priority, skill assignment, guiding references, pre-merge tests, and additional discovered issues).

## Acceptance Criteria

### Investigation Integrity & Verification
- [ ] No source files, migrations, database schemas, API contracts, or dependencies are modified, deleted, or committed in the repository.
- [ ] The team discovers and runs existing safe read-only tests and build tools (e.g. Maven, npm) without altering repository state, supplemented by static analysis and code tracing.
- [ ] All 7 reported issues are independently investigated, traced through source code, and classified as confirmed or unconfirmed with concrete technical evidence.
- [ ] For every confirmed issue, the exact file path, method/function, line numbers, actual behavior, expected behavior, root cause, customer impact, severity, and confidence level are documented.
- [ ] Every selected skill is verified to exist in the environment with its path and instructions cited, and no non-existent skills are used.

### Report Completeness & Delivery
- [ ] The complete Markdown report is written directly to `docs/audits/VARELLION_ROOT_CAUSE_INVESTIGATION.md`.
- [ ] The report contains all required sections from A through H.
- [ ] Section H explicitly answers all 6 required final recommendation questions.
