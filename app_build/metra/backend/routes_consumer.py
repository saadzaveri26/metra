import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db import get_db
from models import ConsumerReport, SafetyAlert, Scan, ScanStatus, gen_id
from security import decode_access_token, validate_id, safe_join
from config import settings
from open_food_facts import fetch_product_nutrition
from schemas import ConsumerLookupOut, ConsumerDeclarationItem, ConsumerReportOut, SafetyAlertOut

router = APIRouter(prefix="/consumer", tags=["consumer"])

optional_bearer = HTTPBearer(auto_error=False)
ALLOWED_REPORT_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _get_optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        return decode_access_token(creds.credentials)
    except Exception:
        return None


def _save_consumer_evidence(contents: bytes, ext: str) -> str:
    target_dir = safe_join(settings.UPLOAD_DIR, "consumer_reports")
    os.makedirs(target_dir, exist_ok=True)
    filename = f"report_{gen_id()}{ext}"
    path = safe_join(str(target_dir), filename)
    with open(path, "wb") as f:
        f.write(contents)
    return str(path)


@router.get("/lookup", response_model=ConsumerLookupOut)
async def lookup_product_compliance_and_health(
    barcode: str = Query(..., description="Package barcode number"),
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(_get_optional_user),
):
    """
    Combined public consumer lookup:
    1. Simplified PCR 2011 compliance checks (mandatory declarations present/valid).
    2. Open Food Facts nutritional profile (Nutri-Score, NOVA group, nutrients, allergens).
    3. Active safety & recall check.

    CRITICAL STATUTORY GROUND RULE:
    Internal officer risk scores (0-100) are NEVER exposed to consumers.
    """
    clean_barcode = barcode.strip().replace(" ", "").replace("-", "")
    if not clean_barcode:
        raise HTTPException(status_code=400, detail="Barcode cannot be empty")

    # 1. Fetch Open Food Facts health and nutrition data
    nutrition_raw = await fetch_product_nutrition(clean_barcode)

    # 2. Check for active safety / recall alerts matching this barcode or product
    prod_name = nutrition_raw.get("product_name", "")
    brand = nutrition_raw.get("brands", "")
    category = nutrition_raw.get("categories", "Packaged Food")

    active_alert = (
        db.query(SafetyAlert)
        .filter(
            (SafetyAlert.product_name.ilike(f"%{prod_name[:15]}%"))
            | (SafetyAlert.brand_name.ilike(f"%{brand[:15]}%"))
        )
        .order_by(SafetyAlert.created_at.desc())
        .first()
    )

    has_active_recall = active_alert is not None
    recall_warning = (
        f"Active {active_alert.severity.upper()} alert: {active_alert.title}"
        if active_alert
        else None
    )

    # 3. Informational reference: mandatory label fields required under PCR 2011 Rule 6.
    # NOTE: A barcode-only lookup CANNOT verify actual label compliance — that requires
    # a physical inspection or OCR scan of the label. These items tell the consumer
    # what to look for on the package, not whether the package is compliant.
    net_qty = nutrition_raw.get("quantity", None)
    mandatory_info = [
        ConsumerDeclarationItem(
            field="Maximum Retail Price (MRP)",
            statutory_rule="Rule 6(1)(e)",
            status="INFO",
            findings="Must be printed inclusive of all taxes. Check physical label.",
            declared_value=None,
        ),
        ConsumerDeclarationItem(
            field="Unit Sale Price (USP)",
            statutory_rule="Rule 6(11)",
            status="INFO",
            findings="Unit price per gram/ml must be stated for fair comparison.",
            declared_value=None,
        ),
        ConsumerDeclarationItem(
            field="Net Quantity",
            statutory_rule="Rule 6(1)(b)",
            status="INFO",
            findings="Must be stated in standard metric units (g, ml, L, kg).",
            declared_value=net_qty,
        ),
        ConsumerDeclarationItem(
            field="Month & Year of Manufacture / Packing",
            statutory_rule="Rule 6(1)(d)",
            status="INFO",
            findings="Packaging or manufacturing date must be clearly legible.",
            declared_value=None,
        ),
        ConsumerDeclarationItem(
            field="Manufacturer / Packer Details",
            statutory_rule="Rule 6(1)(a)",
            status="INFO",
            findings="Legal name and physical address of manufacturer/packer required.",
            declared_value=brand or None,
        ),
        ConsumerDeclarationItem(
            field="Consumer Care Contact",
            statutory_rule="Rule 6(1)(da)",
            status="INFO",
            findings="Consumer helpline contact (phone/email) must be on label.",
            declared_value=None,
        ),
    ]

    return ConsumerLookupOut(
        barcode=clean_barcode,
        product_name=prod_name,
        brand_manufacturer=brand,
        category=category,
        mandatory_label_info=mandatory_info,
        nutrition=nutrition_raw,
        has_active_recall=has_active_recall,
        recall_warning=recall_warning,
    )


