# Workflow: startcycle (Multi-Role Build)

## Steps
1. Spec Agent runs `write_specs` (states required role(s) for any endpoint).
2. If UI-facing: Frontend Design Agent runs `design_frontend`, sourced from `ui_design/html_exports/` (primary), Figma, or v0 — never a bare text prompt.
3. If auth/role-related: Auth & Access Agent runs `setup_auth_clerk` before any role-gated feature is built on top of it.
4. Relevant implementation agent runs `generate_code`.
5. Code Auditor Agent runs `audit_code`, with explicit role-boundary review.
6. DEPLOYMENT IS DEFERRED — no deployment skills in this repo yet.

## Recommended Build Order
1. Clerk auth + role storage + middleware (foundation everything else depends on).
2. Core officer pipeline (if not already carrying over from the previous repo).
3. Vector database (rules_corpus + seller_registry).
4. Vendor dashboard.
5. Consumer dashboard (incl. health report).
6. Headquarters dashboard (incl. rule/policy management, which vendor/officer compliance checks will then read from).
7. Ask METRA persona-switching across all four roles.
8. Avatar integration.
9. Email notifications.

## Ground rules
- Never build UI from a bare text-to-UI prompt — HTML export, Figma, or v0 source required.
- Every backend endpoint enforces its role requirement from a verified Clerk JWT — never a client-sent value.
- publicMetadata.role is never client-writable.
- METRA remains a decision-support tool — no automated penalties.
- Vendor self-check results never write into official case/risk data. Consumer reports are unverified leads, not confirmed violations.
- Only headquarters-role requests write to the compliance rules matrix.
- Avatar lip sync stays local-only, no paid/live cloud TTS API.
- Notification emails route to DEMO_MODE test inbox until explicitly enabled.
