# METRA — Technical Specification (Fresh Repo)

## Lessons Carried Over From the Previous Prototype
These are known-good decisions and known fixes from the prior build. Apply them proactively — do not re-discover them.

**PaddleOCR configuration (benchmarked):** `use_angle_cls=False`, `enable_mkldnn=True`, `det_limit_side_len=960`, `det_db_score_mode="fast"`, max image long-edge ~1150px. This configuration achieved ~1.4-2.6s inference vs. 6.8-11.2s with the naive config, with identical accuracy on upright labels.

**EXIF orientation:** mobile photos carry an EXIF rotation tag that `cv2.imdecode` ignores, causing bounding boxes to misalign with what the browser displays. Always transpose via Pillow before OCR:
```python
from PIL import Image, ImageOps
pil_img = ImageOps.exif_transpose(Image.open(io.BytesIO(contents)))
img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
```

**Security baseline:**
- Validate any user-supplied ID used in file path resolution with a strict regex (e.g. `^INS-\d{8}-[A-F0-9]{6}$`) plus `dest.resolve().is_relative_to(BASE_DIR)`.
- Enforce a hard upload size cap (15MB) before buffer allocation.
- Validate any JSON payload with a Pydantic model before use, never `json.loads` directly into downstream logic.
- Enable SQLite WAL mode (`PRAGMA journal_mode=WAL;`) with a 30s timeout for concurrent access.

**Modularity:** split backend logic by domain (field_structuring, rules_engine, font_analysis, overlay_regions, repository, report_generator, notifications, health_report) rather than one large main.py.

**UI:** never generate a screen from a bare text prompt — this produced generic, "AI-looking" output the internal round panel flagged. Always source from a Figma frame (Dev Mode MCP) or a reviewed v0.dev component.

**Avatar/lip-sync:** local-only methods (Rive state machine + Web Audio amplitude / SpeechSynthesis boundary events) — no paid or live cloud TTS/avatar API, for demo-day reliability.

---

## Vector Database Architecture (confirmed)
Tool: Chroma (persistent local client, `app_build/metra/backend/vector_store/`)
Embedding model: sentence-transformers `all-MiniLM-L6-v2`
Collections: `rules_corpus` (rule matching + Ask METRA), `seller_registry` 
(repeat-offender/entity resolution)
Similarity threshold: ~0.75-0.8 cosine, tuned per collection, documented in code — 
see .agents/skills/vector_database.md for full detail.

## The Nine Mandatory Legal Metrology Declaration Fields
1. Manufacturer/packer/importer name & address — Rule 6(1)(a)
2. Common/generic name — Rule 6(1)(b)
3. Net quantity — Rule 6(1) & Rule 7
4. Month & year of manufacture/pack/import — Rule 6(1)
5. MRP, inclusive of all taxes — Rule 6(1)(e) / Rule 18
6. Consumer care details — Rule 6(2)
7. Country of origin (imported goods) — Rule 6(1)(a) + e-commerce amendments
8. Best-before/use-by date (perishables)
9. Font size/legibility/placement on principal display panel — Rule 8

Food articles are partially carved out to FSSAI for some sub-rules.

---

## Feature specs will be appended below this line by the Spec Agent.

### Feature: Core Compliance Pipeline (scan → OCR → field structuring → compliance matrix → rule check → risk scoring → mismatch check → case creation)

**Purpose:** Accept a photographed product label, extract the nine mandatory Legal Metrology declaration fields, check each against the Packaged Commodities Rules, 2011, score the scan's risk level, flag manufacturer-vs-listing mismatches, and persist the result as a case an inspector or HQ can review.

**Inputs:**
- Multipart image upload (`jpg`/`jpeg`/`png`/`webp`, ≤15MB)
- `is_imported: bool` (form field) — gates the Country of Origin rule
- `interface: "consumer" | "vendor" | "inspector"` (form field) — controls response detail, not pipeline behavior
- Authenticated user context (JWT: `sub`, `role`, `state_region`, and for inspectors `government_id`, `designation`, `department_name`)
- Optional listed/declared values from an online listing (`listed_mrp`, `listed_net_quantity`) for the mismatch check — mocked/manual input this cycle, no live marketplace scraping

**Outputs:**
- `Scan` record: raw OCR text, structured fields (each with value, confidence, source bounding box), font-height findings for the two size-relevant fields (net quantity, MRP numerals)
- `ComplianceResult` per field: status (COMPLIANT / NON_COMPLIANT / NEEDS_REVIEW), matched rule reference + act section + penalty clause + finding text
- `RiskScore`: 0–100, computed from violation count/severity + confidence of extracted fields + (if any) prior violation count for the same manufacturer name on file
- `MismatchFlags`: list of fields where the on-label value and the supplied listed value disagree beyond a tolerance (numeric quantity/price fields: exact after normalization; text fields: case-insensitive exact match — no fuzzy/semantic matching this cycle)
- `Case` record created automatically when `overall_status != COMPLIANT`, linking the scan, its violations, and (if inspector-initiated) the filing officer

**Endpoints (backend):**
- `POST /api/v1/scans` — multipart upload, runs the full pipeline synchronously (OCR is wrapped in `run_in_threadpool`), returns `Scan` + `ComplianceResult[]` + `RiskScore` + `MismatchFlags`
- `GET /api/v1/scans/{scan_id}` — retrieve a completed scan (regex-validated `scan_id`, path-safety checked)
- `GET /api/v1/scans` — list scans visible to the caller's role
- `POST /api/v1/scans/{scan_id}/override` — inspector-only manual field correction, re-runs the compliance matrix and risk score, preserves the original AI-extracted value
- `GET /api/v1/cases` / `GET /api/v1/cases/{case_id}` — list/retrieve auto-created cases

**Data model changes (new tables):**
- `scans` (id, user_id, interface, image_path, is_imported, status, ocr_raw_text, structured_fields JSON, font_analysis JSON, compliance_summary JSON, compliance_results JSON, risk_score, mismatch_flags JSON, officer_overrides JSON, state_region, created_at)
- `cases` (id, scan_id, status, overall_status, risk_score, manufacturer_name, opened_at, closed_at)
- `manufacturer_violation_counts` (manufacturer_name_normalized, violation_count) — minimal relational stand-in for repeat-offender tracking this cycle; superseded by the `seller_registry` Chroma collection in Cycle 2, per `vector_database.md`

**Out of scope (explicitly deferred):**
- Semantic/vector-based rule matching and seller/entity resolution (Cycle 2, per build order — this cycle's rule check is the existing deterministic `rules_engine.py` logic only)
- Ask METRA endpoint (depends on the `rules_corpus` Chroma collection built in Cycle 2)
- Live online-listing scraping for the mismatch check — listed values are supplied manually/mocked this cycle
- UI for any of this (no Figma/v0 source provided yet)
- Email notifications on case creation (separate feature, Notification Agent, Cycle 5)
- Consumer health report (separate feature, Consumer Module Agent, Cycle 6)
- Deployment configuration

