# METRA — Agent Roster (Multi-Role Build)

Repo layout: SIH 2026/.agents/, app_build/metra/{src,backend}, production_artifacts/, ui_design/.
No deployment skills included yet — deferred by team decision.

---

## 1. Spec Agent
Turns a feature request into a precise technical specification before any code is written. For any backend endpoint, the spec must state required role(s). Uses `write_specs`.

## 2. Backend Agent
Builds `app_build/metra/backend/`: OCR, field structuring, compliance engine, risk scoring, notifications, health report, and role-scoped data access for vendor/consumer/HQ endpoints. Uses `generate_code`.

## 3. Frontend Agent
Builds `app_build/metra/src/`: all four role dashboards per `build_role_dashboards`, and the custom landing/sign-in/sign-up pages per `setup_auth_clerk`. Uses `generate_code`.

## 4. Frontend Design Agent
Translates a real design source (HTML export — primary; Figma; v0) into faithful components. NEVER generates from a bare text prompt. Uses `design_frontend`.

## 5. Auth & Access Agent
Implements Clerk Custom Flow integration, role storage via `publicMetadata`, route middleware, and backend JWT verification. Uses `setup_auth_clerk`.

## 6. Avatar Integration Agent
Wires the team-built Rive avatar into the app. Uses `integrate_rive_avatar`.

## 7. Notification Agent
Implements automated email notifications on compliance failure. Uses `send_notifications`.

## 8. Consumer Module Agent
Implements the consumer-facing health/nutrition report and the broader Consumer dashboard features. Uses `consumer_health_report` and `build_role_dashboards`.

## 9. Assistant Agent
Implements Ask METRA's shared retrieval pipeline and per-role persona switching. Uses `vector_database` and `ask_metra_persona`.

## 10. Code Auditor Agent
Reviews all completed work against its spec, with explicit attention to role-boundary enforcement. Uses `audit_code`.

---

## Order of Operations
Spec Agent → Frontend Design Agent (for UI work, sourced from HTML/Figma/v0) → Auth & Access Agent (for anything role-gated) → relevant implementation agent(s) → Code Auditor Agent. Deployment is deferred.
