"""
Pass 9: Email & Notification System Test Suite.
Verifies compliance with the METRA statutory notification ground rule:
"Notification emails route to DEMO_MODE test inbox until explicitly enabled."
"""
import os
import pytest
from datetime import datetime, timedelta, timezone
import jwt
from fastapi.testclient import TestClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from main import app
from config import settings
from notifications import (
    clear_demo_inbox,
    get_demo_inbox,
    send_notification,
    render_template,
)

# Generate an RSA keypair for testing Clerk JWT decoding
_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_private_pem = _private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")

_public_key = _private_key.public_key()
_public_pem = _public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode("utf-8")


def create_test_token(user_id: str, role: str, email: str = "test@example.com") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "metadata": {"role": role},
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "iat": datetime.now(timezone.utc),
        "iss": "https://clerk.example.com",
    }
    return jwt.encode(payload, _private_pem, algorithm="RS256")


@pytest.fixture(autouse=True)
def setup_clerk_key():
    original_jwt_key = settings.CLERK_JWT_KEY
    settings.CLERK_JWT_KEY = _public_pem
    clear_demo_inbox()
    yield
    settings.CLERK_JWT_KEY = original_jwt_key
    clear_demo_inbox()


@pytest.fixture
def client():
    return TestClient(app)


def test_ground_rule_demo_mode_is_active():
    """
    CRITICAL STATUTORY GROUND RULE:
    Notification emails must route to DEMO_MODE test inbox until explicitly enabled.
    """
    assert settings.EMAIL_DEMO_MODE is True
    assert "@" in settings.EMAIL_TEST_INBOX


def test_render_all_statutory_templates():
    """Verifies that all 4 statutory notification templates render HTML, plain-text, and badges."""
    # 1. case_notice (Rule 32 Statutory Show-Cause)
    cn = render_template(
        template="case_notice",
        recipient_name="Suvidha Foods Compliance",
        data={
            "case_id": "CAS-TEST-001",
            "manufacturer_name": "Suvidha FMCG Pvt. Ltd.",
            "risk_score": 85,
            "overall_status": "NON_COMPLIANT",
            "deadline_days": 15,
            "violations": [{"rule": "Rule 6(1)(e)", "reason": "Missing MRP"}],
        },
    )
    assert "[METRA STATUTORY NOTICE]" in cn["subject"]
    assert "Rule 32 Statutory Notice" in cn["badge_text"]
    assert "CAS-TEST-001" in cn["html"]
    assert "Suvidha FMCG Pvt. Ltd." in cn["html"]

    # 2. vendor_advisory (Pre-market label check)
    va = render_template(
        template="vendor_advisory",
        recipient_name="Vendor QA Lead",
        data={"brand_name": "NutriSnack", "scan_ref": "SCN-991", "issues_count": 2},
    )
    assert "Pre-Market" in va["subject"]
    assert "Pre-Market Guidance" in va["badge_text"]
    assert "NutriSnack" in va["html"]

    # 3. lead_assignment (Field inspection triage)
    la = render_template(
        template="lead_assignment",
        recipient_name="Field Inspector",
        data={
            "lead_id": "REP-2026-009",
            "product_name": "Premium Ghee",
            "retailer_name": "City Mart",
            "state_region": "Maharashtra",
            "priority": "HIGH",
        },
    )
    assert "Field Assignment" in la["subject"]
    assert "REP-2026-009" in la["html"]

    # 4. officer_verified (Credential confirmation)
    ov = render_template(
        template="officer_verified",
        recipient_name="Vikram Patel",
        data={
            "officer_name": "Vikram Patel",
            "gov_id": "LM-GJ-2024-118",
            "state_region": "Gujarat",
        },
    )
    assert "Officer Credentials Verified" in ov["subject"]
    assert "LM-GJ-2024-118" in ov["html"]


def test_send_notification_routes_to_demo_test_inbox():
    """Verifies that send_notification intercepts real delivery and stores in demo inbox."""
    res = send_notification(
        template="case_notice",
        to_email="violator@externalmfg.com",
        recipient_name="Director of Manufacturing",
        data={
            "case_id": "CAS-2026-881",
            "manufacturer_name": "External Packaged Foods Co.",
            "risk_score": 92,
            "overall_status": "NON_COMPLIANT",
        },
    )

    assert res["success"] is True
    assert res["mode"] == "demo_mode"
    assert res["delivered_to"] == settings.EMAIL_TEST_INBOX
    assert res["intended_for"] == "violator@externalmfg.com"

    # Verify presence in inbox
    inbox = get_demo_inbox()
    assert len(inbox) == 1
    item = inbox[0]
    assert item["intended_for"] == "violator@externalmfg.com"
    assert item["delivered_to"] == settings.EMAIL_TEST_INBOX
    assert item["demo_mode"] is True
    assert "CAS-2026-881" in item["html_body"]


