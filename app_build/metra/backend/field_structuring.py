"""
Converts raw OCR blocks into:
  1. structured_fields — the values rules_engine.evaluate_compliance() checks
  2. font_analysis — numeral height findings for the two size-relevant
     fields (net quantity, MRP), per Rule 8 / mandatory field #9

Each extractor is a small, auditable regex/heuristic rather than an
opaque model, so every compliance finding can be traced back to a
specific piece of detected text and its bounding box.
"""
import re
from typing import Any, Dict, List, Optional

from ocr_engine import OCRBlock

_MRP_PATTERN = re.compile(
    r"(?:mrp|m\.?r\.?p\.?|mrr|m\.?r\.?r\.?|max(?:imum)?\.?\s*retail\s*price)"
    r"(?:[^\d\n]{0,40}?)"
    r"(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9oO]{1,2})?)",
    re.IGNORECASE,
)


def _clean_mrp_text(text: str) -> str:
    """Fix common OCR misrecognitions on Indian packaged commodities (e.g. ₹3 read as U, O as 0)."""
    t = re.sub(r'\bMRR\b', 'MRP', text, flags=re.IGNORECASE)
    t = re.sub(r'MRP\s*[uU]([0-9oO])', r'MRP 3\1', t, flags=re.IGNORECASE)
    t = re.sub(r'(\d)[oO]', r'\g<1>0', t)
    t = re.sub(r'(\d+)[.,][oO]{1,2}', r'\1.00', t)
    return t

# 1. Statutory explicit net quantity declaration pattern
_EXPLICIT_NET_QTY_PATTERN = re.compile(
    r"(?:net\s*(?:qty|quantity|weight|wt|content|volume|vol|mass)s?|pkd\s*net|n\.?\s*q\.?)"
    r"[\s:\-'\.\*]*"
    r"([0-9]+(?:\.[0-9]+)?)\s*"
    r"(kg|kgs|kilo|kilograms?|g|gm|gms|grams?|ml|mls|millilitres?|milliliters?|l|lt|ltr|litres?|liters?|n|units?|pcs|pieces?|doz)\b",
    re.IGNORECASE,
)

# 2. Header-only block for multi-line declarations (e.g. Block i: "NET QUANTITY:", Block i+1: "1 kg")
_NET_QTY_HEADER_PATTERN = re.compile(
    r"^(?:net\s*(?:qty|quantity|weight|wt|content|volume|vol|mass)s?|pkd\s*net|n\.?\s*q\.?)\s*[:\-'\.\*]*$",
    re.IGNORECASE,
)

# 3. Noise pattern to filter out nutritional facts panels (e.g. "Serve size: 1 g", "Protein 0 g", "per 100 g")
_NUTRITIONAL_NOISE_PATTERN = re.compile(
    r"(?:serve\s*size|serving|servings|per\s*100|nutrition|protein|total\s*sugars?|added\s*sugars?|"
    r"carbohydrate|total\s*fat|saturated\s*fat|sodium|iodine|energy|kcal|approx|rda|daily\s*value)",
    re.IGNORECASE,
)

# 4. Fallback pattern when no explicit "NET" keyword is found, applied ONLY to non-nutritional lines
_FALLBACK_NET_QTY_PATTERN = re.compile(
    r"\b([0-9]+(?:\.[0-9]+)?)\s*"
    r"(kg|kgs|kilo|kilograms?|g|gm|gms|grams?|ml|mls|millilitres?|milliliters?|l|lt|ltr|litres?|liters?|n|units?|pcs|pieces?|doz)\b",
    re.IGNORECASE,
)

