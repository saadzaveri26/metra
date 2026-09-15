import io
import os
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from PIL import Image
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import jwt

from main import app
from config import settings
from db import Base, engine, SessionLocal
from models import Scan, Case, CaseResponse, CaseStatus, ManufacturerViolationCount

client = TestClient(app)

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


def create_test_rs256_token(claims: dict, key_pem: str = _private_pem, expire_minutes: int = 60) -> str:
    payload = claims.copy()
    payload.setdefault("exp", datetime.now(timezone.utc) + timedelta(minutes=expire_minutes))
    payload.setdefault("iat", datetime.now(timezone.utc))
    payload.setdefault("iss", "https://clerk.example.com")
    return jwt.encode(payload, key_pem, algorithm="RS256")


def make_test_image_bytes(width=300, height=200, color="white") -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def setup_clerk_key():
    original_jwt_key = settings.CLERK_JWT_KEY
    settings.CLERK_JWT_KEY = _public_pem
    yield
    settings.CLERK_JWT_KEY = original_jwt_key


def test_vendor_self_check_isolation():
    """
    CRITICAL STATUTORY REQUIREMENT:
    Vendor self-check scans (interface="vendor") must NEVER create an enforcement Case
    and must NEVER increment manufacturer violation counts, even when non-compliant.
    """
    vendor_token = create_test_rs256_token({
        "sub": "user_vendor_iso_123",
        "role": "vendor",
        "name": "Acme Foods Compliance Officer",
        "public_metadata": {"role": "vendor", "business_name": "Acme FMCG Pvt. Ltd."},
    })

    db = SessionLocal()
    prev_violation_count = db.query(ManufacturerViolationCount).count()
    prev_cases_count = db.query(Case).count()
    db.close()

    image_bytes = make_test_image_bytes()
    # Using bad_label.png fixture hint that produces a NON_COMPLIANT outcome
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {vendor_token}"},
        files={"file": ("bad_label.png", image_bytes, "image/png")},
        data={"interface": "vendor", "is_imported": "false"},
    )


    assert response.status_code == 201, response.text
    scan_data = response.json()
    scan_id = scan_data["id"]
    assert scan_data["interface"] == "vendor"
    assert scan_data["status"] == "completed"

    # Verify that in the database, NO Case was created for this scan
    db = SessionLocal()
    case = db.query(Case).filter(Case.scan_id == scan_id).first()
    assert case is None, "CRITICAL: Vendor self-check must NOT auto-create a Case record!"

    # Verify total cases count did not increase from this vendor scan
    new_cases_count = db.query(Case).count()
    assert new_cases_count == prev_cases_count

    # Verify violation counts did not increment
    new_violation_count = db.query(ManufacturerViolationCount).count()
    assert new_violation_count == prev_violation_count
    db.close()


def test_vendor_cannot_call_inspector_interface():
    """Vendor role cannot execute scan under inspector interface."""
    vendor_token = create_test_rs256_token({
        "sub": "user_vendor_forbidden",
        "role": "vendor",
        "public_metadata": {"role": "vendor"},
    })

    image_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {vendor_token}"},
        files={"file": ("test.png", image_bytes, "image/png")},
        data={"interface": "inspector"},
    )
    assert response.status_code == 403
    assert "Inspector interface requires officer or inspector role" in response.json()["detail"]


def test_consumer_cannot_call_vendor_interface():
    """Consumer role cannot execute scan under vendor interface."""
    consumer_token = create_test_rs256_token({
        "sub": "user_consumer_forbidden",
        "role": "consumer",
        "public_metadata": {"role": "consumer"},
    })

    image_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {consumer_token}"},
        files={"file": ("test.png", image_bytes, "image/png")},
        data={"interface": "vendor"},
    )
    assert response.status_code == 403
    assert "Vendor interface requires vendor, officer, or headquarters role" in response.json()["detail"]


