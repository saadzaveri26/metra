# Skill: generate_code

## Purpose
Implement a feature exactly as defined in its spec in `production_artifacts/Technical_Specification.md`.

## Process
1. Locate the relevant spec section. If none exists, stop and request the Spec Agent run `write_specs` first.
2. Backend work goes in `app_build/metra/backend/` — organize by domain module (e.g. `main.py` for routes, `field_structuring.py`, `rules_engine.py`, `notifications.py`, `health_report.py`) rather than piling everything into one file, per the modularity lesson from the previous prototype.
3. Frontend work goes in `app_build/metra/src/`: screens → `src/app/`, reusable UI → `src/components/`, API clients/utilities → `src/lib/`.
4. If UI-facing, only implement from a Figma/v0 design source provided by the Frontend Design Agent — never from a text description alone.
5. Any CPU-heavy synchronous call in a FastAPI async route (OCR inference, embedding search) must be wrapped in `run_in_threadpool`.
6. Add error handling for invalid/undecodable input at every boundary (file upload, external API call to Open Food Facts, email send failure) — never let an unhandled exception surface a raw traceback.
7. Apply known fixes from the previous prototype proactively rather than re-discovering them: EXIF orientation transpose before OCR, PaddleOCR config (`use_angle_cls=False`, `enable_mkldnn=True`, `det_limit_side_len=960`, max image dimension ~1150px), scan_id regex validation, upload size cap, SQLite WAL mode. See `production_artifacts/Technical_Specification.md` for full details on each.
8. No placeholder logic in production paths unless the spec explicitly says a feature is mocked (barcode/LMPC lookup and online-listing comparison are intentionally mocked).
9. After writing, list every file created or modified.

## Rules
- Never modify `production_artifacts/Technical_Specification.md` from this skill — that's `write_specs`' job only.
- Never silently expand a feature beyond its spec's stated scope.
- If a feature involves rule matching, Ask METRA retrieval, or seller/entity 
  resolution, use the `vector_database` skill for the matching logic — do not 
  implement naive keyword/string matching for these three cases, that's the exact 
  gap the vector DB exists to close.
