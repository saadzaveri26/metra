import pytest
from datetime import datetime, timedelta, timezone
import uuid
import jwt
from fastapi.testclient import TestClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from main import app
from config import settings
from db import Base, engine, SessionLocal
import models

client = TestClient(app)

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
        "iss": "https://clerk.example.com"
    }
    return jwt.encode(payload, _private_pem, algorithm="RS256")

@pytest.fixture(autouse=True)
def setup_clerk_key():
    original_jwt_key = settings.CLERK_JWT_KEY
    settings.CLERK_JWT_KEY = _public_pem
    Base.metadata.create_all(bind=engine)
    yield
    settings.CLERK_JWT_KEY = original_jwt_key

def test_hq_analytics_overview_role_guard():
    # Consumer should be rejected with 403
    consumer_token = create_test_token("user-cons-1", "consumer", "consumer@example.com")
    resp_cons = client.get("/api/v1/hq/analytics/overview", headers={"Authorization": f"Bearer {consumer_token}"})
    assert resp_cons.status_code == 403

    # Headquarters role should succeed
    hq_token = create_test_token("user-hq-1", "headquarters", "hq@metra.gov.in")
    resp_hq = client.get("/api/v1/hq/analytics/overview", headers={"Authorization": f"Bearer {hq_token}"})
    assert resp_hq.status_code == 200
    data = resp_hq.json()
    assert "total_inspections" in data
    assert "compliance_rate" in data
    assert "total_cases" in data
    assert "violations_by_rule" in data
    assert "unverified_leads_count" in data

def test_hq_officers_and_verification():
    hq_token = create_test_token("user-hq-admin", "headquarters", "admin@metra.gov.in")

    # Seed an unverified inspector in DB using valid hyphenated ID
    db = SessionLocal()
    officer_id = f"test-officer-{uuid.uuid4().hex[:12]}"
    officer = models.User(
        id=officer_id,
        email=f"inspector-{officer_id}@metra.gov.in",
        hashed_password="mock_password_hash",
        full_name="Inspector Patil",
        role=models.UserRole.inspector,
        state_region="Maharashtra",
        government_id="GOV-MH-9988",
        inspector_verified=False
    )
    db.add(officer)
    db.commit()

    # List officers
    list_resp = client.get("/api/v1/hq/officers", headers={"Authorization": f"Bearer {hq_token}"})
    assert list_resp.status_code == 200
    officers = list_resp.json()
    assert any(o["id"] == officer_id for o in officers)

    # Verify officer
    verify_resp = client.post(f"/api/v1/hq/officers/{officer_id}/verify", headers={"Authorization": f"Bearer {hq_token}"})
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["status"] == "success"

    # Re-fetch officer directly from DB
    db.refresh(officer)
    assert officer.inspector_verified is True
    db.close()

def test_hq_seller_leaderboard():
    hq_token = create_test_token("user-hq-lead", "headquarters", "lead@metra.gov.in")
    resp = client.get("/api/v1/hq/sellers/leaderboard", headers={"Authorization": f"Bearer {hq_token}"})
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    # Check that leaderboard returns entries with expected fictional entity names
    fictional_names = [
        "Suvidha FMCG Pvt. Ltd.",
        "Bharat Packaged Commodities Ltd.",
        "Himalayan Nectar Foods Ltd.",
        "Kaveri Agro Industries Pvt. Ltd.",
        "Vanguard Consumer Formulations Ltd."
    ]
    if len(items) > 0:
        assert any(item["canonical_name"] in fictional_names for item in items)
        assert items[0]["violation_count"] >= items[-1]["violation_count"]

def test_hq_rules_management_authorization():
    officer_token = create_test_token("user-off-rule", "officer", "officer@metra.gov.in")
    hq_token = create_test_token("user-hq-rule", "headquarters", "director@metra.gov.in")

    # Officers can read rules
    get_resp = client.get("/api/v1/hq/rules", headers={"Authorization": f"Bearer {officer_token}"})
    assert get_resp.status_code == 200
    rules = get_resp.json()
    assert isinstance(rules, list)

    # Officer CANNOT create a rule (ground rule: only HQ writes to compliance rules matrix)
    new_rule = {
        "rule_code": f"PCR-TEST-{uuid.uuid4().hex[:6].upper()}",
        "title": "Mandatory QR Code for Digital E-Labels",
        "category": "traceability",
        "statutory_reference": "Legal Metrology Amendment 2024 Rule 7A",
        "severity": "high",
        "description": "Requires dynamic high-contrast 2D QR code for traceability.",
        "penalty_clause": "Section 36(1) penalty up to Rs 25,000",
        "is_active": True
    }
    officer_create = client.post("/api/v1/hq/rules", json=new_rule, headers={"Authorization": f"Bearer {officer_token}"})
    assert officer_create.status_code == 403

    # HQ creates the rule successfully
    hq_create = client.post("/api/v1/hq/rules", json=new_rule, headers={"Authorization": f"Bearer {hq_token}"})
    assert hq_create.status_code == 201
    created_data = hq_create.json()
    assert created_data["rule_code"] == new_rule["rule_code"]
    assert created_data["created_by"] == "director@metra.gov.in"
    rule_id = created_data["id"]

    # HQ updates the rule
    update_payload = {
        "description": "Updated rule description with enhanced verification thresholds.",
        "severity": "critical"
    }
    hq_update = client.put(f"/api/v1/hq/rules/{rule_id}", json=update_payload, headers={"Authorization": f"Bearer {hq_token}"})
    assert hq_update.status_code == 200
    updated_data = hq_update.json()
    assert updated_data["description"] == update_payload["description"]
    assert updated_data["severity"] == "CRITICAL"
    assert updated_data["updated_by"] == "director@metra.gov.in"

def test_hq_lead_triage():
    hq_token = create_test_token("user-hq-triage", "headquarters", "triage@metra.gov.in")
    officer_token = create_test_token("user-off-assigned", "officer", "assigned.off@metra.gov.in")

    # Seed a consumer report with valid hyphenated ID
    db = SessionLocal()
    report_id = f"cr-test-{uuid.uuid4().hex[:12]}"
    report = models.ConsumerReport(
        id=report_id,
        user_id="cons-123",
        product_name="Test Violating Biscuits",
        brand_manufacturer="Fictional Foods Ltd.",
        barcode="8901234999999",
        store_location="Andheri West, Mumbai",
        violation_type="dual_mrp",
        description="Sold at Rs 120 whereas stamped MRP is Rs 100",
        status="unverified_lead"
    )
    db.add(report)
    db.commit()

    # HQ retrieves leads
    leads_resp = client.get("/api/v1/hq/leads", headers={"Authorization": f"Bearer {hq_token}"})
    assert leads_resp.status_code == 200
    leads = leads_resp.json()
    assert any(l["id"] == report_id for l in leads)

    # Assign lead to officer (using valid hyphenated officer id)
    assign_payload = {
        "assigned_officer_id": "user-off-assigned",
        "assigned_region": "Western Division - Mumbai",
        "action_note": "Immediate field inspection warranted."
    }
    assign_resp = client.post(f"/api/v1/hq/leads/{report_id}/assign", json=assign_payload, headers={"Authorization": f"Bearer {hq_token}"})
    assert assign_resp.status_code == 200
    assign_data = assign_resp.json()
    assert assign_data["status"] == "success"

    # Verify status changed in DB
    db.refresh(report)
    assert report.status == "assigned"
    db.close()