def test_vendor_overview_metrics():
    """Vendor overview returns self-check count, compliance rate, and open notices count."""
    vendor_token = create_test_rs256_token({
        "sub": "user_vendor_overview_999",
        "role": "vendor",
        "name": "Priya Sharma",
        "public_metadata": {"role": "vendor", "business_name": "Himalayan Nectar Foods Ltd."},
    })

    response = client.get(
        "/api/v1/vendor/overview",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "total_self_checks" in data
    assert "compliance_rate" in data
    assert "open_cases_count" in data
    assert data["business_name"] == "Himalayan Nectar Foods Ltd."


def test_vendor_role_gating_on_vendor_endpoints():
    """Non-vendor (e.g. consumer) accessing vendor endpoints receives 403 Forbidden."""
    consumer_token = create_test_rs256_token({
        "sub": "user_consumer_gate",
        "role": "consumer",
        "public_metadata": {"role": "consumer"},
    })

    response = client.get(
        "/api/v1/vendor/overview",
        headers={"Authorization": f"Bearer {consumer_token}"},
    )
    assert response.status_code == 403


def test_vendor_cases_listing_and_response():
    """
    Vendor can view own notice and submit a formal clarification response.
    Verifies that CaseResponse is created without overwriting original case findings.
    """
    # 1. Create an official case as an officer
    officer_token = create_test_rs256_token({
        "sub": "user_officer_case_creator",
        "role": "officer",
        "name": "Inspector Deshmukh",
        "public_metadata": {"role": "officer"},
    })
    image_bytes = make_test_image_bytes()
    officer_scan_resp = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {officer_token}"},
        files={"file": ("bad_label.png", image_bytes, "image/png")},
        data={"interface": "inspector", "is_imported": "false"},
    )
    assert officer_scan_resp.status_code == 201
    scan_id = officer_scan_resp.json()["id"]

    db = SessionLocal()
    case = db.query(Case).filter(Case.scan_id == scan_id).first()
    assert case is not None

    # Attach manufacturer name matching our test vendor
    case.manufacturer_name = "Suvidha FMCG Pvt. Ltd."
    db.commit()
    case_id = case.id
    db.close()

    # 2. Query as vendor matching this manufacturer
    vendor_token = create_test_rs256_token({
        "sub": "user_vendor_suvidha",
        "role": "vendor",
        "name": "Suvidha Regulatory Desk",
        "public_metadata": {"role": "vendor", "business_name": "Suvidha FMCG Pvt. Ltd."},
    })

    cases_resp = client.get(
        "/api/v1/vendor/cases",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert cases_resp.status_code == 200
    vendor_cases = cases_resp.json()
    assert any(c["id"] == case_id for c in vendor_cases)

    # 3. View detail of case
    detail_resp = client.get(
        f"/api/v1/vendor/cases/{case_id}",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["id"] == case_id
    assert detail_data["overall_status"] != "COMPLIANT"
    assert "responses" in detail_data

    # 4. Submit formal response with clarification text and evidence file
    evidence_image = make_test_image_bytes(100, 100, "green")
    response_resp = client.post(
        f"/api/v1/vendor/cases/{case_id}/respond",
        headers={"Authorization": f"Bearer {vendor_token}"},
        files={"evidence_file": ("corrected_artwork.png", evidence_image, "image/png")},
        data={"clarification_text": "Batch artwork corrected to include 4.0mm font height per Rule 7."},
    )
    assert response_resp.status_code == 201, response_resp.text
    resp_data = response_resp.json()
    assert resp_data["case_id"] == case_id
    assert "Rule 7" in resp_data["clarification_text"]
    assert resp_data["evidence_image_path"] is not None

    # 5. Verify database state: Case status transitioned to under_review, original overall_status preserved
    db = SessionLocal()
    updated_case = db.query(Case).filter(Case.id == case_id).first()
    assert updated_case.status == CaseStatus.under_review
    assert updated_case.overall_status == detail_data["overall_status"]
    responses = db.query(CaseResponse).filter(CaseResponse.case_id == case_id).all()
    assert len(responses) == 1
    assert responses[0].clarification_text == "Batch artwork corrected to include 4.0mm font height per Rule 7."
    db.close()


def test_vendor_pcr_guidance_checklist():
    """Vendor guidance endpoint returns categorized statutory PCR 2011 checklist."""
    vendor_token = create_test_rs256_token({
        "sub": "user_vendor_guidance",
        "role": "vendor",
        "public_metadata": {"role": "vendor"},
    })

    # All categories
    resp = client.get(
        "/api/v1/vendor/guidance",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 9
    rule_ids = [r["rule_id"] for r in items]
    assert "PCR-001" in rule_ids
    assert "PCR-002" in rule_ids
    assert "PCR-003" in rule_ids

    # Filtered by food
    food_resp = client.get(
        "/api/v1/vendor/guidance?category=food",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert food_resp.status_code == 200
    food_items = food_resp.json()
    assert any("Vegetarian" in r["title"] for r in food_items)
