# Scope: Final Read-Only Review of feature/checkout-cod-flow against dev

## Objective
Perform a comprehensive, read-only review of `feature/checkout-cod-flow` against `dev` prior to pushing and opening a Pull Request.

## Requirements Breakdown

### R1. Working Tree and Branch Verification
- Verify current active git branch is `feature/checkout-cod-flow`.
- Inspect git status for untracked, modified, or staged files.
- Confirm all intended changes are committed.

### R2. Full Diff and Code Safety Audit
- Review the complete diff between `feature/checkout-cod-flow` and `dev` (`git diff dev...feature/checkout-cod-flow`).
- Check for accidental changes, exposed secrets, .env files, database migration issues, and unrelated modifications.
- Analyze code quality, security, and conventions.

### R3. Test Suite and Build Verification
- Execute backend JUnit suite: `mvn -f backend/pom.xml test`
- Execute frontend Vitest suite: `npm --prefix frontend test -- --run`
- Execute frontend production build: `npm --prefix frontend run build`
- Confirm all test suites pass and build exits with 0.

### R4. Scenario and Risk Analysis
- Concurrency handling for stock purchases (e.g. race conditions, pessimistic/optimistic locking, inventory oversell).
- Rollback behavior during failed checkout (e.g. database transaction boundaries, payment/notification failure, order state).
- Duplicate request handling (e.g. idempotency keys, rapid double-submit).
- Cart clearance behavior upon order completion (e.g. local storage/session storage synchronization, backend cart state).

### R5. Read-Only Constraint
- Under no circumstances modify source code, test files, create commits, push, or merge.

### R6. Review Report
- Deliver concise synthesis covering:
  1. Verified items
  2. Remaining risks
  3. Blockers
  4. Final determination: Safe to push and open a Pull Request?
