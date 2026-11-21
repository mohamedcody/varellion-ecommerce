# Original User Request

## Initial Request — 2026-11-17T15:35:33Z

Independently re-investigate the SEC-INV-01 inventory consistency defect across order status transitions in Varellion store to prove whether the reported defect is real, strictly without modifying any code. Treat SEC-INV-01 strictly as an unproven hypothesis; do not assume the previous report is correct, and independently attempt to both prove and disprove the defect.

Working directory: /home/mohamed-saad/Desktop/BRAND
Integrity mode: development

## Requirements

### R1. Independent Code Audit & Repository-Wide Inventory Mutation Search
Inspect the complete implementation of:
- `OrderService.updateOrderStatus()`
- `ProductRepository.findByIdForUpdate()`
- `Product` entity inventory fields
- `OrderItem` entity
- `OrderStatus.canTransitionTo()`
- All inventory mutation methods, stock restoration methods, and delivery failure / return handling paths
Investigate all code paths that modify product inventory across the entire repository (not just `OrderService`), verifying whether another mechanism or service already restores inventory. Follow a zero-assumption policy: do not invent class names, methods, endpoints, test results, or line numbers. Any unverified claim must be classified as UNVERIFIED.

### R2. Reconstruct Numerical Accounting & Discrepancy Analysis
Clearly distinguish between the five stock concepts:
- Physical Stock
- Reserved Stock
- Available Stock
- Returned Stock
- Sellable Stock
Do not assume returned items can be directly added back to sellable stock without evidence of an inspection or restocking workflow. Reconstruct numerical inventory values before and after each operation for operations A through J, using a clearly labeled hypothetical example only when explaining the accounting formula, and highlighting any discrepancy between current code behavior and expected business rules:
A. Order placement
B. Order confirmation
C. Order preparation
D. Shipment
E. Delivery
F. Delivery failure
G. Cancellation before shipment
H. Cancellation after shipment
I. Return after shipment
J. Return after delivery
Search repository-wide to confirm whether an inspection, quarantine, damaged-stock, or restocking workflow exists (reporting NOT FOUND only after repository-wide search).

### R3. Concurrency & Double Restoration Protection Audit
Analyze double restoration potential during concurrent return or cancellation operations. Trace:
- `@Version` optimistic locking checks
- `PESSIMISTIC_WRITE` product locks
- `@Transactional` transaction boundaries
- Order status checks and validation guards
- Actual idempotency mechanisms
- Inventory update statements
Explain what occurs when two concurrent requests attempt the same restoration.

### R4. Remediation Challenge & Active Red-Team Pass
Evaluate the previously suggested remediation (`product.setStockQuantity(stock + totalQty);`) against:
- Courier-rejected shipment
- Customer return after delivery
- Inspection requirements
- Damaged goods
- Potential double restoration
- Preserving `reserved_quantity` invariants
- Dedicated inventory movement records
- Deterministic locking and transactional atomicity
Execute an independent Red-Team review pass that actively attempts to disprove every finding, rejecting any finding not backed by direct code evidence.

### R5. Final Deliverable & Strict Read-Only Boundaries
Prove the true root cause rather than proposing a quick patch. Deliver a final verification report categorizing findings into:
1. Confirmed Technical Defects
2. Business Rule Decisions Required
3. Architectural Improvements
4. Unverified Assumptions
Provide the minimal safe recommendation with no code modifications.

Strict environmental constraints:
- Strictly preserve all existing Git modifications and untracked files.
- Absolutely no edits to source code, tests, configurations, database, or Git state.
- Do not execute new tests or any operation that could touch production DB.
- Distinguish explicitly between actually executed tests and past test execution results.

## Verification Resources
Rely on static code tracing, existing repository tests, and available test execution reports.

## Acceptance Criteria

### Investigation & Evidence Rigor
- [ ] Every conclusion cites exact file path, actual class and method, exact code excerpt, verified line numbers, and call chain
- [ ] Zero-assumption policy is enforced: no fabricated class names, methods, endpoints, test results, or line numbers
- [ ] Any claim that cannot be fully verified against code is classified as UNVERIFIED
- [ ] All 5 stock definitions (Physical, Reserved, Available, Returned, Sellable) are explicitly distinguished
- [ ] Exact before-and-after numerical changes are traced for operations A through J, noting discrepancies between code behavior and business rules
- [ ] Repository-wide search verifies whether restocking, quarantine, or inspection workflows exist
- [ ] Double restoration behavior under concurrent requests, `@Version`, `PESSIMISTIC_WRITE`, `@Transactional`, and idempotency guards is fully traced
- [ ] All 8 challenge points regarding `product.setStockQuantity(stock + totalQty);` are evaluated
- [ ] The Red-Team review pass actively attempts to disprove every finding and rejects unbacked findings
- [ ] Final report categorizes findings into Confirmed Technical Defects, Business Rule Decisions Required, Architectural Improvements, and Unverified Assumptions
- [ ] Minimal safe remediation proposal is provided with zero code modifications
- [ ] Existing Git modifications, untracked files, source code, tests, configs, and DB are completely untouched
