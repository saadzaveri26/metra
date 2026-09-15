# Skill: generate_code (Updated — multi-role + auth aware)

## Purpose
Implement a feature exactly as defined in its spec in `production_artifacts/Technical_Specification.md`.

## Process
1. Locate the relevant spec section. If none exists, stop and request the Spec Agent run `write_specs` first.
2. Backend work goes in `app_build/metra/backend/`, organized by domain module (main.py for routes, field_structuring.py, rules_engine.py, notifications.py, health_report.py, plus any new modules for vendor/HQ-specific logic).
3. Frontend work goes in `app_build/metra/src/`, following the role-based folder convention in `build_role_dashboards`: role-specific screens under `src/app/<role>/`, shared UI in `src/components/shared/`, role-specific UI in `src/components/<role>/`.
4. Every backend endpoint must state and enforce its required role(s), verified from the Clerk JWT per `setup_auth_clerk` — never trust a client-sent role value.
5. If UI-facing, only implement from a real design source (HTML export, Figma, or reviewed v0 component) per `design_frontend` — never from a text description alone.
6. Any CPU-heavy synchronous call in a FastAPI async route (OCR inference, embedding search) must be wrapped in `run_in_threadpool`.
7. Apply known fixes from the previous prototype proactively: EXIF orientation transpose before OCR, PaddleOCR config (`use_angle_cls=False`, `enable_mkldnn=True`, `det_limit_side_len=960`, max dimension ~1150px), scan_id regex validation, upload size cap, SQLite WAL mode.
8. No placeholder logic in production paths unless the spec explicitly says a feature is mocked.
9. After writing, list every file created or modified.

## Rules
- Never modify `production_artifacts/Technical_Specification.md` from this skill.
- Never silently expand a feature beyond its spec's stated scope.
- Never let a lower-privilege role's endpoint (vendor, consumer) read or write data scoped to another role or another business.
