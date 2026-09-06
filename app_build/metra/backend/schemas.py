from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


# --- Auth ---

class RegisterConsumer(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class RegisterVendor(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str
    gstin: Optional[str] = None
    phone: Optional[str] = None


class RegisterInspector(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    government_id: str
    designation: str
    department_name: str
    state_region: str
    photograph_url: str
    phone: Optional[str] = None


class RegisterHQ(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    state_region: str
    department_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    state_region: Optional[str] = None
    designation: Optional[str] = None
    department_name: Optional[str] = None
    government_id: Optional[str] = None
    inspector_verified: Optional[bool] = None

    class Config:
        from_attributes = True


# --- Scans ---

class ComplianceFieldResult(BaseModel):
    status: str
    rule_reference: str
    rule_description: str
    act_section: str
    findings: str
    penalty_clause: str
    source_block_index: Optional[int] = None
    bounding_box: Optional[List[float]] = None
    ai_value: Optional[str] = None
    effective_value: Optional[str] = None
    is_overridden: bool = False
    officer_override: Optional[Dict[str, Any]] = None


class ComplianceSummary(BaseModel):
    overall_status: str
    total_fields_checked: int
    compliant_count: int
    violations_count: int
    review_count: int


class ScanOut(BaseModel):
    id: str
    interface: str
    is_imported: bool
    status: str
    compliance_summary: Optional[ComplianceSummary] = None
    compliance_results: Optional[Dict[str, ComplianceFieldResult]] = None
    font_analysis: Optional[Dict[str, Any]] = None
    risk_score: Optional[int] = None
    mismatch_flags: Optional[List[Dict[str, Any]]] = None
    state_region: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfficerOverrideInput(BaseModel):
    field_name: str
    value: str
    is_authoritative: bool = True
    reason: Optional[str] = None


class ScanOverrideRequest(BaseModel):
    overrides: List[OfficerOverrideInput]


# --- Cases ---

class CaseOut(BaseModel):
    id: str
    scan_id: str
    status: str
    overall_status: str
    risk_score: Optional[int] = None
    manufacturer_name: Optional[str] = None
    state_region: Optional[str] = None
    opened_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
