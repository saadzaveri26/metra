from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import Base, engine
import routes_auth
import routes_scans

# Dev convenience: create tables directly. Replace with Alembic
# migrations before this goes anywhere near production data.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Core compliance pipeline: scan -> OCR -> field structuring -> "
                "compliance matrix -> risk scoring -> mismatch check -> case creation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router, prefix=settings.API_PREFIX)
app.include_router(routes_scans.router, prefix=settings.API_PREFIX)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "ocr_engine": settings.OCR_ENGINE}
