import os
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from db import get_db
from models import Scan, Case, CaseResponse, CaseStatus, User, gen_id
from security import require_roles, validate_id, safe_join
from config import settings
from schemas import CaseOut, CaseDetailOut, CaseResponseOut, VendorOverviewOut, GuidanceRuleItem

router = APIRouter(prefix="/vendor", tags=["vendor"])

ALLOWED_EVIDENCE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}


def _save_evidence_upload(contents: bytes, ext: str) -> str:
    target_dir = safe_join(settings.UPLOAD_DIR, "vendor_evidence")
    os.makedirs(target_dir, exist_ok=True)
    filename = f"evidence_{gen_id()}{ext}"
    path = safe_join(str(target_dir), filename)
    with open(path, "wb") as f:
        f.write(contents)
    return str(path)


@router.get("/overview", response_model=VendorOverviewOut)
def get_vendor_overview(
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("vendor")),
):
    """
    Returns aggregated metrics for the logged-in vendor's pre-market self-checks
    and official compliance notices.
    """
    vendor_sub = user["sub"]

    # Retrieve vendor profile details if available in local DB
    db_user = db.query(User).filter(User.id == vendor_sub).first()
    business_name = (
        (db_user.business_name if db_user else None)
        or user.get("raw_claims", {}).get("public_metadata", {}).get("business_name")
        or "Enterprise Partner"
    )
    gstin = (db_user.gstin if db_user else None) or user.get("raw_claims", {}).get("public_metadata", {}).get("gstin")

    # Advisory self-checks run by this vendor
    scans = db.query(Scan).filter(Scan.user_id == vendor_sub, Scan.interface == "vendor").all()
    total_self_checks = len(scans)

    compliant_checks = sum(
        1
        for s in scans
        if s.compliance_summary and s.compliance_summary.get("overall_status") == "COMPLIANT"
    )
    compliance_rate = round((compliant_checks / total_self_checks * 100), 1) if total_self_checks > 0 else 100.0

    # Open regulatory cases linked to this vendor
    case_query = db.query(Case).filter(Case.status != CaseStatus.closed)
    if business_name and business_name != "Enterprise Partner":
        case_query = case_query.filter(
            (Case.manufacturer_name.ilike(f"%{business_name}%")) | (Case.scan.has(Scan.user_id == vendor_sub))
        )
    else:
        case_query = case_query.filter(Case.scan.has(Scan.user_id == vendor_sub))

    open_cases_count = case_query.count()

    return VendorOverviewOut(
        total_self_checks=total_self_checks,
        compliance_rate=compliance_rate,
        open_cases_count=open_cases_count,
        business_name=business_name,
        gstin=gstin,
    )


@router.get("/cases", response_model=List[CaseOut])
def list_vendor_cases(
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("vendor", "officer", "headquarters")),
):
    """
    Lists enforcement cases / notices linked to this vendor's enterprise.
    """
    vendor_sub = user["sub"]
    db_user = db.query(User).filter(User.id == vendor_sub).first()
    business_name = (
        (db_user.business_name if db_user else None)
        or user.get("raw_claims", {}).get("public_metadata", {}).get("business_name")
    )

    query = db.query(Case)
    # If role is vendor, restrict to their business or user id
    if user.get("role") == "vendor":
        if business_name:
            query = query.filter(
                (Case.manufacturer_name.ilike(f"%{business_name}%")) | (Case.scan.has(Scan.user_id == vendor_sub))
            )
        else:
            query = query.filter(Case.scan.has(Scan.user_id == vendor_sub))

    return query.order_by(Case.opened_at.desc()).all()


@router.get("/cases/{case_id}", response_model=CaseDetailOut)
def get_vendor_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("vendor", "officer", "headquarters")),
):
    """
    Retrieves full details of an enforcement case, including original findings
    and vendor responses.
    """
    validate_id(case_id, "case_id")
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    vendor_sub = user["sub"]
    if user.get("role") == "vendor":
        db_user = db.query(User).filter(User.id == vendor_sub).first()
        business_name = (
            (db_user.business_name if db_user else None)
            or user.get("raw_claims", {}).get("public_metadata", {}).get("business_name")
        )
        is_owner = (
            (case.scan and case.scan.user_id == vendor_sub)
            or (business_name and case.manufacturer_name and business_name.lower() in case.manufacturer_name.lower())
        )
        if not is_owner:
            raise HTTPException(status_code=403, detail="Not authorized to access this case notice")

    return case


@router.post("/cases/{case_id}/respond", response_model=CaseResponseOut, status_code=201)
async def submit_case_response(
    case_id: str,
    clarification_text: str = Form(...),
    evidence_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("vendor")),
):
    """
    Submits a formal clarification response to an open case notice.
    Creates an append-only CaseResponse record without overwriting original officer findings,
    and transitions case status to 'under_review'.
    """
    validate_id(case_id, "case_id")
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    vendor_sub = user["sub"]
    db_user = db.query(User).filter(User.id == vendor_sub).first()
    business_name = (
        (db_user.business_name if db_user else None)
        or user.get("raw_claims", {}).get("public_metadata", {}).get("business_name")
    )
    is_owner = (
        (case.scan and case.scan.user_id == vendor_sub)
        or (business_name and case.manufacturer_name and business_name.lower() in case.manufacturer_name.lower())
    )
    if not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this case notice")

    if not clarification_text.strip():
        raise HTTPException(status_code=400, detail="Clarification text cannot be empty")

    evidence_path = None
    if evidence_file and evidence_file.filename:
        ext = os.path.splitext(evidence_file.filename)[1].lower()
        if ext not in ALLOWED_EVIDENCE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EVIDENCE_EXTENSIONS)}",
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        chunks = []
        total_bytes = 0
        chunk_size = 1024 * 1024
        while True:
            chunk = await evidence_file.read(chunk_size)
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
            evidence_path = _save_evidence_upload(evidence_bytes, ext)

    response = CaseResponse(
        case_id=case_id,
        vendor_id=vendor_sub,
        clarification_text=clarification_text.strip(),
        evidence_image_path=evidence_path,
        created_at=datetime.now(timezone.utc),
    )
    db.add(response)

    # Transition case to under_review if still open
    if case.status == CaseStatus.open:
        case.status = CaseStatus.under_review

    db.commit()
    db.refresh(response)
    return response