_DATE_PATTERN = re.compile(
    r"(?:mfg|manufactured?|packed|packaging|pkd|date\s*of\s*packaging)\.?\s*(?:on|date)?\s*[:\-]?\s*"
    r"([0-9]{1,2}[/\-][0-9]{2,4}|[A-Za-z]{3,9}[\s\-][0-9]{2,4})",
    re.IGNORECASE,
)
_EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_PATTERN = re.compile(r"(?:\+?91[\-\s]?)?(?:1800[\-\s]?[0-9\-\s]{6,}|[6-9][0-9]{9})")
_COUNTRY_PATTERN = re.compile(
    r"(?:country\s*of\s*origin|made\s*in|origin)\s*[:\-]?\s*([A-Za-z ]{3,30})", re.IGNORECASE
)
_ADDRESS_HINT_PATTERN = re.compile(
    r"(?:mfg\s*by|manufactured\s*by|packed\s*by|marketed\s*by|mkt\s*by|pvt\.?\s*ltd|private\s*limited|ltd\.?|industries|foods|mills|company|co\.)",
    re.IGNORECASE,
)
_CARE_LABEL_PATTERN = re.compile(r"(?:customer\s*care|consumer\s*care|helpline|grievance)", re.IGNORECASE)

_UNIT_MAP = {
    "g": "g", "gm": "g", "gms": "g", "gram": "g", "grams": "g",
    "kg": "kg", "kgs": "kg", "kilo": "kg", "kilogram": "kg", "kilograms": "kg",
    "ml": "ml", "mls": "ml", "millilitre": "ml", "millilitres": "ml", "milliliters": "ml",
    "l": "l", "lt": "l", "ltr": "l", "litre": "l", "litres": "l", "liters": "l",
    "n": "N", "m": "m", "cm": "cm", "mm": "mm",
}

# Rule 7 / Table I minimum numeral heights (mm) by declared quantity band
_MIN_HEIGHT_MM_UPTO_200 = 1.0
_MIN_HEIGHT_MM_200_TO_500 = 2.0
_MIN_HEIGHT_MM_ABOVE_500 = 4.0


def to_normalized_box(box: Optional[List[float]], img_width: int, img_height: int) -> Optional[Dict[str, float]]:
    """Converts a bounding box to normalized percentages (0.0 to 100.0) relative to image dimensions."""
    if not box or len(box) < 4 or img_width <= 0 or img_height <= 0:
        return None
    if len(box) >= 8:
        xs = [box[i] for i in range(0, 8, 2)]
        ys = [box[i] for i in range(1, 8, 2)]
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)
    else:
        x_min, y_min, x_max, y_max = box[0], box[1], box[2], box[3]

    x_pct = max(0.0, min(100.0, (x_min / img_width) * 100.0))
    y_pct = max(0.0, min(100.0, (y_min / img_height) * 100.0))
    w_pct = max(0.2, min(100.0 - x_pct, ((x_max - x_min) / img_width) * 100.0))
    h_pct = max(0.2, min(100.0 - y_pct, ((y_max - y_min) / img_height) * 100.0))

    return {
        "x": round(x_pct, 2),
        "y": round(y_pct, 2),
        "width": round(w_pct, 2),
        "height": round(h_pct, 2),
    }


def _find_first(pattern: re.Pattern, blocks: List[OCRBlock]):
    for b in blocks:
        m = pattern.search(b["text"])
        if m:
            return {"block": b, "match": m}
    return None


def _field(value, raw_match, confidence, block, normalized_box=None) -> Dict[str, Any]:
    return {
        "value": value,
        "raw_match": raw_match if raw_match is not None else value,
        "confidence": confidence,
        "source_block_index": block["block_index"] if block else None,
        "bounding_box": block["bounding_box"] if block else None,
        "normalized_box": normalized_box,
    }


def _normalize_unit(unit: str) -> Optional[str]:
    return _UNIT_MAP.get(unit.lower())


