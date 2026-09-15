from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    EmailStr = str


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
    ocr_raw_text: Optional[str] = None
    structured_fields: Optional[Dict[str, Any]] = None
    compliance_summary: Optional[ComplianceSummary] = None
    compliance_results: Optional[Dict[str, ComplianceFieldResult]] = None
    font_analysis: Optional[Dict[str, Any]] = None
    risk_score: Optional[int] = None
    mismatch_flags: Optional[List[Dict[str, Any]]] = None
    officer_overrides: Optional[Dict[str, Any]] = None
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


# --- Vendor ---

class CaseResponseOut(BaseModel):
    id: str
    case_id: str
    vendor_id: str
    clarification_text: str
    evidence_image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CaseDetailOut(CaseOut):
    scan: Optional[ScanOut] = None
    responses: List[CaseResponseOut] = []

    class Config:
        from_attributes = True


class VendorOverviewOut(BaseModel):
    total_self_checks: int
    compliance_rate: float
    open_cases_count: int
    business_name: Optional[str] = None
    gstin: Optional[str] = None


class GuidanceRuleItem(BaseModel):
    rule_id: str
    title: str
    statutory_reference: str
    description: str
    declaration_requirement: str
    minimum_font_size: Optional[str] = None
    category: str


# --- Consumer ---

class ConsumerDeclarationItem(BaseModel):
    field: str
    statutory_rule: str
    status: str  # INFO (barcode-only lookup cannot verify compliance — requires physical inspection)
    findings: str
    declared_value: Optional[str] = None


class NutritionProfile(BaseModel):
    nutriscore_grade: str  # a, b, c, d, e, unknown
    nova_group: Optional[int] = None  # 1, 2, 3, 4
    ecoscore_grade: Optional[str] = None
    nutrient_levels: Dict[str, str] = {}  # fat: low, sugars: high, etc.
    nutriments: Dict[str, Any] = {}
    allergens: List[str] = []
    additives: List[str] = []
    ingredients_text: Optional[str] = None
    source: str


class ConsumerLookupOut(BaseModel):
    barcode: str
    product_name: str
    brand_manufacturer: str
    category: str
    # NOTE: compliance_status was removed — a barcode-only lookup cannot determine
    # whether mandatory label declarations are actually present/compliant on the
    # physical package. That requires an officer's OCR scan or physical inspection.
    mandatory_label_info: List[ConsumerDeclarationItem]
    nutrition: NutritionProfile
    has_active_recall: bool = False
    recall_warning: Optional[str] = None


class ConsumerReportOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    barcode: Optional[str] = None
    product_name: str
    brand_manufacturer: Optional[str] = None
    store_location: str
    state_region: Optional[str] = None
    violation_type: str
    description: str
    image_path: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SafetyAlertOut(BaseModel):
    id: str
    title: str
    product_name: str
    brand_name: str
    batch_number: Optional[str] = None
    hazard_type: str
    severity: str
    description: str
    published_by: str
    state_region: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Headquarters ---

class ComplianceRulePolicyCreate(BaseModel):
    rule_code: str
    title: str
    category: str = "all"
    statutory_reference: str
    severity: str = "MAJOR"  # CRITICAL, MAJOR, MINOR
    description: str
    penalty_clause: str
    is_active: bool = True


class ComplianceRulePolicyUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    statutory_reference: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    penalty_clause: Optional[str] = None
    is_active: Optional[bool] = None


class ComplianceRulePolicyOut(BaseModel):
    id: str
    rule_code: str
    title: str
    category: str
    statutory_reference: str
    severity: str
    description: str
    penalty_clause: str
    is_active: bool
    created_by: str
    updated_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HQAnalyticsOverviewOut(BaseModel):
    total_inspections: int
    total_cases: int
    compliance_rate: float
    violations_by_rule: Dict[str, int]
    cases_by_region: Dict[str, int]
    cases_by_status: Dict[str, int]
    unverified_leads_count: int
    is_sample_data: bool = False  # True when violations/region data is hardcoded fallback


class HQOfficerWorkloadOut(BaseModel):
    id: str
    email: str
    full_name: str
    government_id: Optional[str] = None
    state_region: Optional[str] = None
    inspector_verified: bool
    total_scans: int
    active_cases: int
    resolved_cases: int


class HQSellerLeaderboardItem(BaseModel):
    business_id: str
    canonical_name: str
    primary_category: str
    state_region: str
    violation_count: int
    risk_level: str  # Critical, High, Moderate
    last_violation_date: Optional[str] = None


class HQLeadAssignRequest(BaseModel):
    assigned_officer_id: Optional[str] = None
    state_region: Optional[str] = None
    status: str = "assigned"


# --- Pass 7: Ask METRA Assistant (Persona-Switching) Schemas ---

class AskMetraMessage(BaseModel):
    role: str  # user, assistant
    content: str


class AskMetraRequest(BaseModel):
    query: str
    context_id: Optional[str] = None
    persona_override: Optional[str] = None  # officer, vendor, consumer, headquarters
    conversation_history: Optional[List[AskMetraMessage]] = None


class AskMetraCitation(BaseModel):
    rule_code: str
    title: str
    statutory_reference: str
    similarity_score: float
    excerpt: str


class AskMetraResponse(BaseModel):
    answer: str
    active_persona: str  # officer, vendor, consumer, headquarters
    persona_display_name: str
    citations: List[AskMetraCitation]
    suggested_followups: List[str]
    timestamp: datetime