@router.get("/guidance", response_model=List[GuidanceRuleItem])
def get_pcr_guidance(
    category: Optional[str] = Query("all", description="Product category filter"),
    user: dict = Depends(require_roles("vendor", "officer", "headquarters")),
):
    """
    Provides statutory PCR 2011 compliance checklist rules filtered by commodity category.
    """
    rules = [
        GuidanceRuleItem(
            rule_id="PCR-001",
            title="Name and Address of Manufacturer / Packer / Importer",
            statutory_reference="Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
            description="Every package shall bear the name and complete physical address of the manufacturer, packer, or importer.",
            declaration_requirement="Full company legal name, street/premises address, city, state, and pin code.",
            minimum_font_size="1.5 mm to 4.0 mm depending on principal display panel area.",
            category="all",
        ),
        GuidanceRuleItem(
            rule_id="PCR-002",
            title="Net Quantity Declaration",
            statutory_reference="Rule 6(1)(b) & Rule 12, Legal Metrology (Packaged Commodities) Rules, 2011",
            description="The correct net weight, measure, or numerical count of the commodity shall be prominently displayed.",
            declaration_requirement="Must use standard SI units (g, kg, ml, L) or numbers. Unit Sale Price must accompany commodities sold by weight/volume.",
            minimum_font_size="2.0 mm (up to 200g) up to 6.0 mm (> 1kg).",
            category="all",
        ),
        GuidanceRuleItem(
            rule_id="PCR-003",
            title="Maximum Retail Price (MRP) & Unit Sale Price (USP)",
            statutory_reference="Rule 6(1)(e) & Rule 6(11), Legal Metrology (Packaged Commodities) Rules, 2011",
            description="The retail sale price in Indian Rupees inclusive of all taxes must be clearly stated.",
            declaration_requirement="Format: 'Maximum or Max. Retail Price Rs. XX.XX (incl. of all taxes)' and unit sale price (Rs. per g/ml/piece).",
            minimum_font_size="Same as net quantity minimum height.",
            category="all",
        ),
        GuidanceRuleItem(
            rule_id="PCR-004",
            title="Month and Year of Manufacture / Pre-packing",
            statutory_reference="Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
            description="The month and year in which the commodity is manufactured or pre-packed must be clearly indicated.",
            declaration_requirement="Format: MM/YYYY or Month YYYY (e.g. 03/2026 or March 2026).",
            minimum_font_size="1.5 mm minimum.",
            category="all",
        ),
        GuidanceRuleItem(
            rule_id="PCR-005",
            title="Consumer Care Details",
            statutory_reference="Rule 6(1)(da), Legal Metrology (Packaged Commodities) Rules, 2011",
            description="Every pre-packaged commodity must provide consumer grievance redressal contact details.",
            declaration_requirement="Name, address, telephone number, and email address of designated consumer care representative.",
            minimum_font_size="1.5 mm minimum.",
            category="all",
        ),
        GuidanceRuleItem(
            rule_id="PCR-006",
            title="Country of Origin (For Imported Goods)",
            statutory_reference="Rule 6(1)(g), Legal Metrology (Packaged Commodities) Rules, 2011",
            description="The name of the country of origin or manufacturer country must be prominently mentioned on the label.",
            declaration_requirement="E.g., 'Country of Origin: India' or 'Manufactured in: India / Germany'.",
            minimum_font_size="1.5 mm minimum.",
            category="imported",
        ),
        GuidanceRuleItem(
            rule_id="PCR-007",
            title="Vegetarian / Non-Vegetarian Symbol",
            statutory_reference="FSSAI Packaging Regulations / Legal Metrology Alignment",
            description="Food items must clearly display the green or brown dot symbol within a square border indicating dietary nature.",
            declaration_requirement="Green dot in green square for veg; brown triangle/circle in brown square for non-veg.",
            minimum_font_size="3.0 mm minimum dimension.",
            category="food",
        ),
        GuidanceRuleItem(
            rule_id="PCR-008",
            title="Best Before / Expiry Date (Perishable Goods)",
            statutory_reference="Rule 6(1)(d) proviso & Food Safety and Standards Regulations",
            description="Perishable and consumable items must clearly indicate shelf life limit.",
            declaration_requirement="Format: 'Best Before [Month/Year]' or 'Expiry Date: DD/MM/YYYY'.",
            minimum_font_size="1.5 mm minimum.",
            category="food",
        ),
        GuidanceRuleItem(
            rule_id="PCR-009",
            title="Principal Display Panel (PDP) Size & Contrast",
            statutory_reference="Rule 7, Legal Metrology (Packaged Commodities) Rules, 2011",
            description="All mandatory declarations must appear in a prominent, unambiguous position with distinct color contrast against background.",
            declaration_requirement="Declarations must not be obscured by illustrations, graphics, or seam folds.",
            minimum_font_size="Area-dependent scale (Rule 7, Table 1).",
            category="all",
        ),
    ]

    cat = (category or "all").lower()
    if cat in ("all", ""):
        return rules
    return [r for r in rules if r.category in (cat, "all")]
