"""
METRA backend configuration. All values overridable via environment
variables. See production_artifacts/Technical_Specification.md for the
security baseline this implements (upload cap, WAL mode, etc.).
"""
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "METRA Backend"
    ENV: str = os.getenv("METRA_ENV", "development")
    API_PREFIX: str = "/api/v1"

    SECRET_KEY: str = os.getenv("METRA_SECRET_KEY", "dev-only-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("METRA_TOKEN_EXPIRE_MIN", "480"))

    # Clerk Auth Configuration
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
    CLERK_ISSUER: str = os.getenv("CLERK_ISSUER", "")
    CLERK_JWKS_URL: str = os.getenv("CLERK_JWKS_URL", "")
    # Optional PEM public key directly from Clerk Dashboard for fast validation or offline testing
    CLERK_JWT_KEY: str = os.getenv("CLERK_JWT_KEY", "")

    ALLOWED_ORIGINS: List[str] = os.getenv("METRA_ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    DATABASE_URL: str = os.getenv("METRA_DATABASE_URL", "sqlite:///./metra.db")

    UPLOAD_DIR: str = os.getenv("METRA_UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("METRA_MAX_UPLOAD_MB", "15"))

    OCR_ENGINE: str = os.getenv("METRA_OCR_ENGINE", "mock")  # "paddleocr" | "mock"
    OCR_MOCK_FIXTURES_DIR: str = os.getenv("METRA_OCR_MOCK_FIXTURES_DIR", "./dev_fixtures")
    # Benchmarked config from Technical_Specification.md — do not change
    # without re-benchmarking; naive config was 3-5x slower with no
    # accuracy gain on upright labels.
    OCR_MAX_IMAGE_LONG_EDGE: int = 1150
    OCR_DET_LIMIT_SIDE_LEN: int = 960

    VECTOR_STORE_DIR: str = os.getenv("METRA_VECTOR_STORE_DIR", "./vector_store")

    # Email & Notifications Configuration (Pass 9)
    # GROUND RULE: Notification emails route to DEMO_MODE test inbox until explicitly enabled.
    # SAFETY: EMAIL_DEMO_MODE is intentionally hardcoded True with NO env-var override.
    # Setting this to False requires editing this source file — it cannot be bypassed
    # via environment variables. This prevents accidental email dispatch in any
    # environment (dev, staging, CI) before real SMTP/Resend infrastructure is deployed.
    EMAIL_DEMO_MODE: bool = True
    EMAIL_TEST_INBOX: str = os.getenv("METRA_EMAIL_TEST_INBOX", "demo-test-inbox@metra.gov.in")
    FROM_EMAIL: str = os.getenv("METRA_FROM_EMAIL", "notifications@metra.gov.in")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")

    # scan_id / case_id / user_id format enforced everywhere an ID is used to
    # resolve a file path, per the security baseline.
    ID_REGEX: str = r"^[A-Za-z0-9_\-]{3,64}$"


settings = Settings()
