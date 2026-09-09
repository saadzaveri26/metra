"""
METRA backend configuration. All values overridable via environment
variables. See production_artifacts/Technical_Specification.md for the
security baseline this implements (upload cap, WAL mode, etc.).
"""
import os
from typing import List


class Settings:
    APP_NAME: str = "METRA Backend"
    ENV: str = os.getenv("METRA_ENV", "development")
    API_PREFIX: str = "/api/v1"

    SECRET_KEY: str = os.getenv("METRA_SECRET_KEY", "dev-only-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("METRA_TOKEN_EXPIRE_MIN", "480"))

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

    # scan_id / case_id format enforced everywhere an ID is used to
    # resolve a file path, per the security baseline.
    ID_REGEX: str = r"^[A-Za-z0-9\-]{8,64}$"


settings = Settings()
