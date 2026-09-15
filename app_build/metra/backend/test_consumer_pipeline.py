import io
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
from models import Case, ConsumerReport, SafetyAlert, ManufacturerViolationCount

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


def make_test_image_bytes(width=200, height=200, color="green") -> bytes:
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


def test_consumer_lookup_compliance_and_nutrition():
    """
    Consumer lookup combines PCR 2011 compliance check with Open Food Facts nutrition.
    CRITICAL GROUND RULE: No internal officer risk score (0-100) is ever returned.
    """
    response = client.get("/api/v1/consumer/lookup?barcode=8901234567890")
    assert response.status_code == 200, response.text
    data = response.json()

    # Product & Compliance fields
    assert data["barcode"] == "8901234567890"
    assert "product_name" in data
    assert "compliance_status" in data
    assert len(data["declarations"]) >= 6

    # Verify presence of mandatory declarations
    declaration_names = [d["field"] for d in data["declarations"]]
    assert any("Maximum Retail Price" in name for name in declaration_names)
    assert any("Net Quantity" in name for name in declaration_names)
    assert any("Manufacturer" in name for name in declaration_names)

    # Nutrition / Open Food Facts fields
    assert "nutrition" in data
    nutrition = data["nutrition"]
    assert "nutriscore_grade" in nutrition
    assert "nova_group" in nutrition
    assert "nutrient_levels" in nutrition
    assert "nutriments" in nutrition

    # STATUTORY CHECK: Risk score must NOT be present in consumer payload
    assert "risk_score" not in data, "CRITICAL: Internal officer risk score must NEVER be exposed to consumers!"
    assert "risk_score" not in nutrition


def test_consumer_report_is_unverified_lead():
    """
    Citizen complaint submission creates an 'unverified_lead' record.
    CRITICAL STATUTORY GROUND RULE:
    Consumer reports are unverified leads, never auto-created as confirmed enforcement cases.
    """
    db = SessionLocal()
    initial_cases = db.query(Case).count()
    initial_violations = db.query(ManufacturerViolationCount).count()
    db.close()

    image_bytes = make_test_image_bytes()
    response = client.post(
        "/api/v1/consumer/reports",
        data={
            "barcode": "8901725131209",
            "product_name": "Spiced Potato Chips 70g",
            "brand_manufacturer": "Suvidha FMCG",
            "store_location": "Shree Ganesh General Store, Andheri East, Mumbai",
            "state_region": "Maharashtra",
            "violation_type": "overcharging_mrp",
            "description": "Store charged ₹30 cash when printed manufacturer MRP on pouch is clearly ₹20.",
        },
        files={"evidence_image": ("receipt_evidence.jpg", image_bytes, "image/jpeg")},
    )

    assert response.status_code == 201, response.text
    report_data = response.json()
    assert report_data["status"] == "unverified_lead"
    assert report_data["violation_type"] == "overcharging_mrp"
    assert report_data["image_path"] is not None

    # Verify that in database, NO Case record was created
    db = SessionLocal()
    new_cases = db.query(Case).count()
    assert new_cases == initial_cases, "Consumer report must NOT auto-create a Case record!"

    # Verify violation count did not increment
    new_violations = db.query(ManufacturerViolationCount).count()
    assert new_violations == initial_violations
    db.close()


def test_consumer_safety_alerts_public_access():
    """Safety and recall alerts are publicly accessible without authentication."""
    # Ensure at least one alert exists
    db = SessionLocal()
    if db.query(SafetyAlert).count() == 0:
        db.add(
            SafetyAlert(
                title="Test Recall Alert",
                product_name="Sample Product",
                brand_name="Sample Brand",
                hazard_type="recall",
                severity="critical",
                description="Test description",
            )
        )
        db.commit()
    db.close()

    response = client.get("/api/v1/consumer/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) >= 1
    assert "title" in alerts[0]
    assert "severity" in alerts[0]


def test_consumer_history_authenticated():
    """Authenticated consumer accesses their personal report and scan history."""
    consumer_token = create_test_rs256_token({
        "sub": "user_consumer_history_test",
        "role": "consumer",
        "public_metadata": {"role": "consumer"},
    })

    # Submit report as this consumer
    client.post(
        "/api/v1/consumer/reports",
        headers={"Authorization": f"Bearer {consumer_token}"},
        data={
            "product_name": "Organic Milk 500ml",
            "store_location": "Bandra Local Mart",
            "violation_type": "missing_mfg_date",
            "description": "No manufacturing or packaging date printed on pouch.",
        },
    )

    history_resp = client.get(
        "/api/v1/consumer/history",
        headers={"Authorization": f"Bearer {consumer_token}"},
    )
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert "reports" in history
    assert len(history["reports"]) >= 1
    assert history["reports"][0]["product_name"] == "Organic Milk 500ml"
