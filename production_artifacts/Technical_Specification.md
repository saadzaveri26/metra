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