@router.post("/reports", response_model=ConsumerReportOut, status_code=201)
async def submit_consumer_report(
    product_name: str = Form(...),
    store_location: str = Form(...),
    violation_type: str = Form(...),
    description: str = Form(...),
    barcode: Optional[str] = Form(None),
    brand_manufacturer: Optional[str] = Form(None),
    state_region: Optional[str] = Form(None),
    evidence_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(_get_optional_user),
):
    """
    Submits a citizen packaging complaint / irregularity report.

    STATUTORY GROUND RULE:
    Stored as an 'unverified_lead' for officer triage.
    NEVER auto-created as a confirmed enforcement case.
    """
    if not product_name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if not store_location.strip():
        raise HTTPException(status_code=400, detail="Store location is required")
    if not description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    image_path = None
    if evidence_image and evidence_image.filename:
        ext = os.path.splitext(evidence_image.filename)[1].lower()
        if ext not in ALLOWED_REPORT_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_REPORT_EXTENSIONS)}",
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        chunks = []
        total_bytes = 0
        chunk_size = 1024 * 1024
        while True:
            chunk = await evidence_image.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                raise HTTPException(
                    status_code=413,
                    detail=f"Evidence file exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
                )
            chunks.append(chunk)

        evidence_bytes = b"".join(chunks)
        if evidence_bytes:
            image_path = _save_consumer_evidence(evidence_bytes, ext)

    user_id = user["sub"] if user else None
    report = ConsumerReport(
        user_id=user_id,
        barcode=barcode.strip() if barcode else None,
        product_name=product_name.strip(),
        brand_manufacturer=brand_manufacturer.strip() if brand_manufacturer else None,
        store_location=store_location.strip(),
        state_region=state_region.strip() if state_region else None,
        violation_type=violation_type.strip(),
        description=description.strip(),
        image_path=image_path,
        status="unverified_lead",
        created_at=datetime.now(timezone.utc),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=List[ConsumerReportOut])
def list_consumer_reports(
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(_get_optional_user),
):
    """
    Lists citizen reports. If authenticated, returns reports submitted by this user.
    Officers/HQ can list all reports for lead triage.
    """
    query = db.query(ConsumerReport)
    if user:
        role = user.get("role")
        if role in ("consumer", None):
            query = query.filter(ConsumerReport.user_id == user["sub"])
    else:
        return []

    return query.order_by(ConsumerReport.created_at.desc()).limit(100).all()


@router.get("/alerts", response_model=List[SafetyAlertOut])
def list_safety_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity (critical, warning, advisory)"),
    db: Session = Depends(get_db),
):
    """
    Public feed of officer-published commodity safety and packaging recall alerts.
    """
    query = db.query(SafetyAlert)
    if severity:
        query = query.filter(SafetyAlert.severity == severity.lower())
    return query.order_by(SafetyAlert.created_at.desc()).limit(50).all()


@router.get("/history")
def get_consumer_history(
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(_get_optional_user),
):
    """
    Personal activity history for logged-in consumer (reports and scans).
    """
    if not user:
        return {"reports": [], "scans": []}

    sub = user["sub"]
    reports = (
        db.query(ConsumerReport)
        .filter(ConsumerReport.user_id == sub)
        .order_by(ConsumerReport.created_at.desc())
        .limit(20)
        .all()
    )
    scans = (
        db.query(Scan)
        .filter(Scan.user_id == sub, Scan.interface == "consumer")
        .order_by(Scan.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "reports": [
            {
                "id": r.id,
                "product_name": r.product_name,
                "violation_type": r.violation_type,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ],
        "scans": [
            {
                "id": s.id,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "overall_status": (s.compliance_summary or {}).get("overall_status", "COMPLIANT"),
                "created_at": s.created_at.isoformat(),
            }
            for s in scans
        ],
    }