def extract_structured_fields(
    blocks: List[OCRBlock],
    img_width: int = 0,
    img_height: int = 0,
) -> Dict[str, Dict[str, Any]]:
    fields: Dict[str, Dict[str, Any]] = {}

    mfg_hit = _find_first(_ADDRESS_HINT_PATTERN, blocks)
    fields["manufacturer"] = (
        _field(
            mfg_hit["block"]["text"].strip(),
            mfg_hit["block"]["text"],
            mfg_hit["block"]["confidence"],
            mfg_hit["block"],
            to_normalized_box(mfg_hit["block"]["bounding_box"], img_width, img_height),
        )
        if mfg_hit else _field(None, None, 0.0, None, None)
    )

    # 1. Statutory Net Quantity Extraction (3-tier prioritization)
    qty_hit = None

    # Priority 1: Explicit statutory net quantity pattern (e.g. "NET QUANTITY: 1 kg")
    for b in blocks:
        m = _EXPLICIT_NET_QTY_PATTERN.search(b["text"])
        if m:
            qty_hit = {"block": b, "match": m, "source": "explicit"}
            break

    # Priority 2: Multi-line detection (e.g. Block i: "NET QUANTITY", Block i+1: "1 kg")
    if not qty_hit:
        for i in range(len(blocks) - 1):
            b1, b2 = blocks[i], blocks[i + 1]
            if _NET_QTY_HEADER_PATTERN.search(b1["text"].strip()):
                m2 = _FALLBACK_NET_QTY_PATTERN.search(b2["text"])
                if m2:
                    qty_hit = {"block": b2, "match": m2, "source": "multiline"}
                    break

    # Priority 3: Fallback on non-nutritional lines (strictly excludes nutritional tables / serving sizes)
    if not qty_hit:
        for b in blocks:
            if _NUTRITIONAL_NOISE_PATTERN.search(b["text"]):
                continue
            m = _FALLBACK_NET_QTY_PATTERN.search(b["text"])
            if m:
                qty_hit = {"block": b, "match": m, "source": "fallback"}
                break

    if qty_hit:
        m, block = qty_hit["match"], qty_hit["block"]
        number, unit = m.group(1), m.group(2)
        normalized_unit = _normalize_unit(unit)
        value = f"{number}{normalized_unit}" if normalized_unit else f"{number} {unit}"
        norm_box = to_normalized_box(block["bounding_box"], img_width, img_height) if block else None
        fields["net_quantity"] = _field(value, m.group(0), block["confidence"], block, norm_box)
    else:
        fields["net_quantity"] = _field(None, None, 0.0, None, None)

    mrp_hit = None
    for b in blocks:
        raw_text = b["text"]
        m = _MRP_PATTERN.search(raw_text)
        if m:
            mrp_hit = {"block": b, "match": m, "raw_text": raw_text}
            break
        # Also try cleaned OCR text for difficult small fonts
        cleaned = _clean_mrp_text(raw_text)
        if cleaned != raw_text:
            m = _MRP_PATTERN.search(cleaned)
            if m:
                mrp_hit = {"block": b, "match": m, "raw_text": raw_text}
                break

    if mrp_hit:
        m, block = mrp_hit["match"], mrp_hit["block"]
        mrp_num = m.group(1).replace('o', '0').replace('O', '0')
        norm_box = to_normalized_box(block["bounding_box"], img_width, img_height)
        fields["mrp"] = _field(f"Rs. {mrp_num}", mrp_hit["raw_text"], block["confidence"], block, norm_box)
    else:
        fields["mrp"] = _field(None, None, 0.0, None, None)

    origin_hit = _find_first(_COUNTRY_PATTERN, blocks)
    if origin_hit:
        m, block = origin_hit["match"], origin_hit["block"]
        norm_box = to_normalized_box(block["bounding_box"], img_width, img_height)
        fields["country_of_origin"] = _field(m.group(1).strip(), block["text"], block["confidence"], block, norm_box)
    else:
        fields["country_of_origin"] = _field(None, None, 0.0, None, None)

    date_hit = _find_first(_DATE_PATTERN, blocks)
    if date_hit:
        m, block = date_hit["match"], date_hit["block"]
        norm_box = to_normalized_box(block["bounding_box"], img_width, img_height)
        fields["manufacture_date"] = _field(m.group(1), block["text"], block["confidence"], block, norm_box)
    else:
        fields["manufacture_date"] = _field(None, None, 0.0, None, None)

    care_block = None
    for b in blocks:
        if _CARE_LABEL_PATTERN.search(b["text"]) or _EMAIL_PATTERN.search(b["text"]) or _PHONE_PATTERN.search(b["text"]):
            care_block = b
            break
    fields["consumer_care"] = (
        _field(
            care_block["text"].strip(),
            care_block["text"],
            care_block["confidence"],
            care_block,
            to_normalized_box(care_block["bounding_box"], img_width, img_height),
        )
        if care_block else _field(None, None, 0.0, None, None)
    )

    product_block = None
    for b in blocks:
        text = b["text"].strip()
        if 3 <= len(text) <= 40 and not any(
            p.search(text) for p in (_MRP_PATTERN, _EXPLICIT_NET_QTY_PATTERN, _FALLBACK_NET_QTY_PATTERN, _DATE_PATTERN, _ADDRESS_HINT_PATTERN)
        ):
            # Prefer brand-like capitalized titles
            if any(char.isupper() for char in text) and not any(noise in text.lower() for noise in ["also", "visit", "dispose", "recycle"]):
                product_block = b
                break
            elif not product_block:
                product_block = b

    if product_block:
        fields["product_name"] = _field(
            product_block["text"].strip(),
            product_block["text"],
            product_block["confidence"],
            product_block,
            to_normalized_box(product_block["bounding_box"], img_width, img_height),
        )

    # Attach metadata for frontend bounding box inspection overlay
    fields["_metadata"] = {
        "image_width": img_width,
        "image_height": img_height,
        "ocr_blocks": [
            {
                "block_index": b.get("block_index", idx),
                "text": b.get("text", ""),
                "confidence": round(b.get("confidence", 0.9), 2),
                "bounding_box": b.get("bounding_box"),
                "normalized_box": to_normalized_box(b.get("bounding_box"), img_width, img_height),
            }
            for idx, b in enumerate(blocks)
        ],
    }

    return fields


