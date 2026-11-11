# BRIEFING — 2026-11-06T20:45:00Z

## Mission
Perform a read-only technical investigation of AdminOrderController, Spring Security actor extraction, and GlobalExceptionHandler.

## 🔒 My Identity
- Archetype: explorer
- Roles: technical investigation, synthesis
- Working directory: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_r1_2
- Original parent: 76c4216f-8b90-4152-83b9-c6ff292e5040
- Milestone: Admin Order Controller & GlobalExceptionHandler Technical Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly read-only: no edits to source files outside working directory
- Target files for eventual implementation: AdminOrderController.java, GlobalExceptionHandler.java (whitelisted)
- Do NOT modify SQL migration files, DB schemas, JPA entities, or DTOs

## Current Parent
- Conversation ID: 76c4216f-8b90-4152-83b9-c6ff292e5040
- Updated: 2026-11-06T20:45:00Z

## Investigation State
- **Explored paths**:
  - `AdminOrderController.java`: current signature, annotations, missing @Slf4j, @Validated, @Pattern.
  - `JwtAuthenticationFilter.java`, `CustomUserDetailsService.java`, `CustomUserDetails.java`, `User.java`: actor representation (Long id vs email username vs UUID).
  - `OrderStatusHistory.java` & `V10__cleanup_legacy_auth_and_indexes.sql`: actorId UUID type, unconstrained by FK.
  - `GlobalExceptionHandler.java`, `BusinessException.java`, `ErrorResponse.java`: missing ConstraintViolationException handler (currently falls through to 500), BusinessException already maps to 400.
  - `AdminOrderControllerTest.java`: standalone MockMvc setup, Mockito when() stub updates required.
- **Key findings**:
  - Injected `Authentication` parameter does not alter HTTP API contracts.
  - Casting principal to `CustomUserDetails` breaks under `@WithMockUser`; safe extraction using `UserDetails` / `getName()` is required.
  - `actor_id` in database/entity is `UUID`; Type-3 name-based UUID (`UUID.nameUUIDFromBytes(...)`) provides deterministic mapping from string/email without schema alteration.
  - Missing `ConstraintViolationException` handler in `GlobalExceptionHandler` causes 500 on invalid `@PathVariable` validation unless handled.
  - Invalid state transitions throwing `BusinessException` already return 400 Bad Request via existing handler.
- **Unexplored areas**: none (investigation complete).

## Key Decisions Made
- Fully documented exact code proposals for `AdminOrderController`, `GlobalExceptionHandler`, and test adjustments in `handoff.md`.

## Artifact Index
- handoff.md — Comprehensive investigation report and recommendations
- progress.md — Heartbeat and status log
- DISPATCH.md — Task assignment log
