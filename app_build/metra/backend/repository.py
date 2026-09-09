from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from models import ManufacturerViolationCount, Case, Scan
from risk_engine import normalize_manufacturer_name


def get_manufacturer_violation_count(db: Session, manufacturer_name: Optional[str]) -> int:
    if not manufacturer_name:
        return 0
    normalized = normalize_manufacturer_name(manufacturer_name)
    row = db.query(ManufacturerViolationCount).filter_by(manufacturer_name_normalized=normalized).first()
    return row.violation_count if row else 0


def bump_manufacturer_violation_count(db: Session, manufacturer_name: Optional[str]) -> None:
    if not manufacturer_name:
        return
    normalized = normalize_manufacturer_name(manufacturer_name)
    row = db.query(ManufacturerViolationCount).filter_by(manufacturer_name_normalized=normalized).first()
    if row:
        row.violation_count += 1
    else:
        row = ManufacturerViolationCount(manufacturer_name_normalized=normalized, violation_count=1)
        db.add(row)


def create_case_if_needed(db: Session, scan: Scan) -> Optional[Case]:
    """Auto-creates a Case when overall_status != COMPLIANT (per spec)."""
    if not scan.compliance_summary:
        return None
    overall = scan.compliance_summary.get("overall_status")
    if overall == "COMPLIANT":
        return None

    manufacturer_name = None
    if scan.structured_fields and scan.structured_fields.get("manufacturer"):
        manufacturer_name = scan.structured_fields["manufacturer"].get("value")

    if overall == "NON_COMPLIANT":
        bump_manufacturer_violation_count(db, manufacturer_name)

    case = Case(
        scan_id=scan.id,
        overall_status=overall,
        risk_score=scan.risk_score,
        manufacturer_name=manufacturer_name,
        state_region=scan.state_region,
    )
    db.add(case)
    return case
