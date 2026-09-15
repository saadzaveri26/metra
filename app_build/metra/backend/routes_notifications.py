"""
METRA Notification Routes.
Provides inspection, testing, and lifecycle management for the DEMO_MODE test inbox.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Query, Depends

from config import settings
from notifications import (
    get_demo_inbox,
    get_notification_by_id,
    clear_demo_inbox,
    send_notification,
    _IN_MEMORY_INBOX,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SendTestNotificationRequest(BaseModel):
    template: str = Field(
        ...,
        description="Template key: 'case_notice', 'vendor_advisory', 'lead_assignment', 'officer_verified'",
        example="case_notice",
    )
    to_email: str = Field(..., example="compliance@suvidhafoods.com")
    recipient_name: str = Field("Compliance Officer", example="Mr. Rajesh Singhania")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class NotificationOut(BaseModel):
    id: str
    template: str
    intended_for: str
    recipient_name: str
    from_email: str
    delivered_to: str
    demo_mode: bool
    subject: str
    badge_text: str
    badge_color: str
    snippet: str
    html_body: str
    plain_text: str
    metadata: Dict[str, Any]
    created_at: str
    status: str


class NotificationStatusOut(BaseModel):
    demo_mode: bool
    test_inbox: str
    from_email: str
    total_captured: int
    supported_templates: List[str]


@router.get("/status", response_model=NotificationStatusOut)
def get_notification_status():
    """
    Returns the current notification dispatch configuration and test inbox count.
    GROUND RULE: Notification emails route to DEMO_MODE test inbox until explicitly enabled.
    """
    return NotificationStatusOut(
        demo_mode=settings.EMAIL_DEMO_MODE,
        test_inbox=settings.EMAIL_TEST_INBOX,
        from_email=settings.FROM_EMAIL,
        total_captured=len(_IN_MEMORY_INBOX),
        supported_templates=[
            "case_notice",
            "vendor_advisory",
            "lead_assignment",
            "officer_verified",
        ],
    )


@router.get("/inbox", response_model=List[NotificationOut])
def list_test_inbox(
    template: Optional[str] = Query(None, description="Filter by template type"),
    search: Optional[str] = Query(None, description="Search subject, recipient, or content"),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Retrieves captured notifications routed to the DEMO_MODE test inbox.
    Sorted newest first.
    """
    return get_demo_inbox(template=template, search=search, limit=limit)


@router.get("/inbox/{notification_id}", response_model=NotificationOut)
def get_notification_detail(notification_id: str):
    """
    Retrieves full details and rendered HTML body of a specific captured notification.
    """
    item = get_notification_by_id(notification_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found in test inbox")
    return item


@router.post("/send-test")
def trigger_test_notification(payload: SendTestNotificationRequest):
    """
    Triggers a test notification email using any of the statutory templates.
    Adheres strictly to DEMO_MODE safety routing.
    """
    valid_templates = {"case_notice", "vendor_advisory", "lead_assignment", "officer_verified"}
    if payload.template not in valid_templates:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid template '{payload.template}'. Must be one of: {list(valid_templates)}",
        )

    # If data is empty or partial, provide rich defaults matching the template
    data = dict(payload.data)
    if payload.template == "case_notice":
        data.setdefault("case_id", "CAS-2026-DEMO-001")
        data.setdefault("manufacturer_name", "Suvidha FMCG Pvt. Ltd.")
        data.setdefault("risk_score", 84)
        data.setdefault("overall_status", "NON_COMPLIANT")
        data.setdefault("deadline_days", 15)
        data.setdefault(
            "violations",
            [
                {
                    "rule": "Rule 6(1)(e)",
                    "reason": "Missing Maximum Retail Price (MRP) declaration on principal display panel.",
                },
                {
                    "rule": "Rule 7",
                    "reason": "Numeral font height (1.8mm) below 2.0mm statutory minimum for 200g package.",
                },
            ],
        )
    elif payload.template == "vendor_advisory":
        data.setdefault("brand_name", "NutriLife Organic Ghee")
        data.setdefault("scan_ref", "SCN-SELF-882")
        data.setdefault("issues_count", 2)
    elif payload.template == "lead_assignment":
        data.setdefault("lead_id", "REP-DL-2026-041")
        data.setdefault("product_name", "Classic Roasted Almonds 500g")
        data.setdefault("retailer_name", "Metro Superstore, Connaught Place")
        data.setdefault("state_region", "Delhi NCR")
        data.setdefault("priority", "CRITICAL")
    elif payload.template == "officer_verified":
        data.setdefault("officer_name", payload.recipient_name)
        data.setdefault("gov_id", "LM-DELHI-2026-904")
        data.setdefault("state_region", "Delhi NCR (Zone 1)")

    res = send_notification(
        template=payload.template,
        to_email=payload.to_email,
        recipient_name=payload.recipient_name,
        data=data,
    )
    return res


@router.post("/clear")
def clear_inbox():
    """
    Clears all captured messages from the test inbox.
    """
    cleared_count = clear_demo_inbox()
    return {
        "status": "success",
        "cleared_count": cleared_count,
        "message": f"Cleared {cleared_count} notification(s) from test inbox.",
    }
