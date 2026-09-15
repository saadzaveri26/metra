import io
import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import jwt

from main import app
from config import settings
from db import get_db, Base, engine, SessionLocal
from models import Scan, Case

client = TestClient(app)

# Generate an ephemeral RSA keypair for testing RS256 Clerk tokens
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


@pytest.fixture
def officer_token():
    return create_test_rs256_token({
        "sub": "officer_user_001",
        "role": "officer",
        "name": "Officer Sharma",
        "state_region": "MH",
    })


@pytest.fixture
def inspector_token():
    return create_test_rs256_token({
        "sub": "inspector_user_002",
        "role": "inspector",
        "name": "Inspector Patel",
        "state_region": "MH",
    })


@pytest.fixture
def vendor_token():
    return create_test_rs256_token({
        "sub": "vendor_user_001",
        "role": "vendor",
        "name": "Vendor Merchant",
        "state_region": "DL",
    })


@pytest.fixture
def consumer_token():
    return create_test_rs256_token({
        "sub": "consumer_user_001",
        "role": "consumer",
        "name": "Consumer Citizen",
    })


def test_officer_scan_pipeline_success(officer_token):
    """Test full officer scan pipeline including OCR, field structuring, compliance, and risk score."""
    img_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {officer_token}"},
        data={
            "interface": "inspector",
            "is_imported": "false",
            "listed_mrp": "189.00",
            "listed_net_quantity": "1 L",
        },
        files={"file": ("packaged_oil.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["id"] is not None
    assert data["status"] == "completed"
    assert data["interface"] == "inspector"
    assert "structured_fields" in data
    assert "compliance_summary" in data
    assert "risk_score" in data
    assert 0 <= data["risk_score"] <= 100
    assert "mismatch_flags" in data


def test_inspector_role_alias_allowed(inspector_token):
    """Test that role='inspector' is treated as officer and authorized for officer scan pipeline."""
    img_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {inspector_token}"},
        data={"interface": "inspector", "is_imported": "false"},
        files={"file": ("label.png", img_bytes, "image/png")},
    )
    assert response.status_code == 201, response.text


def test_vendor_forbidden_from_inspector_interface(vendor_token):
    """Ensure vendor cannot run scans on inspector interface."""
    img_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {vendor_token}"},
        data={"interface": "inspector", "is_imported": "false"},
        files={"file": ("label.png", img_bytes, "image/png")},
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]


def test_consumer_forbidden_from_inspector_interface(consumer_token):
    """Ensure consumer cannot run scans on inspector interface."""
    img_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {consumer_token}"},
        data={"interface": "inspector", "is_imported": "false"},
        files={"file": ("label.png", img_bytes, "image/png")},
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]


def test_online_vs_physical_mismatch_detected(officer_token):
    """Ensure online listed value mismatch against printed label is flagged."""
    img_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {officer_token}"},
        data={
            "interface": "inspector",
            "is_imported": "false",
            "listed_mrp": "299.00",  # Default mock has 189.00
            "listed_net_quantity": "500 ml",  # Default mock has 1 L
        },
        files={"file": ("label.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 201
    data = response.json()
    flags = data["mismatch_flags"]
    assert len(flags) > 0
    mismatch_fields = [f["field"] for f in flags]
    assert "mrp" in mismatch_fields or "net_quantity" in mismatch_fields


def test_officer_override_recalculates_compliance(officer_token):
    """Ensure officer manual override updates field values and recomputes risk and compliance."""
    img_bytes = make_test_image_bytes()
    # 1. Create scan
    res = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {officer_token}"},
        data={"interface": "inspector", "is_imported": "false"},
        files={"file": ("label.jpg", img_bytes, "image/jpeg")},
    )
    scan_id = res.json()["id"]

    # 2. Override a field
    override_payload = {
        "overrides": [
            {
                "field_name": "net_quantity",
                "value": "1 L",
                "is_authoritative": True,
                "reason": "Clear net quantity visible upon physical container inspection",
            }
        ]
    }
    override_res = client.post(
        f"/api/v1/scans/{scan_id}/override",
        headers={"Authorization": f"Bearer {officer_token}"},
        json=override_payload,
    )
    assert override_res.status_code == 200, override_res.text
    updated = override_res.json()
    assert updated["officer_overrides"] is not None
    assert "net_quantity" in updated["officer_overrides"]
    assert updated["compliance_results"]["net_quantity"]["status"] == "COMPLIANT"


def test_vendor_forbidden_from_overriding(vendor_token, officer_token):
    """Ensure vendors cannot call the override endpoint."""
    img_bytes = make_test_image_bytes()
    res = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {officer_token}"},
        data={"interface": "inspector", "is_imported": "false"},
        files={"file": ("label.jpg", img_bytes, "image/jpeg")},
    )
    scan_id = res.json()["id"]

    override_res = client.post(
        f"/api/v1/scans/{scan_id}/override",
        headers={"Authorization": f"Bearer {vendor_token}"},
        json={"overrides": [{"field_name": "mrp", "value": "100"}]},
    )
    assert override_res.status_code == 403


def test_case_list_and_gating(officer_token, vendor_token):
    """Ensure cases can be viewed by officer but are forbidden to vendors."""
    res_officer = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {officer_token}"})
    assert res_officer.status_code == 200
    assert isinstance(res_officer.json(), list)

    res_vendor = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {vendor_token}"})
    assert res_vendor.status_code == 403


def test_15mb_streaming_limit_rejection(officer_token):
    """Ensure uploads exceeding 15MB are rejected with HTTP 413."""
    # 16 MB dummy payload
    oversized_payload = b"X" * (16 * 1024 * 1024)
    response = client.post(
        "/api/v1/scans",
        headers={"Authorization": f"Bearer {officer_token}"},
        data={"interface": "inspector", "is_imported": "false"},
        files={"file": ("huge.jpg", oversized_payload, "image/jpeg")},
    )
    assert response.status_code == 413
    assert "exceeds maximum upload size" in response.json()["detail"]


def test_invalid_scan_id_rejected(officer_token):
    """Ensure path traversal or invalid scan_id format is rejected with HTTP 400."""
    response = client.get(
        "/api/v1/scans/../../etc/passwd",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    # FastAPI path matching or validate_id will reject invalid paths
    assert response.status_code in (400, 404)
