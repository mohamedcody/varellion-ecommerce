# Project: VARELLION Ecommerce Root Cause Investigation & Remediation

## Architecture
- Root cause analysis and remediation architecture covering Frontend (Next.js/React), Backend (Spring Boot / Java), Database queries (JPA/Hibernate), Payment integration (Paymob HMAC/callback), and Design System / Repository governance.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Catalog Filtering Mismatch | frontend/src/app/products/page.tsx vs GET /api/products?category=...&q=...&sort=... | M1 | ORIGINAL_REQUEST R2.1 |
| 2 | Product.images N+1 Queries | Potential N+1 queries in Product.images (ProductService.java & CartService.java) | M1 | ORIGINAL_REQUEST R2.2 |
| 3 | CategoryService N+1 Queries | Potential N+1 queries in CategoryService.getActiveCategories() | M1 | ORIGINAL_REQUEST R2.3 |
| 4 | CartContext Concurrency Race Condition | Race condition during rapid item additions in CartContext | M1 | ORIGINAL_REQUEST R2.4 |
| 5 | API Timeout AbortSignal Behavior | Custom AbortSignal behavior at api.ts:105 | M1 | ORIGINAL_REQUEST R2.5 |
| 6 | Untracked Design System Docs | Untracked docs (DESIGN_SYSTEM.md, REDESIGN_PLAN.md, UI_UX_AUDIT.md, UI_UX_PROGRESS.md) | M1 | ORIGINAL_REQUEST R2.6 |
| 7 | Live Paymob Callback Verification | Verification of Paymob HMAC, transaction callbacks, status handling | M1 | ORIGINAL_REQUEST R2.7 |
| 8 | Skill Discovery & Selection | Discover and select real agent skills with paths and rationale | M1 | ORIGINAL_REQUEST R1 |
| 9 | Solution Design & Plan Formulation | Design reference-driven fixes & prioritized implementation plan | M2 | ORIGINAL_REQUEST R3 |
| 10 | Comprehensive Report Delivery | Deliver final report to docs/audits/VARELLION_ROOT_CAUSE_INVESTIGATION.md (Sec A-H) | M2 | ORIGINAL_REQUEST R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Deep Root-Cause Investigation & Skill Discovery | Survey and deep investigation of 7 reported issues, trace data flow, verify reproduction, discover real agent skills | none | DONE |
| M2 | Report Generation & Delivery | Synthesize findings into comprehensive report at docs/audits/VARELLION_ROOT_CAUSE_INVESTIGATION.md | M1 | DONE |
| M3 | Review, Challenge & Forensic Verification | Independent review, adversarial challenge, and Forensic Audit of the report | M2 | DONE |

## Code Layout
- Target report: docs/audits/VARELLION_ROOT_CAUSE_INVESTIGATION.md
- Metadata directories: .agents/teamwork/<subagent_name>/
- Repository read-only files: frontend/, backend/, docs/, specs/, references/, *.md
