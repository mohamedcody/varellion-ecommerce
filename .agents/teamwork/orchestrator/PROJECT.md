# Project: SEC-INV-01 Inventory Consistency Investigation

## Objective
Independently re-investigate the SEC-INV-01 inventory consistency defect across order status transitions in Varellion store to prove whether the reported defect is real, strictly without modifying any code. Treat SEC-INV-01 strictly as an unproven hypothesis; do not assume the previous report is correct, and independently attempt to both prove and disprove the defect.

## Feature / Investigation Inventory
| # | Requirement | Description | Agent Focus | Status |
|---|-------------|-------------|-------------|--------|
| 1 | R1: Code Audit & Inventory Search | Complete audit of OrderService, ProductRepository, Product, OrderItem, OrderStatus, and repository-wide search for any stock restoration paths | Explorer 1 | PLANNED |
| 2 | R2: Numerical Accounting & Stock Concepts | Reconstruct 5 stock definitions (Physical, Reserved, Available, Returned, Sellable), trace operations A-J before/after values, check for restocking/quarantine workflows | Explorer 2 | PLANNED |
| 3 | R3 & R4: Concurrency, Double Restoration & Remediation Challenge | Audit @Version, PESSIMISTIC_WRITE, @Transactional, idempotency; evaluate product.setStockQuantity(stock + totalQty) against all 8 challenge points | Explorer 3 | PLANNED |
| 4 | R4 & R5: Red-Team Disproof & Categorized Synthesis | Active Red-Team pass attempting to disprove every defect claim; synthesize final categorized report (Confirmed, Business Decisions, Architectural, Unverified) | Critic / Reviewer | PLANNED |

## Guidelines & Strict Constraints
- Strict zero-assumption policy: cite exact file path, class, method, exact code excerpt, verified line numbers.
- Any unverified claim must be marked UNVERIFIED.
- Strictly read-only: no code modifications, no test execution touching DB, preserve all git modifications and untracked files.
