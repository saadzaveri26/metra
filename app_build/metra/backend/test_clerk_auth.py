"""
Test suite for Clerk JWT verification, role boundaries, and require_roles() dependency.
Explicitly validates:
1. Valid JWT with matching role -> HTTP 200.
2. Valid JWT with mismatching role -> HTTP 403.
3. Valid JWT with NO role claim -> HTTP 403 (explicit rejection, never unpredictable error).
4. Invalid / tampered / expired JWT -> HTTP 401.
5. RS256 cryptographic verification using RSA key pairs (matching Clerk production).
6. Role aliases (inspector -> officer, hq -> headquarters).
"""
import pytest
from fastapi.testclient import TestClient
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta, timezone

from main import app
from config import settings
import security

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

# Also generate an untrusted RSA key to verify signature tampering rejection
_untrusted_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_untrusted_pem = _untrusted_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")


def create_test_rs256_token(claims: dict, key_pem: str = _private_pem, expire_minutes: int = 60) -> str:
    payload = claims.copy()
    payload.setdefault("exp", datetime.now(timezone.utc) + timedelta(minutes=expire_minutes))
    payload.setdefault("iat", datetime.now(timezone.utc))
    payload.setdefault("iss", "https://clerk.example.com")
    return jwt.encode(payload, key_pem, algorithm="RS256")


@pytest.fixture(autouse=True)
def setup_clerk_key():
    original_jwt_key = settings.CLERK_JWT_KEY
    settings.CLERK_JWT_KEY = _public_pem
    yield
    settings.CLERK_JWT_KEY = original_jwt_key


def test_officer_access_with_valid_officer_token():
    token = create_test_rs256_token({
        "sub": "user_officer_01",
        "role": "officer",
        "email": "officer@gov.in",
        "name": "Officer Sharma",
    })
    res = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "authorized"
    assert data["role"] == "officer"
    assert data["sub"] == "user_officer_01"


def test_officer_access_with_inspector_alias():
    token = create_test_rs256_token({
        "sub": "user_inspector_02",
        "role": "inspector",
        "email": "inspector@gov.in",
    })
    res = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    assert res.json()["role"] == "inspector"


def test_officer_probe_rejects_vendor_role():
    token = create_test_rs256_token({
        "sub": "user_vendor_01",
        "role": "vendor",
        "email": "vendor@business.com",
    })
    res = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_officer_probe_rejects_consumer_role():
    token = create_test_rs256_token({
        "sub": "user_consumer_01",
        "role": "consumer",
        "email": "citizen@example.com",
    })
    res = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_valid_jwt_with_no_role_claim_is_strictly_rejected():
    """
    CRITICAL REQUIREMENT:
    A valid JWT with no role claim at all must be rejected with HTTP 403
    the same as an unauthorized role, not error unpredictably.
    """
    token_no_role = create_test_rs256_token({
        "sub": "user_no_role_01",
        "email": "newuser@example.com",
        "name": "Unassigned User",
        # NOTE: No 'role' claim present in payload
    })

    # Test against officer endpoint
    res_officer = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token_no_role}"})
    assert res_officer.status_code == 403
    assert "Forbidden" in res_officer.json()["detail"]
    assert "no assigned role" in res_officer.json()["detail"].lower()

    # Test against vendor endpoint
    res_vendor = client.get("/api/v1/auth/probe/vendor", headers={"Authorization": f"Bearer {token_no_role}"})
    assert res_vendor.status_code == 403
    assert "Forbidden" in res_vendor.json()["detail"]
    assert "no assigned role" in res_vendor.json()["detail"].lower()


def test_nested_public_metadata_role_is_recognized():
    """Verifies Clerk's nested public_metadata.role format if passed that way."""
    token = create_test_rs256_token({
        "sub": "user_vendor_nested",
        "public_metadata": {"role": "vendor"},
        "email": "vendor@shop.com",
    })
    res = client.get("/api/v1/auth/probe/vendor", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["role"] == "vendor"


def test_invalid_signature_is_rejected():
    token = create_test_rs256_token({
        "sub": "user_hacker",
        "role": "officer",
    }, key_pem=_untrusted_pem)
    res = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "Could not validate credentials" in res.json()["detail"]


def test_expired_token_is_rejected():
    token = create_test_rs256_token({
        "sub": "user_expired",
        "role": "officer",
    }, expire_minutes=-10)
    res = client.get("/api/v1/auth/probe/officer", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_missing_token_is_rejected():
    res = client.get("/api/v1/auth/probe/officer")
    assert res.status_code == 401


if __name__ == "__main__":
    pytest.main(["-v", __file__])
