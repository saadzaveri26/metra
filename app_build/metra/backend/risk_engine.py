"""
Computes a 0-100 risk score for a completed scan. Purely additive
decision-support signal for prioritizing the inspector's Risk Queue —
never used to auto-generate a penalty (ground rule: officer always
makes the final call).

Factors:
  - violation_count (from rules_engine's compliance_summary)
  - severity: NON_COMPLIANT weighted higher than NEEDS_REVIEW
  - avg extraction confidence (low confidence -> higher review priority,
    since an unreadable label is itself a legibility concern)
  - manufacturer_violation_count on file (repeat-offender signal;
    exact-normalized-name match this cycle, see models.ManufacturerViolationCount)
"""
from typing import Any, Dict


def normalize_manufacturer_name(name: str) -> str:
    return " ".join(name.strip().lower().split()) if name else ""


def compute_risk_score(
    compliance_summary: Dict[str, Any],
    compliance_results: Dict[str, Any],
    prior_manufacturer_violation_count: int = 0,
) -> int:
    violations = compliance_summary.get("violations_count", 0)
    reviews = compliance_summary.get("review_count", 0)
    total = compliance_summary.get("total_fields_checked", 1) or 1

    severity_score = min(60, violations * 15 + reviews * 5)

    confidences = [
        r.get("ai_value") is not None and 1.0 or 0.0  # presence proxy; refined below
        for r in compliance_results.values()
    ]
    # Prefer real confidence if the field carries one via effective_value presence;
    # rules_engine doesn't pass raw confidence through, so this is a coarse proxy
    # based on how many fields resolved to *some* value at all.
    resolved_ratio = sum(confidences) / total if total else 1.0
    confidence_score = round((1 - resolved_ratio) * 20)

    repeat_offender_score = min(20, prior_manufacturer_violation_count * 4)

    score = severity_score + confidence_score + repeat_offender_score
    return max(0, min(100, score))
