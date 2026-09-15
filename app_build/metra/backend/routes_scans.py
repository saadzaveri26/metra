import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from db import get_db
from models import Scan, ScanStatus, Case
from security import get_current_user, validate_id, safe_join
from config import settings
from ocr_engine import extract_text_blocks
from field_structuring import extract_structured_fields, analyze_font_sizes
from rules_engine import evaluate_compliance
from risk_engine import compute_risk_score
from mismatch_check import check_mismatches
from repository import get_manufacturer_violation_count, create_case_if_needed
from schemas import ScanOut, ScanOverrideRequest, CaseOut

router = APIRouter(tags=["scans"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _save_upload(contents: bytes, ext: str, subdir: str) -> str:
    target_dir = safe_join(settings.UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)
    import uuid
    filename = f"{uuid.uuid4().hex}{ext}"
    path = safe_join(str(target_dir), filename)
    with open(path, "wb") as f:
        f.write(contents)
    return str(path)


@router.post("/scans", response_model=ScanOut, status_code=201)
async def create_scan(
    file: UploadFile = File(...),
    is_imported: bool = Form(False),
    interface: str = Form(...),
    listed_mrp: Optional[str] = Form(None),
    listed_net_quantity: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Full pipeline: image -> OCR (threadpooled) -> field structuring ->
    font analysis -> compliance matrix -> risk score -> mismatch check ->
    case auto-creation on non-COMPLIANT outcome.
    """
    if interface not in ("consumer", "vendor", "inspector"):
        raise HTTPException(status_code=400, detail="interface must be consumer, vendor, or inspector")

    user_role = user.get("role")
    normalized_user_role = "officer" if user_role in ("officer", "inspector") else user_role
    if interface == "inspector" and normalized_user_role != "officer":
        raise HTTPException(status_code=403, detail="Forbidden: Inspector interface requires officer or inspector role")
    if interface == "vendor" and user_role not in ("vendor", "officer", "inspector", "hq", "headquarters"):
        raise HTTPException(status_code=403, detail="Forbidden: Vendor interface requires vendor, officer, or headquarters role")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext or 'unknown'}")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    chunks = []
    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB chunk streaming
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB",
            )
        chunks.append(chunk)

    contents = b"".join(chunks)
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file upload")

    try:
        image_path = _save_upload(contents, ext, subdir=interface)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Could not save upload: {e}")

    scan = Scan(
        user_id=user["sub"], interface=interface, image_path=image_path,
        is_imported=is_imported, status=ScanStatus.processing,
        state_region=user.get("state_region"),
    )
    db.add(scan); db.commit(); db.refresh(scan)

    try:
        fixture_hint = os.path.splitext(file.filename or "")[0]
        blocks = await run_in_threadpool(extract_text_blocks, contents, fixture_hint)

        structured_fields = extract_structured_fields(blocks)
        product_name_field = structured_fields.pop("product_name", None)
        font_analysis = analyze_font_sizes(structured_fields)

        compliance = evaluate_compliance(structured_fields=structured_fields, is_imported=is_imported)

        manufacturer_name = (structured_fields.get("manufacturer") or {}).get("value")
        prior_violations = get_manufacturer_violation_count(db, manufacturer_name)
        risk_score = compute_risk_score(
            compliance["compliance_summary"], compliance["compliance_results"], prior_violations
        )

        mismatch_flags = check_mismatches(structured_fields, listed_mrp, listed_net_quantity)

        scan.ocr_raw_text = "\n".join(b["text"] for b in blocks)
        scan.structured_fields = structured_fields
        scan.font_analysis = font_analysis
        scan.compliance_summary = compliance["compliance_summary"]
        scan.compliance_results = compliance["compliance_results"]
        scan.risk_score = risk_score
        scan.mismatch_flags = mismatch_flags
        scan.status = ScanStatus.completed

        new_case = create_case_if_needed(db, scan)
        if new_case:
            try:
                from notifications import send_notification
                violations = []
                for res in (scan.compliance_results or []):
                    if res.get("status") in ("NON_COMPLIANT", "FAIL"):
                        violations.append({
                            "rule": res.get("rule_name", "Statutory Rule"),
                            "reason": res.get("reason", "Mandatory declaration non-compliance"),
                        })
                send_notification(
                    template="case_notice",
                    to_email=f"compliance@{(new_case.manufacturer_name or 'manufacturer').lower().replace(' ', '')}.com",
                    recipient_name=f"Managing Director / Compliance Head, {new_case.manufacturer_name or 'Packaged Commodity Manufacturer'}",
                    data={
                        "case_id": new_case.id,
                        "scan_id": scan.id,
                        "manufacturer_name": new_case.manufacturer_name or "Unknown Manufacturer",
                        "risk_score": scan.risk_score,
                        "overall_status": new_case.overall_status,
                        "violations": violations,
                        "deadline_days": 15,
                    },
                )
            except Exception as notif_err:
                print(f"[NOTIFICATION WARNING] Could not dispatch case notice: {notif_err}")
        elif scan.interface == "vendor" and scan.compliance_summary and scan.compliance_summary.get("overall_status") != "COMPLIANT":
            try:
                from notifications import send_notification
                brand = (scan.structured_fields or {}).get("brand", {}).get("value") or (scan.structured_fields or {}).get("manufacturer", {}).get("value") or "Packaged Commodity"
                send_notification(
                    template="vendor_advisory",
                    to_email=user.get("email") or "vendor@metra.gov.in",
                    recipient_name=user.get("full_name") or user.get("name") or "Vendor Compliance Team",
                    data={
                        "brand_name": brand,
                        "scan_ref": scan.id,
                        "issues_count": len(scan.compliance_results or []),
                    },
                )
            except Exception as notif_err:
                print(f"[NOTIFICATION WARNING] Could not dispatch vendor advisory: {notif_err}")

    except RuntimeError as e:
        scan.status = ScanStatus.failed
        db.commit()
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        scan.status = ScanStatus.failed
        db.commit()
        raise HTTPException(status_code=500, detail=f"Scan processing failed unexpectedly: {e}")

    db.commit(); db.refresh(scan)
    return scan


@router.get("/scans/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    validate_id(scan_id, "scan_id")
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if user["role"] in ("consumer", "vendor") and scan.user_id != user["sub"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this scan")
    return scan


@router.get("/scans", response_model=List[ScanOut])
def list_scans(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    query = db.query(Scan)
    user_role = user.get("role")
    normalized_user_role = (
        "officer"
        if user_role in ("officer", "inspector")
        else ("headquarters" if user_role in ("hq", "headquarters") else user_role)
    )
    if normalized_user_role in ("consumer", "vendor"):
        query = query.filter(Scan.user_id == user["sub"])
    elif normalized_user_role == "headquarters" and user.get("state_region") not in (None, "ALL"):
        query = query.filter(Scan.state_region == user["state_region"])
    return query.order_by(Scan.created_at.desc()).limit(200).all()


@router.post("/scans/{scan_id}/override", response_model=ScanOut)
def override_scan(
    scan_id: str, payload: ScanOverrideRequest,
    db: Session = Depends(get_db), user: dict = Depends(get_current_user),
):
    validate_id(scan_id, "scan_id")
    user_role = user.get("role")
    normalized_user_role = "officer" if user_role in ("officer", "inspector") else user_role
    if normalized_user_role != "officer":
        raise HTTPException(status_code=403, detail="Only officers/inspectors may override scan fields")

    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    overrides = {
        o.field_name: {"value": o.value, "is_authoritative": o.is_authoritative,
                        "reason": o.reason, "overridden_by": user.get("full_name") or "Officer"}
        for o in payload.overrides
    }
    compliance = evaluate_compliance(
        structured_fields=scan.structured_fields or {}, is_imported=scan.is_imported,
        officer_overrides=overrides,
    )
    manufacturer_name = ((scan.structured_fields or {}).get("manufacturer") or {}).get("value")
    prior_violations = get_manufacturer_violation_count(db, manufacturer_name)
    risk_score = compute_risk_score(compliance["compliance_summary"], compliance["compliance_results"], prior_violations)

    scan.compliance_summary = compliance["compliance_summary"]
    scan.compliance_results = compliance["compliance_results"]
    scan.risk_score = risk_score
    scan.officer_overrides = overrides

    # Re-evaluate case status against the corrected compliance outcome.
    existing_case = db.query(Case).filter(Case.scan_id == scan.id).first()
    if existing_case:
        existing_case.overall_status = compliance["compliance_summary"]["overall_status"]
        existing_case.risk_score = risk_score
    else:
        create_case_if_needed(db, scan)

    db.commit(); db.refresh(scan)
    return scan


@router.get("/cases", response_model=List[CaseOut])
def list_cases(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_role = user.get("role")
    normalized_user_role = (
        "officer"
        if user_role in ("officer", "inspector")
        else ("headquarters" if user_role in ("hq", "headquarters") else user_role)
    )
    if normalized_user_role not in ("officer", "headquarters"):
        raise HTTPException(status_code=403, detail="Not authorized to view cases")
    query = db.query(Case)
    if normalized_user_role == "headquarters" and user.get("state_region") not in (None, "ALL"):
        query = query.filter(Case.state_region == user["state_region"])
    return query.order_by(Case.opened_at.desc()).limit(200).all()


@router.get("/cases/{case_id}", response_model=CaseOut)
def get_case(case_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    validate_id(case_id, "case_id")
    user_role = user.get("role")
    normalized_user_role = (
        "officer"
        if user_role in ("officer", "inspector")
        else ("headquarters" if user_role in ("hq", "headquarters") else user_role)
    )
    if normalized_user_role not in ("officer", "headquarters"):
        raise HTTPException(status_code=403, detail="Not authorized to view cases")
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
