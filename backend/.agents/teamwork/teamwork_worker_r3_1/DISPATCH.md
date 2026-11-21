## 2026-11-12T14:21:45Z
You are a teamwork_worker subagent implementing Web Interface Guidelines, WCAG accessibility, and UX audit remediations on the VARELLION platform for the Project Orchestrator.

Your working directory is:
/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_r3_1/

Read the authoritative user request first:
/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md

Read the project blueprint and interface contracts:
/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator_r3/PROJECT.md

Read the detailed survey reports and exact line-by-line diff recommendations from our Explorers:
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_r3_1/handoff.md (Customer Profile Components)
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_r3_2/handoff.md (Order Tracking Components)
- /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_survey_r3_3/handoff.md (Cross-Cutting & Verification)

You may also reference these domain skills:
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/web-design-guidelines/SKILL.md
- /home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-accessibility-audit/SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Scope Boundary & Exclusive Write Ownership
You own and may ONLY edit these 8 target files:
1. `frontend/src/app/profile/page.tsx`
2. `frontend/src/components/profile/PersonalInfoCard.tsx`
3. `frontend/src/components/profile/DeliveryAddressCard.tsx`
4. `frontend/src/components/profile/DeleteAddressDialog.tsx`
5. `frontend/src/components/profile/OrderHistoryList.tsx`
6. `frontend/src/app/track-order/page.tsx`
7. `frontend/src/components/orders/OrderTrackingCard.tsx`
8. `frontend/src/components/orders/OrderTrackingTimeline.tsx`

DO NOT modify ANY files outside of these 8 files (no files in `components/ui/`, no config files, no test files).

## Tasks to Implement

### R1. Customer Profile Components Remediation
1. `frontend/src/app/profile/page.tsx`:
   - Brand name "VARELLION" (line 96) must include `translate="no"`: `<span translate="no">VARELLION</span>`.
   - Interactive quick-action `<Link>` elements (lines 108, 115) must include visible focus indicators: `rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background`.
   - Decorative icons (`Package`, `ShoppingBag`, `AlertCircle`, `ShieldCheck`) must have `aria-hidden="true"`.
   - Error banner (line 127) must have `role="alert"` and `aria-live="polite"`.
2. `frontend/src/components/profile/PersonalInfoCard.tsx`:
   - Async success message (line 65) must have `role="status"` and `aria-live="polite"`.
   - Decorative icons (`User`, `CheckCircle2`, `Mail`) must have `aria-hidden="true"`.
   - Convert static read-only email `<label>` (line 76) to `<span>` or associate properly.
   - Form inputs (lines 87-111): pass `id="fullName"`, `name="fullName"`, `autoComplete="name"`; and `id="phoneNumber"`, `name="phoneNumber"`, `autoComplete="tel"`, `type="tel"`.
3. `frontend/src/components/profile/DeliveryAddressCard.tsx`:
   - Async success message (line 102) must have `role="status"` and `aria-live="polite"`.
   - Decorative icons (`MapPin`, `CheckCircle2`, `Edit2`, `Trash2`, `Plus`) must have `aria-hidden="true"`.
   - Area input: pass `id="cityArea"`, `name="cityArea"`, `autoComplete="address-level2"`.
   - Detailed address: associate `<label htmlFor="detailedAddress">` with `<textarea id="detailedAddress" name="detailedAddress" autoComplete="street-address">`.
4. `frontend/src/components/profile/DeleteAddressDialog.tsx`:
   - Decorative icons (`AlertTriangle`, `Trash2`) must have `aria-hidden="true"`.
5. `frontend/src/components/profile/OrderHistoryList.tsx`:
   - Heading hierarchy: fix heading level so no level is skipped (`<h3>` instead of `<h4>` under `CardHeader` at line 99).
   - Eliminate invalid interactive nesting: eliminate `<Button>` nested inside `<Link>` at lines 104 and 157 by styling `<Link>` directly with `cn(buttonVariants({ variant: 'luxury', size: 'sm' }), ...)` and `cn(buttonVariants({ variant: 'outline', size: 'sm' }), ...)`.
   - Date formatting: guard `toLocaleDateString` at line 142 against SSR hydration mismatch using `const [isMounted, setIsMounted] = useState(false); useEffect(() => setIsMounted(true), []);` and `suppressHydrationWarning`.

### R2. Order Tracking Components Remediation
6. `frontend/src/app/track-order/page.tsx`:
   - Breadcrumb `<Link>` (line 136) and demo order `<button>` (line 235) must include visible focus ring indicators (`focus-visible:ring-*`).
   - Loading/pulse animations (`Loader2` `animate-spin` line 219, enter transition line 265) must include `motion-reduce:animate-none`.
7. `frontend/src/components/orders/OrderTrackingCard.tsx`:
   - Brand name "VARELLION" (line 150) must include `translate="no"`: `<span translate="no">VARELLION</span>`.
   - Eliminate invalid interactive nesting: in lines 156-171, remove `<Button>` from inside `<a>` and style `<a>` directly with `cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 min-w-[140px] ...')`.
   - Replace straight double quotes with typographical curly quotes `“` and `”` around customer notes (line 137).
8. `frontend/src/components/orders/OrderTrackingTimeline.tsx`:
   - Brand name "VARELLION" must include `translate="no"`: in `TRACKING_STEPS` preparing description (line 33) and cancellation notice (line 131).
   - Active pulse animation on badge (line 202) must include `motion-reduce:animate-none`.

### R3. Style & Layout Preservation
- Preserve all existing styling, visual layout, and Arabic RTL rendering intact with zero regressions.

## Verification Requirements
You MUST run:
1. `npm --prefix frontend run build` — must complete with 0 errors.
2. `npm --prefix frontend test` — must pass with 0 failures.
3. Check `git status --porcelain` — verify ONLY the 8 target files are modified.
