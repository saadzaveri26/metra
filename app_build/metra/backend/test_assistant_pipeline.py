import pytest
from datetime import datetime, timedelta, timezone
import jwt
from fastapi.testclient import TestClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from main import app
from config import settings
from db import Base, engine

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
        "iss": "https://clerk.example.com",
    }
    return jwt.encode(payload, _private_pem, algorithm="RS256")


@pytest.fixture(autouse=True)
def setup_clerk_key():
    original_jwt_key = settings.CLERK_JWT_KEY
    settings.CLERK_JWT_KEY = _public_pem
    Base.metadata.create_all(bind=engine)
    yield
    settings.CLERK_JWT_KEY = original_jwt_key


def test_assistant_guest_defaults_to_consumer():
    """
    Unauthenticated citizen query defaults to consumer persona.
    CRITICAL GROUND RULE: Never exposes internal officer risk scores (0-100).
    """
    payload = {
        "query": "Can a shopkeeper charge extra for a chilled cold drink above MRP?",
    }
    resp = client.post("/api/v1/assistant/chat", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["active_persona"] == "consumer"
    assert "Citizen" in data["persona_display_name"] or "Consumer" in data["persona_display_name"]
    assert "MRP" in data["answer"]
    assert "1915" in data["answer"] or "National Consumer Helpline" in data["answer"] or "METRA" in data["answer"]
    assert len(data["citations"]) > 0
    assert len(data["suggested_followups"]) > 0

    # Ensure no officer confidential risk score is leaked
    assert "risk_score" not in data["answer"].lower()
    assert "internal risk score" not in data["answer"].lower()


def test_assistant_officer_persona_statutory_grounding():
    """
    Officer persona provides statutory enforcement citations, Section 15 seizure, and panchnama protocol.
    """
    token = create_test_token("off-inspector-01", "officer", "inspector@metra.gov.in")
    payload = {
        "query": "What is the procedure for establishing a dual MRP violation and seizing products?",
    }
    resp = client.post(
        "/api/v1/assistant/chat",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["active_persona"] == "officer"
    assert "Enforcement" in data["persona_display_name"] or "Officer" in data["persona_display_name"]
    assert "Section 15" in data["answer"] or "Section 36" in data["answer"]
    assert "Rule 6" in data["answer"]
    assert len(data["citations"]) >= 1
    assert any("PCR" in c["rule_code"] or "Rule" in c["statutory_reference"] for c in data["citations"])


def test_assistant_vendor_persona_premarket_guidance():
    """
    Vendor persona provides pre-market packaging design guidance, PDP font calculation, and correction tips.
    """
    token = create_test_token("vend-packer-01", "vendor", "compliance@fmcgbrand.com")
    payload = {
        "query": "How do I calculate minimum font size for declarations on a 250 cm2 packaging panel?",
    }
    resp = client.post(
        "/api/v1/assistant/chat",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["active_persona"] == "vendor"
    assert "Pre-Market" in data["persona_display_name"] or "Vendor" in data["persona_display_name"]
    assert "Rule 9" in data["answer"] or "Principal Display Panel" in data["answer"] or "2.5 mm" in data["answer"]
    assert len(data["citations"]) >= 1


def test_assistant_headquarters_persona_policy_oversight():
    """
    Headquarters persona provides executive analysis on Section 48 compounding ceilings and recidivism bars.
    """
    token = create_test_token("hq-director-01", "headquarters", "director@metra.gov.in")
    payload = {
        "query": "What are the statutory guidelines and limits for compounding packaging offences under Section 48?",
    }
    resp = client.post(
        "/api/v1/assistant/chat",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["active_persona"] == "headquarters"
    assert "Directorate" in data["persona_display_name"] or "HQ" in data["persona_display_name"] or "Policy" in data["persona_display_name"]
    assert "Section 48" in data["answer"]
    assert "Section 49" in data["answer"] or "compounding" in data["answer"].lower()


def test_assistant_persona_switching_explicit_override():
    """
    Validates dynamic persona-switching: an authorized user can switch views to see
    how statutory rules are explained to vendors, citizens, and inspectors.
    """
    officer_token = create_test_token("off-multi-01", "officer", "officer@metra.gov.in")

    # Switch to Vendor persona
    payload_vendor = {
        "query": "What are the rules regarding declaring MRP and taxes on multi-packs?",
        "persona_override": "vendor",
    }
    resp_vendor = client.post(
        "/api/v1/assistant/chat",
        json=payload_vendor,
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert resp_vendor.status_code == 200
    data_vendor = resp_vendor.json()
    assert data_vendor["active_persona"] == "vendor"
    assert "Pre-Market" in data_vendor["persona_display_name"] or "Vendor" in data_vendor["persona_display_name"]

    # Switch to Consumer persona
    payload_consumer = {
        "query": "What should I do if a store charges ₹5 above MRP for cold storage?",
        "persona_override": "consumer",
    }
    resp_consumer = client.post(
        "/api/v1/assistant/chat",
        json=payload_consumer,
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert resp_consumer.status_code == 200
    data_consumer = resp_consumer.json()
    assert data_consumer["active_persona"] == "consumer"
    assert "Citizen" in data_consumer["persona_display_name"] or "Consumer" in data_consumer["persona_display_name"]


def test_assistant_empty_query_rejected():
    """
    Empty or whitespace query must return 400 Bad Request.
    """
    resp = client.post("/api/v1/assistant/chat", json={"query": "   "})
    assert resp.status_code == 400