def analyze_font_sizes(
    structured_fields: Dict[str, Any],
    px_per_mm: float = 8.0,
) -> Dict[str, Any]:
    """
    Rule 7/Table I legibility check for net_quantity and mrp numerals.

    `px_per_mm` is a coarse default (roughly a phone photo of a
    palm-sized label at typical distance); without a physical reference
    object in-frame this cannot be exact, so results are always surfaced
    as NEEDS_REVIEW rather than a hard PASS/FAIL, consistent with the
    project's confidence-based review pattern.
    """
    findings: Dict[str, Any] = {}

    for field_name in ("net_quantity", "mrp"):
        field = structured_fields.get(field_name) or {}
        box = field.get("bounding_box")
        if not box or len(box) < 4:
            findings[field_name] = {"status": "NEEDS_REVIEW", "reason": "No bounding box available for font measurement."}
            continue

        if len(box) >= 8:
            # 4-point polygon [x1,y1,x2,y2,x3,y3,x4,y4] (PaddleOCR format)
            ys = box[1::2]
            pixel_height = max(ys) - min(ys)
        else:
            # Axis-aligned [x1,y1,x2,y2] (mock engine format)
            pixel_height = abs(box[3] - box[1])

        height_mm = pixel_height / px_per_mm if px_per_mm else 0

        threshold = _MIN_HEIGHT_MM_UPTO_200
        findings[field_name] = {
            "status": "NEEDS_REVIEW",
            "estimated_height_mm": round(height_mm, 2),
            "minimum_required_mm": threshold,
            "reason": (
                f"Estimated numeral height ~{height_mm:.1f}mm based on image pixel geometry "
                f"(no physical scale reference in-frame — officer to verify against Rule 7/Table I "
                f"in person before treating as conclusive)."
            ),
        }

    return findings
