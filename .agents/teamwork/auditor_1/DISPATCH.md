## 2026-10-31T21:17:19Z
You are the Forensic Integrity Auditor (teamwork_auditor).
Your working directory: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/auditor_1/

MANDATORY CONTEXT:
Read the full original request before starting:
/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md
Also read the orchestrator project plan:
/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/orchestrator_1/PROJECT.md

TARGET OF AUDIT:
The master root-cause investigation report:
`/home/mohamed-saad/Desktop/BRAND/docs/audits/VARELLION_ROOT_CAUSE_INVESTIGATION.md`
And the overall team actions across the repository.

YOUR TASK:
Perform a comprehensive forensic integrity audit:
1. Verify Non-Modification Constraints:
   - Check git status and git diff: Confirm that NO source code files (`frontend/src/**`, `backend/src/**`), migration files, database schemas, API contracts, or dependencies (`package.json`, `pom.xml`) have been modified, created, or deleted.
   - Confirm that the team operated strictly within read-only boundaries on the codebase.
2. Verify Skill Discovery Integrity:
   - Inspect every skill listed in Section B:
     * `awesome-api-design`
     * `awesome-database-audit`
     * `awesome-bug-fix`
     * `awesome-error-standards`
     * `web-design-guidelines`
     * `awesome-git-commit-plan`
     * `awesome-security-audit`
   - Confirm that every single one exists in `/home/mohamed-saad/Desktop/BRAND/.agents/skills/` with a valid `SKILL.md`.
   - Confirm that no non-existent skills were hallucinated or cited.
3. Verify Authenticity & Evidence Grounding:
   - Verify that the report did NOT hardcode fake test results, did NOT fabricate logs or evidence, and did NOT create dummy facade analyses.
   - Spot-check citations: Do the referenced lines in `frontend/src/app/products/page.tsx`, `CartContext.tsx`, `api.ts`, `Product.java`, `ProductService.java`, `CategoryService.java`, `OrderController.java`, `callback/page.tsx` actually exist and contain the cited code?
4. Deliver your verdict:
   - If ANY cheating, hallucination, or violation of non-modification constraints is found: report `INTEGRITY VIOLATION` with full evidence.
   - If all constraints were respected and findings are authentic: report `CLEAN`.

CONSTRAINTS:
- Deliver your detailed audit report to:
  `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/auditor_1/analysis.md`
- Complete your handoff at:
  `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/auditor_1/handoff.md`
  with your explicit binary verdict: `CLEAN` or `INTEGRITY VIOLATION`.
- Send a completion message back to the orchestrator.
