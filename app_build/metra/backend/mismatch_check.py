"""
Compares on-label extracted values against manually-supplied "listed"
values (e.g. what an e-commerce listing claims) to flag mismatches.

Per spec: no live marketplace scraping this cycle -- listed values are
passed in explicitly by the caller (vendor self-check or inspector
cross-reference). Numeric fields are normalized before comparison;
exact match only, no fuzzy/semantic matching (that's Cycle 2's
seller_registry vector work, not applicable to numeric mismatch anyway).
"""
import re
from typing import Any, Dict, List, Optional

_NUM_RE = re.compile(r"[0-9]+(?:\.[0-9]+)?")


def _normalize_number(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    m = _NUM_RE.search(str(value))
    return float(m.group(0)) if m else None


def check_mismatches(
    structured_fields: Dict[str, Any],
    listed_mrp: Optional[str] = None,
    listed_net_quantity: Optional[str] = None,
) -> List[Dict[str, Any]]:
    flags: List[Dict[str, Any]] = []

    if listed_mrp is not None:
        label_val = _normalize_number((structured_fields.get("mrp") or {}).get("value"))
        listed_val = _normalize_number(listed_mrp)
        if label_val is not None and listed_val is not None and abs(label_val - listed_val) > 0.01:
            flags.append({
                "field": "mrp",
                "on_label_value": (structured_fields.get("mrp") or {}).get("value"),
                "listed_value": listed_mrp,
                "finding": (
                    f"Listed MRP ({listed_mrp}) does not match the MRP printed on the "
                    f"physical label ({(structured_fields.get('mrp') or {}).get('value')})."
                ),
            })

    if listed_net_quantity is not None:
        label_val = _normalize_number((structured_fields.get("net_quantity") or {}).get("value"))
        listed_val = _normalize_number(listed_net_quantity)
        if label_val is not None and listed_val is not None and abs(label_val - listed_val) > 0.01:
            flags.append({
                "field": "net_quantity",
                "on_label_value": (structured_fields.get("net_quantity") or {}).get("value"),
                "listed_value": listed_net_quantity,
                "finding": (
                    f"Listed net quantity ({listed_net_quantity}) does not match the "
                    f"quantity printed on the physical label "
                    f"({(structured_fields.get('net_quantity') or {}).get('value')})."
                ),
            })

    return flags
