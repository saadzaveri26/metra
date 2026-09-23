import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Enum, Integer, Float
from sqlalchemy.orm import relationship

from db import Base


def gen_id() -> str:
    # Matches config.ID_REGEX (^[A-Za-z0-9\-]{8,64}$) so every generated
    # ID is safe to use directly in a file path after validate_id().
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    consumer = "consumer"
    vendor = "vendor"
    inspector = "inspector"
    hq = "hq"


class ScanStatus(str, enum.Enum):
    processing = "processing"
    completed = "completed"
    failed = "failed"


class CaseStatus(str, enum.Enum):
    open = "open"
    under_review = "under_review"
    closed = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    business_name = Column(String, nullable=True)
    gstin = Column(String, nullable=True)

    government_id = Column(String, nullable=True, index=True)
    designation = Column(String, nullable=True)
    department_name = Column(String, nullable=True)
    state_region = Column(String, nullable=True)
    photograph_url = Column(String, nullable=True)
    inspector_verified = Column(Boolean, default=False)

    scans = relationship("Scan", back_populates="user")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    interface = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    is_imported = Column(Boolean, default=False)
    status = Column(Enum(ScanStatus), default=ScanStatus.processing)

    ocr_raw_text = Column(Text, nullable=True)
    structured_fields = Column(JSON, nullable=True)
    font_analysis = Column(JSON, nullable=True)
    compliance_summary = Column(JSON, nullable=True)
    compliance_results = Column(JSON, nullable=True)
    risk_score = Column(Integer, nullable=True)
    mismatch_flags = Column(JSON, nullable=True)
    officer_overrides = Column(JSON, nullable=True)

    state_region = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="scans")
    case = relationship("Case", back_populates="scan", uselist=False)

    @property
    def ocr_blocks(self):
        if self.structured_fields and isinstance(self.structured_fields, dict):
            return self.structured_fields.get("_metadata", {}).get("ocr_blocks")
        return None

    @property
    def image_dimensions(self):
        if self.structured_fields and isinstance(self.structured_fields, dict):
            meta = self.structured_fields.get("_metadata", {})
            w = meta.get("image_width")
            h = meta.get("image_height")
            if w and h:
                return {"width": w, "height": h}
        return None


class Case(Base):
    """
    Auto-created whenever a scan's overall_status != COMPLIANT (per
    spec). METRA remains decision-support only — a Case is a
    review/tracking record, not an automated penalty.
    """
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=gen_id)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, unique=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.open)
    overall_status = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=True)
    manufacturer_name = Column(String, nullable=True)
    state_region = Column(String, nullable=True)
    opened_at = Column(DateTime, default=utcnow)
    closed_at = Column(DateTime, nullable=True)

    scan = relationship("Scan", back_populates="case")
    responses = relationship("CaseResponse", back_populates="case", cascade="all, delete-orphan", order_by="CaseResponse.created_at.desc()")


class CaseResponse(Base):
    """
    Vendor-submitted response / clarification to an enforcement case notice.
    Stored as an append-only linked record and never overwrites the original violation record.
    """
    __tablename__ = "case_responses"

    id = Column(String, primary_key=True, default=gen_id)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    vendor_id = Column(String, nullable=False, index=True)
    clarification_text = Column(Text, nullable=False)
    evidence_image_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    case = relationship("Case", back_populates="responses")


class ManufacturerViolationCount(Base):
    """
    Minimal relational stand-in for repeat-offender tracking this cycle
    (exact-match on normalized manufacturer name). Superseded by the
    `seller_registry` Chroma collection in Cycle 2 for fuzzy/inconsistent
    name matching -- see vector_database.md.
    """
    __tablename__ = "manufacturer_violation_counts"

    manufacturer_name_normalized = Column(String, primary_key=True)
    violation_count = Column(Integer, default=0)
    last_violation_at = Column(DateTime, default=utcnow)


class ConsumerReport(Base):
    """
    Citizen-submitted complaints / packaging irregularity reports.
    STATUTORY GROUND RULE: Stored as 'unverified_lead' for officer triage,
    NEVER auto-created as a confirmed enforcement case.
    """
    __tablename__ = "consumer_reports"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, nullable=True, index=True)  # Nullable for anonymous reporting
    barcode = Column(String, nullable=True, index=True)
    product_name = Column(String, nullable=False)
    brand_manufacturer = Column(String, nullable=True)
    store_location = Column(String, nullable=False)
    state_region = Column(String, nullable=True)
    violation_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_path = Column(String, nullable=True)
    status = Column(String, default="unverified_lead", index=True)  # unverified_lead, assigned, verified, dismissed
    created_at = Column(DateTime, default=utcnow)


class SafetyAlert(Base):
    """
    Public safety and recall alerts issued by Legal Metrology inspection officers / HQ.
    """
    __tablename__ = "safety_alerts"

    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    brand_name = Column(String, nullable=False)
    batch_number = Column(String, nullable=True)
    hazard_type = Column(String, nullable=False)  # mislabeled_mrp, net_quantity_shortage, deceptive_packaging, recall
    severity = Column(String, default="warning")  # critical, warning, advisory
    description = Column(Text, nullable=False)
    published_by = Column(String, default="Legal Metrology Directorate")
    state_region = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class ComplianceRulePolicy(Base):
    """
    Statutory policy entries managed strictly by Headquarters.
    Defines mandatory declaration rules, severities, and compounding penalties.
    """
    __tablename__ = "compliance_rule_policies"

    id = Column(String, primary_key=True, default=gen_id)
    rule_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, default="all")  # packaged_food, cosmetics, electronics, general, all
    statutory_reference = Column(String, nullable=False)
    severity = Column(String, default="MAJOR")  # CRITICAL, MAJOR, MINOR
    description = Column(Text, nullable=False)
    penalty_clause = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, default="Legal Metrology Directorate")
    updated_by = Column(String, default="Legal Metrology Directorate")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


