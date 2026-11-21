---
name: admin-order-management
description: Use when an agent implements, changes, or reviews an admin order-management feature, including order tables, status updates, fulfillment actions, admin APIs, authorization, or order-status UI in this Spring Boot and Next.js project.
---

# Admin Order Management

## Overview

Treat admin orders as a cross-layer workflow, not a table-only feature. The backend is authoritative for authorization, order data, legal status transitions, audit history, and errors; the frontend reflects that contract without inventing state.

## Required Sequence

1. **Inspect before editing.** Read the existing admin controller/DTO/tests, `OrderService`, `OrderStatus`, order DTOs, `SecurityConfig`, frontend order types/services, and nearby test fixtures. Record the endpoint, envelope, auth rule, status values, and error shape.
2. **Turn ambiguity into decisions.** If the request does not define the endpoint, mutable statuses, transition rules, unauthorized behavior, pagination/filtering, or acceptance criteria, ask for the missing decisions. Do not silently copy customer behavior or invent an admin contract.
3. **Implement the server contract first.**
   - Keep admin routes under `/api/admin/orders`.
   - Enforce `ROLE_ADMIN` on the server; a hidden button is not authorization.
   - Accept typed `OrderStatus` values and validate path/body input.
   - Delegate transition legality to the domain/service layer. Never set an enum directly from the UI.
   - Record the actor, previous status, new status, reason, and timestamp in status history.
   - Return the repository's `ApiResponse`/`ErrorResponse` shape and preserve meaningful HTTP errors.
4. **Wire the frontend to the real contract.**
   - Reuse the shared `Order` and `OrderStatus` types.
   - Use the actual API client and auth behavior; remove mock data from the production path.
   - Render loading, error, empty, unauthorized, and success states.
   - Disable duplicate submissions, preserve the old status after a failed update, and refetch or apply the returned order after success.
   - Show only transitions the server permits; the server remains the final authority.
5. **Test the vertical slice.**
   - Backend: authorized success, non-admin rejection, malformed order number, missing/invalid status, excessive reason, missing order, illegal transition, terminal-state update, and audit history.
   - Frontend: real response rendering, loading/error/empty/unauthorized states, request payload, disabled submission, successful returned state, and failed-update rollback.
   - Use existing Spring Boot/MockMvc and Vitest/Testing Library conventions. Do not add a second test framework.
6. **Verify before claiming completion.** Run targeted backend tests, frontend typecheck, lint, and relevant frontend tests. Inspect the diff for mock fallbacks, missing auth, duplicated status definitions, swallowed errors, and unrelated changes.

## Decision Gate

```text
Known contract and legal transitions?
  no -> inspect existing code, then ask for the missing decision
  yes -> implement backend contract -> wire UI -> test both sides -> verify
```

## Project Contract Quick Reference

| Concern | Current source of truth |
|---|---|
| Admin update route | `PUT /api/admin/orders/{orderNumber}/status` |
| Order number format | `VAR-YYYYMMDD-NNNN` |
| Request body | `newStatus: OrderStatus`, optional `reason` max 500 chars |
| Authorization | `ROLE_ADMIN` via backend security/pre-authorization |
| Status rules | `OrderStatus.canTransitionTo` and `OrderService` |
| Success envelope | `ApiResponse<OrderResponseDto>` |
| Test seams | `AdminOrderControllerTest`, `OrderServiceTest`, frontend Vitest tests |

## Common Mistakes

| Temptation | Correct response |
|---|---|
| “The table renders, so it works.” | Prove the real endpoint, auth, errors, and update behavior. |
| “Copy the customer endpoint.” | Compare ownership, privileges, response fields, and transition semantics first. |
| “Validate statuses in React.” | Use UI validation for feedback only; enforce legality in the service/domain layer. |
| “Optimistically change the badge.” | Keep the prior value until the server succeeds, or restore it on failure. |
| “Catch and ignore API errors.” | Surface the repository-standard message and preserve failure state. |
| “Add a new status because the dropdown needs it.” | Update the domain contract, persistence constraints, DTOs, consumers, and tests together. |

## Red Flags — Stop and Re-check

- A frontend-only status update
- Mock orders left in the production path
- Admin authorization enforced only by the UI
- A status transition without a domain/service check or audit history
- A new endpoint or response shape guessed from memory
- Tests that cover only the happy path
- A completion claim without targeted test output
