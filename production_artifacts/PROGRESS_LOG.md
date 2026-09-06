# METRA — Progress Log

This file tracks what has actually been built, cycle by cycle, against
the roadmap in `.agents/workflows/startcycle.md`. Update it at the end
of every cycle — it's the fastest way for anyone (including a future
session) to see real status without re-reading every spec and diffing
the codebase.

---

## Cycle 1 — Core Compliance Pipeline ✅ Built & smoke-tested

**Goal (per `startcycle.md` build order, step 1):** scan capture → OCR →
field structuring → compliance matrix → rule check → risk scoring →
mismatch check → case creation.

**Process followed:** Spec Agent (`write_specs`) → Backend Agent
(`generate_code`) → manual smoke test. Full spec is in
`production_artifacts/Technical_Specification.md` under "Feature: Core
Compliance Pipeline".

### What was built

All in `app_build/metra/backend/`:

| File | What it does |
|---|---|
| `config.py` | Environment-driven settings, including the benchmarked OCR config and the ID-format regex used everywhere a user-supplied ID touches a file path |
| `security.py` | JWT issuance/verification, role-based route guards (`consumer`/`vendor`/`inspector`/`hq`), `validate_id()` + `safe_join()` path-traversal guards |
| `db.py` | SQLAlchemy engine/session, **SQLite WAL mode + 30s busy timeout enabled** on connect |
| `models.py` | `User` (role-specific fields, inspector govt-ID/photo/verification), `Scan`, `Case` (auto-created on non-compliance), `ManufacturerViolationCount` |
| `ocr_engine.py` | `extract_text_blocks()` — real PaddleOCR path (benchmarked config: `use_angle_cls=False`, `enable_mkldnn=True`, `det_limit_side_len=960`, `det_db_score_mode="fast"`, max long-edge 1150px) + EXIF-orientation transpose applied unconditionally; mock path for dev without the ML install |
| `field_structuring.py` | Regex extraction of the 6 core mandatory fields (manufacturer, net quantity, MRP, country of origin, mfg date, consumer care) into the shape `rules_engine` expects, each with a source bounding box; `analyze_font_sizes()` for the Rule 7 legibility check on net-quantity/MRP numerals |
| `rules_engine.py` | Deterministic Rule 6 compliance checks — **reused as-is from the pre-existing asset**, not rewritten |
| `risk_engine.py` | 0–100 risk score from violation severity + extraction-confidence proxy + repeat-manufacturer-violation count |
| `mismatch_check.py` | Compares on-label MRP/net-quantity against manually-supplied "listed" values (no live marketplace scraping this cycle — explicitly deferred) |
| `repository.py` | Manufacturer violation-count bookkeeping, auto `Case` creation when a scan's overall status isn't `COMPLIANT` |
| `schemas.py` | Pydantic request/response models |
| `routes_auth.py` | Registration per role + login; inspector accounts require HQ verification (`inspector_verified` flag) before login succeeds |
| `routes_scans.py` | `POST /scans` (OCR wrapped in `run_in_threadpool`), `GET /scans`, `GET /scans/{id}`, `POST /scans/{id}/override` (inspector manual correction, re-runs compliance + risk), `GET /cases`, `GET /cases/{id}` |
| `main.py` | FastAPI app wiring, CORS, table creation on startup |
| `requirements.txt` | Pinned deps; PaddleOCR/Chroma commented out (optional/next-cycle) |
| `README.md` | Setup and run instructions |

### What was verified (manual smoke test, not an automated suite)

- Health check responds.
- Consumer registration → login → JWT issued.
- Compliant scan (default mock label): `overall_status=COMPLIANT`, risk score low (3).
- Non-compliant scan (custom fixture: bad unit symbol, no "inclusive of
  taxes", missing consumer care): 3 violations correctly detected with
  correct rule references and penalty clauses; risk score 56; a `Case`
  auto-created.
- Mismatch check: supplying a `listed_mrp` different from the on-label
  MRP correctly flags the mismatch.
- Inspector accounts cannot log in before `inspector_verified=True`
  (403, correct message).
- Non-inspector/HQ roles cannot list `/cases` (403).
- Malformed scan ID (`/scans/abc`) rejected with 400 by `validate_id()`,
  not a raw 404/500 or a path-resolution attempt.
- **Bug found and fixed during testing:** `analyze_font_sizes()`
  originally only handled PaddleOCR's 8-value polygon bounding boxes and
  silently reported "no bounding box" for the mock engine's 4-value
  axis-aligned boxes. Now handles both formats.

### Explicitly out of scope this cycle (see spec for full list)

- Vector DB (Chroma) — semantic rule matching, Ask METRA, seller/entity
  resolution. Repeat-offender tracking this cycle is exact-match only
  (`ManufacturerViolationCount`).
- Any UI (no Figma/v0 source provided yet — per project ground rules,
  UI is never built from a bare text prompt).
- Email notifications on case creation.
- Consumer health report (Open Food Facts).
- HQ dashboard / inspector-verification endpoint (inspectors can be
  verified only via direct DB edit right now — see backend README).
- Live online-listing scraping for the mismatch check (manual/mocked
  input only).
- Automated test suite.
- Deployment configuration (deferred by team decision, not touched).

---

## Cycle 2 — Not started

Per `startcycle.md`'s build order, next up:
1. Vector database setup: `rules_corpus` + `seller_registry` Chroma
   collections (see `.agents/skills/vector_database.md`).
2. Wire `rules_corpus` into the rule-check step (upgrade from
   deterministic-only matching) and into case creation.
3. UI foundation — **blocked on a Figma frame or reviewed v0.dev
   component being provided**; cannot start from a text prompt per
   project ground rules.
4. Avatar integration (Rive `.riv` file — must be built manually in the
   Rive editor first, not generated by an agent).
5. Email notifications (Resend/fastapi-mail, `DEMO_MODE` only).
6. Consumer health report (Open Food Facts).
7. Ask METRA (becomes straightforward once `rules_corpus` exists from
   step 1).

---

## How to pick this back up

1. Read this file's "Cycle 2 — Not started" section for what's next.
2. Read `production_artifacts/Technical_Specification.md` in full —
   the "Lessons Carried Over" section at the top applies to everything.
3. Follow the same process as Cycle 1: Spec Agent writes the spec for
   whichever Cycle 2 item you're tackling → Backend/Frontend Agent
   generates code against it → Code Auditor Agent reviews.
4. Update this log when the cycle is done.
