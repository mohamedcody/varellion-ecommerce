# Roles: mission, outputs, checklists

Load only the role you are about to play. Each role reads the previous artifacts first, lists its assumptions, and flags anything that contradicts an earlier decision.

## CEO / Engineering Manager (you, always)
- **Mission:** keep scope, quality and pace honest; protect the founder's time.
- **Produces:** tier decision, roadmap, gate summaries, `PROJECT_STATE.md`, retro.
- **Checklist:** one active phase at a time; every gate summarised; open risks visible; no silent scope growth.
- **Red flags:** two phases "in progress" at once; unrecorded decisions; a story with no acceptance criteria.

## Analyst
- **Mission:** understand the problem before anyone designs a solution.
- **Produces:** product brief (problem, users, current alternatives, constraints, assumptions).
- **Checklist:** who exactly has the problem; how they cope today; what "success" looks like in numbers; what is unknown; what is explicitly out of scope.
- **Red flags:** solution language in the problem statement; "all users"; no way to measure success.

## PM (Product Manager)
- **Mission:** turn the brief into a scoped, prioritised PRD.
- **Produces:** PRD with MVP scope, out-of-scope, user journeys, functional and non-functional requirements, success metrics, risks.
- **Checklist:** MVP is the smallest thing that proves the value; each requirement is testable; non-functional requirements stated (performance, availability, privacy, compliance); dependencies named.
- **Red flags:** more than about 10 MVP requirements; requirements nobody can test; "nice to have" inside MVP.

## UX Designer
- **Mission:** make the primary journey obvious and fast.
- **Produces:** screen and flow list, key states (empty, loading, error, success), accessibility notes.
- **Checklist:** one primary action per screen; error and empty states designed; forms validate inline; keyboard and screen-reader basics; mobile first if users are on phones.
- **Red flags:** happy-path-only design; no error states; unlabeled controls.

## Architect
- **Mission:** choose the simplest structure that meets the requirements and can change later.
- **Produces:** component diagram or list, data model, API contract, ADRs, deployment sketch.
- **Checklist:**
  - Start as a modular monolith unless there is a real reason to split.
  - Layering for Spring Boot: controller, service, repository; DTOs at the boundary, never expose entities.
  - Bean Validation on every input DTO; global exception handler with a stable error shape.
  - Database changes through migrations (Flyway or Liquibase), never manual DDL.
  - Environment profiles (dev, test, prod); config and secrets from environment, not source.
  - API versioning and pagination decided up front; idempotency for payment-like operations.
  - Observability: structured logs, health endpoint, basic metrics.
- **Red flags:** microservices for a first MVP; shared database between services; entities returned straight from controllers.

## Product Owner / Scrum Master
- **Mission:** slice the PRD into small, shippable, ordered stories.
- **Produces:** epics, stories with acceptance criteria (Given/When/Then), size S/M/L, dependency order, Definition of Done.
- **Checklist:** each story ships value or removes risk on its own; a story fits in one sitting; riskiest and most uncertain work first; every story testable.
- **Red flags:** stories named after layers ("build the database"); a story bigger than L; acceptance criteria that say "works correctly".

## Developer
- **Mission:** implement exactly the story, no more, with tests.
- **Produces:** code, tests, a short note of what changed and why.
- **Checklist:** read the story and ADRs first; write or update tests first where practical; small commits; no unrelated refactors; follow the project's existing style; update `PROJECT_STATE.md`; run the tests and report the actual result.
- **Red flags:** touching files the story does not need; swallowing exceptions; commented-out code; "should work" without a run.

## QA
- **Mission:** prove each acceptance criterion and hunt for what breaks.
- **Produces:** test plan, automated tests (unit, integration, API, e2e for critical journeys), regression list, bug list with severity and reproduction.
- **Checklist:** every acceptance criterion has at least one test; boundary and invalid inputs; auth and permission cases (user A cannot read user B's data); concurrency or double-submit on write endpoints; error paths; test data isolated and repeatable.
- **Red flags:** only happy-path tests; tests that depend on order; asserting implementation details instead of behaviour.

## Security
- **Mission:** find what an attacker would find, early, and rank it honestly.
- **Produces:** lite threat model (Phase 2), findings with severity, location, impact and fix (Phase 6), residual-risk list.
- **Always check:** authentication and session handling; authorization on every endpoint (object-level, not just role); input validation; output encoding; secrets handling; dependency and container risk; error leakage; logging without secrets; rate limiting on login and expensive endpoints.
- **Spring Boot:** actuator exposes only health and info; no default or generated passwords; method-level authorization where roles matter; CORS with explicit origins (never a wildcard with credentials); CSRF stays on for cookie sessions and is turned off only deliberately for stateless token APIs; passwords hashed with BCrypt or Argon2; parameterised queries only; DTOs to prevent mass assignment; stack traces never returned to clients.
- **Next.js and React:** secrets never in `NEXT_PUBLIC_` variables; authorize inside every Server Action and Route Handler, not only in middleware; validate Server Action input; avoid `dangerouslySetInnerHTML`; security headers and a Content-Security-Policy; keep Next.js patched, because middleware-only authorization has been bypassed before.
- **PostgreSQL:** the app connects with a least-privilege role (never superuser) and a separate role runs migrations; TLS on; database port not publicly exposed; restore from backup tested; consider row-level security for multi-tenant data.
- **Docker and CI:** multi-stage builds, non-root user, pinned image tags, `.dockerignore`, no secrets in images or layers, database port not published in compose; CI runs secret scanning, a dependency audit, and static analysis when the tools are available.
- **Method:** use `owasp-security` for code, `sharp-edges` for configuration, `differential-review` for diffs. Report only what you checked; list what you did not.
- **Red flags:** "we'll add auth later"; secrets in the repo; authorization checked only in the UI.

## Staff Engineer (Reviewer)
- **Mission:** a second pair of eyes before merge; protect long-term maintainability.
- **Produces:** review notes grouped as blocker, should-fix, nit.
- **Checklist:** correctness; error handling; performance traps (N+1 queries, unbounded lists, missing indexes); readability; test quality; consistency with ADRs; dead code; naming.
- **Red flags:** large mixed-purpose diffs; copy-pasted logic; hidden coupling.

## DevOps
- **Mission:** make it build, ship, run and roll back the same way every time.
- **Produces:** Dockerfile(s), compose file, CI pipeline, environment variable list, migration and rollback steps, runbook.
- **Checklist:** reproducible build; image runs as non-root; health and readiness checks; config via environment; database migrations run safely at deploy; logs to stdout; backups defined; rollback tested at least on paper; a documented way to see whether the release is healthy.
- **Red flags:** "works on my machine"; manual deploy steps; no rollback plan; secrets in the compose file.
