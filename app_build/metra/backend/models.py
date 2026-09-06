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
