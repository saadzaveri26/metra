# METRA — Agent Roster (Fresh Repo Build)

Repo layout:

.agents/
  agents.md
  skills/
  workflows/
    startcycle.md
app_build/
  metra/
    src/
      app/         <- screens/pages
      components/  <- reusable UI
      lib/         <- API clients, utilities
    backend/       <- FastAPI app (Python)
production_artifacts/
  Technical_Specification.md   <- seeded with lessons from the prior prototype
  tech_stack.md
ui_design/
  figma_readme.md
  figma_or_v0_exports/

NOTE: Deployment skills (deploy_app, deploy_cloud_run) are intentionally 
excluded from this build — deployment is deferred to a later cycle by 
team decision. Do not create or invoke them until asked.

---

## 1. Spec Agent
Turns a feature request into a precise technical specification in `production_artifacts/Technical_Specification.md` before any code is written. Never writes implementation code. Uses `write_specs`.

## 2. Backend Agent
Senior Python/FastAPI engineer building `app_build/metra/backend/`: OCR extraction, 
field structuring, compliance matrix/rules engine, risk scoring, notifications, and 
health report modules. Uses `generate_code` against specs, and `vector_database` for 
any semantic rule matching, Ask METRA retrieval, or seller/entity resolution work.

## 3. Frontend Agent
Senior Next.js/React (TypeScript) engineer building `app_build/metra/src/`: Dashboard, Scan, Compliance Result, Risk Queue, Ask METRA, and Consumer Health Report screens. Uses `generate_code`.

## 4. Frontend Design Agent
Translates a REAL design source into faithful React components — a Figma frame (via the Figma Dev Mode MCP server) or a reviewed v0.dev component. NEVER generates UI from a bare text prompt — this produced the "looks AI-generated" feedback in the previous round and is not to be repeated. Uses `design_frontend`, which includes a mandatory anti-genericness checklist.

## 5. Avatar Integration Agent
Wires a team-built Rive `.riv` avatar (built manually in the Rive editor, not by this agent) into the app: state machine inputs and lip-sync logic. Uses `integrate_rive_avatar`.

## 6. Notification Agent
Implements automated email notifications to a company/seller when a case is created with a compliance failure. Uses `send_notifications`.

## 7. Consumer Module Agent
Implements the consumer-facing health/nutrition report feature, sourced from Open Food Facts. Distinct audience from officers — kept in a clearly separate part of the app. Uses `consumer_health_report`.

## 8. Code Auditor Agent
Reviews all completed work against its spec, flags deviations, hardcoded secrets, unused code, missing error handling. Uses `audit_code`. Does not fix issues itself — reports them.

---

## Order of Operations
Spec Agent → Frontend Design Agent (for any UI work, always sourced from Figma/v0) → relevant implementation agent(s) → Code Auditor Agent. Deployment is deferred — do not invoke deployment skills.
