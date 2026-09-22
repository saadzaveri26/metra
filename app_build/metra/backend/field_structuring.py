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
    r"(?:mrp|m\.?r\.?p\.?|max(?:imum)?\.?\s*retail\s*price)"
    r"(?:[^\d\n]{0,40}?)"
    r"(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)",
    re.IGNORECASE,
)
_NET_QTY_PATTERN = re.compile(
    r"(?:net\s*(?:qty|quantity|weight|wt|content)s?\s*[:\-]?\s*)?"
    r"([0-9]+(?:\.[0-9]+)?)\s*"
    r"(g|gm|gms|gram|grams|kg|kgs|kilo|kilogram|ml|mls|millilitre|millilitres|"
    r"l|lt|ltr|litre|litres|liters|n|m|cm|mm|units?|pcs|pieces|doz)\b",
    re.IGNORECASE,
)
_DATE_PATTERN = re.compile(
    r"(?:mfg|manufactured?|packed|packaging|pkd)\.?\s*(?:on|date)?\s*[:\-]?\s*"
    r"([0-9]{1,2}[/\-][0-9]{2,4}|[A-Za-z]{3,9}[\s\-][0-9]{2,4})",
    re.IGNORECASE,
)
_EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_PATTERN = re.compile(r"(?:\+?91[\-\s]?)?(?:1800[\-\s]?[0-9\-\s]{6,}|[6-9][0-9]{9})")
_COUNTRY_PATTERN = re.compile(
    r"(?:country\s*of\s*origin|made\s*in|origin)\s*[:\-]?\s*([A-Za-z ]{3,30})", re.IGNORECASE
)
_ADDRESS_HINT_PATTERN = re.compile(
    r"(?:pvt\.?\s*ltd|private\s*limited|ltd\.?|industries|foods|mills|company|co\.|"
    r"manufactured\s*by|packed\s*by|marketed\s*by)", re.IGNORECASE,
)
_CARE_LABEL_PATTERN = re.compile(r"(?:customer\s*care|consumer\s*care|helpline|grievance)", re.IGNORECASE)

_UNIT_MAP = {
    "g": "g", "gm": "g", "gms": "g", "gram": "g", "grams": "g",
    "kg": "kg", "kgs": "kg", "kilo": "kg", "kilogram": "kg",
    "ml": "ml", "mls": "ml", "millilitre": "ml", "millilitres": "ml",
    "l": "l", "lt": "l", "ltr": "l", "litre": "l", "litres": "l", "liters": "l",
    "n": "N", "m": "m", "cm": "cm", "mm": "mm",
}

# Rule 7 / Table I minimum numeral heights (mm) by declared quantity band,
# for the "normal case" column. Font analysis here is a heuristic based on
# bounding-box pixel height relative to the block's estimated DPI context;
# flagged NEEDS_REVIEW rather than a hard fail, since pixel->mm conversion
# without a physical reference in-frame is inherently approximate.
_MIN_HEIGHT_MM_UPTO_200 = 1.0
_MIN_HEIGHT_MM_200_TO_500 = 2.0
_MIN_HEIGHT_MM_ABOVE_500 = 4.0


def _find_first(pattern: re.Pattern, blocks: List[OCRBlock]):
    for b in blocks:
        m = pattern.search(b["text"])
        if m:
            return {"block": b, "match": m}
    return None


def _field(value, raw_match, confidence, block) -> Dict[str, Any]:
    return {
        "value": value,
        "raw_match": raw_match if raw_match is not None else value,
        "confidence": confidence,
        "source_block_index": block["block_index"] if block else None,
        "bounding_box": block["bounding_box"] if block else None,
    }


def _normalize_unit(unit: str) -> Optional[str]:
    return _UNIT_MAP.get(unit.lower())


def extract_structured_fields(blocks: List[OCRBlock]) -> Dict[str, Dict[str, Any]]:
    fields: Dict[str, Dict[str, Any]] = {}

    mfg_hit = _find_first(_ADDRESS_HINT_PATTERN, blocks)
    fields["manufacturer"] = (
        _field(mfg_hit["block"]["text"].strip(), mfg_hit["block"]["text"], mfg_hit["block"]["confidence"], mfg_hit["block"])
        if mfg_hit else _field(None, None, 0.0, None)
    )

    qty_hit = _find_first(_NET_QTY_PATTERN, blocks)
    if qty_hit:
        m, block = qty_hit["match"], qty_hit["block"]
        number, unit = m.group(1), m.group(2)
        normalized_unit = _normalize_unit(unit)
        value = f"{number}{normalized_unit}" if normalized_unit else f"{number} {unit}"
        fields["net_quantity"] = _field(value, m.group(0), block["confidence"], block)
    else:
        fields["net_quantity"] = _field(None, None, 0.0, None)

    mrp_hit = _find_first(_MRP_PATTERN, blocks)
    if mrp_hit:
        m, block = mrp_hit["match"], mrp_hit["block"]
        fields["mrp"] = _field(f"Rs. {m.group(1)}", block["text"], block["confidence"], block)
    else:
        fields["mrp"] = _field(None, None, 0.0, None)

    origin_hit = _find_first(_COUNTRY_PATTERN, blocks)
    if origin_hit:
        m, block = origin_hit["match"], origin_hit["block"]
        fields["country_of_origin"] = _field(m.group(1).strip(), block["text"], block["confidence"], block)
    else:
        fields["country_of_origin"] = _field(None, None, 0.0, None)

    date_hit = _find_first(_DATE_PATTERN, blocks)
    if date_hit:
        m, block = date_hit["match"], date_hit["block"]
        fields["manufacture_date"] = _field(m.group(1), block["text"], block["confidence"], block)
    else:
        fields["manufacture_date"] = _field(None, None, 0.0, None)

    care_block = None
    for b in blocks:
        if _CARE_LABEL_PATTERN.search(b["text"]) or _EMAIL_PATTERN.search(b["text"]) or _PHONE_PATTERN.search(b["text"]):
            care_block = b
            break
    fields["consumer_care"] = (
        _field(care_block["text"].strip(), care_block["text"], care_block["confidence"], care_block)
        if care_block else _field(None, None, 0.0, None)
    )

    product_block = None
    for b in blocks:
        text = b["text"].strip()
        if 3 <= len(text) <= 40 and not any(
            p.search(text) for p in (_MRP_PATTERN, _NET_QTY_PATTERN, _DATE_PATTERN, _ADDRESS_HINT_PATTERN)
        ):
            product_block = b
            break
    if product_block:
        fields["product_name"] = _field(product_block["text"].strip(), product_block["text"],
                                         product_block["confidence"], product_block)

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
