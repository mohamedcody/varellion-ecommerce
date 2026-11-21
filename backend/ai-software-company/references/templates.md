# Templates

Copy the one you need, fill it in, and keep it short. A template that is half empty is better than one padded with filler.

## PROJECT_STATE.md

```markdown
# <Project name>: state
Tier: Quick | Feature | Product        Stack: <stack>        Updated: <date>

## Phase board
| Phase | Status (todo / doing / done / skipped) | Gate result |
|---|---|---|
| 1 Discovery | | |
| 2 Design | | |
| 3 Planning | | |
| 4 Build | | |
| 5 Verify | | |
| 6 Secure | | |
| 7 Review | | |
| 8 Release | | |
| 9 Retro | | |

## Decisions (ADR index)
- ADR-001: <title>: <date>: <accepted | superseded>

## Assumptions (to confirm)
- 

## Open questions
- 

## Risks
| Risk | Severity | Owner role | Mitigation |
|---|---|---|---|

## Backlog
| ID | Story | Size | Status |
|---|---|---|---|

## Tech debt
- 
```

## Product brief

```markdown
# Product brief: <name>
**Problem:** <who has it, in one or two sentences>
**Users:** <primary, secondary>
**Today they:** <current workaround>
**Idea in one line:** <the product>
**Success looks like:** <2 or 3 measurable outcomes>
**Constraints:** <time, budget, tech, legal>
**Assumptions:** <what we are betting is true>
**Out of scope (for now):** <list>
```

## PRD

```markdown
# PRD: <name>
## 1. Goal and success metrics
## 2. Users and journeys   (one short journey per user type)
## 3. MVP scope            (numbered, each requirement testable)
## 4. Out of scope
## 5. Non-functional requirements   (performance, availability, privacy, accessibility, compliance)
## 6. Risks and open questions
## 7. Release criteria
```

## ADR (architecture decision record)

```markdown
# ADR-<n>: <decision title>
Status: proposed | accepted | superseded by ADR-<m>
Context: <the forces at play, 2 to 4 sentences>
Decision: <what we chose>
Alternatives considered: <and why not>
Consequences: <good, bad, what becomes harder>
```

## Story

```markdown
# <ID>: <title>
As a <user>, I want <capability>, so that <outcome>.
Size: S | M | L          Depends on: <IDs>
Acceptance criteria
- Given <context>, when <action>, then <observable result>
- Given <invalid input>, when <action>, then <clear error, no data change>
Notes: <edge cases, security considerations, API contract link>
```

## Definition of Done (default)

- Acceptance criteria met and demonstrated
- Tests written and passing (state which were actually run)
- No new Critical or High security finding
- Code reviewed; no blocker left
- Configuration and secrets handled outside source
- Docs or runbook updated if behaviour changed
- `PROJECT_STATE.md` updated

## Test plan skeleton

```markdown
# Test plan: <feature>
Scope: <in / out>
Risk areas: <ranked>
| Acceptance criterion | Test type | Test name / file | Result |
|---|---|---|---|
Non-functional checks: <performance, accessibility, auth cases>
Not tested (and why): <be explicit>
```

## Release checklist

- [ ] Build is reproducible from a clean checkout
- [ ] All migrations tested on a copy of realistic data
- [ ] Environment variables documented and set; no secrets in the repo or image
- [ ] Health and readiness endpoints respond
- [ ] Image runs as non-root; ports published only where intended
- [ ] CI is green (tests, dependency audit, secret scan, static analysis where available)
- [ ] Rollback steps written and understood
- [ ] Monitoring or at least log access confirmed
- [ ] Backups configured; one restore tried
- [ ] Founder sign-off

## Retro

```markdown
# Retro: <release or milestone>
Shipped: 
Slipped (and why): 
What worked: 
What to change: 
Tech-debt log (new items): 
Next 3 steps: 
```
