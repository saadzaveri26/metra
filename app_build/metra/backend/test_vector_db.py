"""
Test suite for METRA Vector Database (PASS 3):
1. `rules_corpus`: Semantic search for statutory rules and penalties under PCR 2011.
2. `seller_registry`: Fuzzy entity resolution matching fictional manufacturer variations.
3. Match decision logging: Verifies every match decision is recorded with officer audit details.
4. Role boundary: Ingest/re-seed endpoint restricted strictly to headquarters role.
5. Risk engine integration: Semantic repeat-offender lookup via vector registry.
"""
import json
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import jwt

from main import app
from config import settings
from vector_store import (
    seed_vector_database,
    query_rules,
    match_seller,
    get_match_audit_logs,
    SELLER_MATCH_AUDIT_LOG_FILE,
)
from repository import get_manufacturer_violation_count
from db import SessionLocal

client = TestClient(app)

# Generate ephemeral RSA keypair for testing RS256 Clerk tokens
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


@pytest.fixture(autouse=True)
def setup_clerk_key():
    original_jwt_key = settings.CLERK_JWT_KEY
    settings.CLERK_JWT_KEY = _public_pem
    yield
    settings.CLERK_JWT_KEY = original_jwt_key


@pytest.fixture(scope="module", autouse=True)
def seed_test_vector_db():
    """Ensure vector collections are seeded prior to tests."""
    seed_vector_database(force_reseed=True)


@pytest.fixture
def officer_token():
    return create_test_rs256_token({
        "sub": "officer_test_001",
        "role": "officer",
        "name": "Inspector Deshmukh",
        "state_region": "MH",
    })


@pytest.fixture
def hq_token():
    return create_test_rs256_token({
        "sub": "hq_admin_001",
        "role": "headquarters",
        "name": "Director Legal Metrology",
        "state_region": "ALL",
    })


@pytest.fixture
def vendor_token():
    return create_test_rs256_token({
        "sub": "vendor_test_001",
        "role": "vendor",
        "name": "Vendor Test User",
    })


def test_rules_corpus_semantic_search():
    """Test that querying rules_corpus returns relevant statutory rules and penalties."""
    query = "minimum font size for net quantity numerals on package label"
    matches = query_rules(query=query, top_k=3, threshold=0.50)
    assert len(matches) > 0
    top_match = matches[0]
    assert "Rule 7" in top_match["text"] or "font_analysis" in top_match["metadata"]["field_name"] or "numeral" in top_match["text"]
    assert top_match["similarity_score"] >= 0.50
    assert "Section 36(1)" in top_match["metadata"]["act_section"]


def test_seller_registry_fuzzy_matching_and_audit_log(officer_token):
    """Test fuzzy entity resolution against fictional seller registry and verify decision logging."""
    # Test variation: 'Suvidha F.M.C.G. Private Limited' should resolve to 'Suvidha FMCG Pvt. Ltd.'
    query_name = "Suvidha F.M.C.G. Private Limited"
    match = match_seller(query=query_name, threshold=0.80, officer_user_id="officer_test_001")
    assert match is not None
    assert match["id"] == "SELLER-FIC-001"
    assert match["metadata"]["canonical_name"] == "Suvidha FMCG Pvt. Ltd."
    assert match["similarity_score"] >= 0.80

    # Verify audit log recorded the decision
    logs = get_match_audit_logs(limit=10)
    assert len(logs) > 0
    last_log = logs[-1]
    assert last_log["query"] == query_name
    assert last_log["matched_business_id"] == "SELLER-FIC-001"
    assert last_log["is_match"] is True
    assert last_log["officer_user_id"] == "officer_test_001"
    assert "timestamp" in last_log


def test_seller_registry_rejects_unrelated_entity():
    """Unrelated fictional company should not match above threshold."""
    unrelated = "Zodiac Quantum Robotics Laboratory Tokyo"
    match = match_seller(query=unrelated, threshold=0.80)
    assert match is None


def test_api_rules_search_endpoint(officer_token):
    """Test GET /api/v1/rules/search endpoint."""
    response = client.get(
        "/api/v1/rules/search?q=MRP+inclusive+of+all+taxes&top_k=3",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total_matches"] > 0
    assert any("mrp" in m["metadata"]["field_name"] or "Rule 6(1)(e)" in m["text"] for m in data["results"])


def test_api_seller_match_endpoint(officer_token):
    """Test GET /api/v1/sellers/match endpoint."""
    response = client.get(
        "/api/v1/sellers/match?name=Himalayan+Pure+Honey+Solan&threshold=0.80",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["matched"] is True
    assert data["result"]["id"] == "SELLER-FIC-003"
    assert data["result"]["metadata"]["canonical_name"] == "Himalayan Nectar Foods Ltd."


def test_api_audit_log_endpoint_gating(officer_token, vendor_token):
    """Test that audit log endpoint is accessible by officers but forbidden to vendors."""
    res_officer = client.get("/api/v1/sellers/audit-log", headers={"Authorization": f"Bearer {officer_token}"})
    assert res_officer.status_code == 200
    assert "audit_trail" in res_officer.json()

    res_vendor = client.get("/api/v1/sellers/audit-log", headers={"Authorization": f"Bearer {vendor_token}"})
    assert res_vendor.status_code == 403


def test_admin_seed_endpoint_strictly_headquarters(hq_token, officer_token, vendor_token):
    """Test that POST /api/v1/admin/vector/seed requires headquarters role."""
    res_hq = client.post("/api/v1/admin/vector/seed", headers={"Authorization": f"Bearer {hq_token}"})
    assert res_hq.status_code == 200
    assert res_hq.json()["status"] == "success"

    res_officer = client.post("/api/v1/admin/vector/seed", headers={"Authorization": f"Bearer {officer_token}"})
    assert res_officer.status_code == 403

    res_vendor = client.post("/api/v1/admin/vector/seed", headers={"Authorization": f"Bearer {vendor_token}"})
    assert res_vendor.status_code == 403


def test_risk_engine_integration_with_semantic_seller_resolution():
    """Test that repository.get_manufacturer_violation_count resolves fictional alias and pulls violations."""
    db = SessionLocal()
    try:
        # Fictional alias for Suvidha FMCG Pvt. Ltd. (has 3 historical violations)
        count = get_manufacturer_violation_count(db, "Suvidha Consumer Goods")
        assert count == 3
    finally:
        db.close()