def test_notification_status_endpoint(client):
    """Verifies /api/v1/notifications/status reflects DEMO_MODE setting and supported templates."""
    resp = client.get("/api/v1/notifications/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["demo_mode"] is True
    assert data["test_inbox"] == settings.EMAIL_TEST_INBOX
    assert "case_notice" in data["supported_templates"]
    assert "vendor_advisory" in data["supported_templates"]
    assert "lead_assignment" in data["supported_templates"]
    assert "officer_verified" in data["supported_templates"]


def test_send_test_and_list_inbox_endpoints(client):
    """Tests triggering a test notification and listing/filtering the inbox via REST API."""
    # Send a test case notice
    payload = {
        "template": "case_notice",
        "to_email": "legal@brandco.in",
        "recipient_name": "Legal Head",
        "data": {
            "case_id": "CAS-API-772",
            "manufacturer_name": "BrandCo Ltd",
            "risk_score": 78,
            "overall_status": "NON_COMPLIANT",
        },
    }
    post_resp = client.post("/api/v1/notifications/send-test", json=payload)
    assert post_resp.status_code == 200
    res_data = post_resp.json()
    assert res_data["delivered_to"] == settings.EMAIL_TEST_INBOX

    # Also send an officer verification test
    client.post(
        "/api/v1/notifications/send-test",
        json={
            "template": "officer_verified",
            "to_email": "inspector.kumar@doca.gov.in",
            "recipient_name": "Inspector Kumar",
            "data": {"gov_id": "LM-KL-2026-001"},
        },
    )

    # List inbox
    list_resp = client.get("/api/v1/notifications/inbox")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 2

    # Filter by template
    filtered_resp = client.get("/api/v1/notifications/inbox?template=case_notice")
    assert filtered_resp.status_code == 200
    filtered_items = filtered_resp.json()
    assert len(filtered_items) == 1
    assert filtered_items[0]["template"] == "case_notice"

    # Search filter
    search_resp = client.get("/api/v1/notifications/inbox?search=kumar")
    assert search_resp.status_code == 200
    search_items = search_resp.json()
    assert len(search_items) == 1
    assert "kumar" in search_items[0]["intended_for"].lower()

    # Get single item by ID
    notif_id = search_items[0]["id"]
    detail_resp = client.get(f"/api/v1/notifications/inbox/{notif_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == notif_id
    assert "Inspector Kumar" in detail["html_body"]

    # Clear inbox
    clear_resp = client.post("/api/v1/notifications/clear")
    assert clear_resp.status_code == 200
    assert clear_resp.json()["cleared_count"] == 2

    # Verify inbox is now empty
    empty_resp = client.get("/api/v1/notifications/inbox")
    assert empty_resp.status_code == 200
    assert len(empty_resp.json()) == 0


def test_hq_officer_verify_triggers_notification(client):
    """Verifies that HQ approving an officer triggers an officer_verified notification in demo inbox."""
    import uuid
    from db import SessionLocal
    import models

    db = SessionLocal()
    officer_id = f"test-off-{uuid.uuid4().hex[:10]}"
    officer = models.User(
        id=officer_id,
        email=f"inspector.{officer_id}@metra.gov.in",
        hashed_password="mock_password_hash",
        full_name="Vikram Patel",
        role=models.UserRole.inspector,
        state_region="Gujarat",
        government_id="LM-GJ-2024-118",
        inspector_verified=False,
    )
    db.add(officer)
    db.commit()
    db.close()

    hq_token = create_test_token("hq-admin-1", "headquarters", "hq.director@metra.gov.in")
    headers = {"Authorization": f"Bearer {hq_token}"}

    resp = client.post(f"/api/v1/hq/officers/{officer_id}/verify", headers=headers)
    assert resp.status_code == 200

    inbox = get_demo_inbox()
    # At least 1 notification generated for officer verification
    assert len(inbox) >= 1
    ov_item = [i for i in inbox if i["template"] == "officer_verified"][0]
    assert ov_item["delivered_to"] == settings.EMAIL_TEST_INBOX
    assert ov_item["demo_mode"] is True
    assert ov_item["intended_for"] == f"inspector.{officer_id}@metra.gov.in"
    assert "Officer Credentials Verified" in ov_item["subject"]
