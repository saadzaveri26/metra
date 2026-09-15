from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import Base, engine, SessionLocal
from models import SafetyAlert, ComplianceRulePolicy
from vector_store import seed_vector_database

import routes_auth
import routes_scans
import routes_vector
import routes_vendor
import routes_consumer
import routes_hq
import routes_assistant
import routes_notifications

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
app.include_router(routes_vector.router, prefix=settings.API_PREFIX)
app.include_router(routes_vendor.router, prefix=settings.API_PREFIX)
app.include_router(routes_consumer.router, prefix=settings.API_PREFIX)
app.include_router(routes_hq.router, prefix=settings.API_PREFIX)
app.include_router(routes_assistant.router, prefix=settings.API_PREFIX)
app.include_router(routes_notifications.router, prefix=settings.API_PREFIX)


@app.on_event("startup")
def on_startup():
    # Initialize and seed ChromaDB vector collections (rules_corpus & seller_registry)
    try:
        counts = seed_vector_database(force_reseed=False)
        print(f"[STARTUP] Vector collections initialized: {counts}")
    except Exception as e:
        print(f"[STARTUP WARNING] Vector database startup: {e}")

    # Seed demo safety alerts if table is empty
    try:
        db = SessionLocal()
        if db.query(SafetyAlert).count() == 0:
            alerts = [
                SafetyAlert(
                    title="Sub-Standard Net Quantity Recall Notice",
                    product_name="Golden Sun Refined Sunflower Oil 1L",
                    brand_name="Golden Sun Consumer Goods",
                    batch_number="GS-2026-0811",
                    hazard_type="net_quantity_shortage",
                    severity="critical",
                    description="Field inspection verified average net volume shortage of 45ml per container exceeding maximum permissible error under Rule 12.",
                    published_by="Directorate of Legal Metrology, Maharashtra",
                    state_region="Maharashtra",
                ),
                SafetyAlert(
                    title="Overcharging and Obscured MRP Advisory",
                    product_name="Roasted Salted Pistachios 200g",
                    brand_name="NutriSnack Formulations",
                    batch_number="NS-P772",
                    hazard_type="mislabeled_mrp",
                    severity="warning",
                    description="Multiple consumer complaints confirmed double-sticker application concealing original manufacturer MRP of ₹240 with ₹299 sticker.",
                    published_by="Legal Metrology Enforcement Wing",
                    state_region="Delhi NCR",
                ),
                SafetyAlert(
                    title="Missing Expiry & Customer Helpline Advisory",
                    product_name="Organic Herbal Cough Lozenges 50g",
                    brand_name="AyurVeda Formulations",
                    batch_number="AY-5501",
                    hazard_type="deceptive_packaging",
                    severity="advisory",
                    description="Packaging lacks mandatory customer care helpline number and illegible expiry month declaration in violation of Rule 6(1)(da).",
                    published_by="Ministry of Consumer Affairs",
                    state_region="ALL",
                ),
            ]
            db.add_all(alerts)
            db.commit()
            print(f"[STARTUP] Seeded {len(alerts)} public safety alerts.")

        # Seed baseline statutory ComplianceRulePolicy rules if table is empty
        if db.query(ComplianceRulePolicy).count() == 0:
            policies = [
                ComplianceRulePolicy(
                    rule_code="RULE-06-1-A",
                    title="Name & Physical Address of Manufacturer, Packer, or Importer",
                    category="all",
                    statutory_reference="Rule 6(1)(a), PCR 2011",
                    severity="CRITICAL",
                    description="Every package shall bear the name and complete physical address of the manufacturer or packer.",
                    penalty_clause="Section 36(1) penalty up to ₹25,000 for first offence.",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-06-1-B",
                    title="Net Quantity Declaration & Standard Metric Units",
                    category="all",
                    statutory_reference="Rule 6(1)(b) & Rule 12, PCR 2011",
                    severity="CRITICAL",
                    description="The correct net weight or measure in standard SI units (g, kg, ml, L) must be clearly stated on the PDP.",
                    penalty_clause="Section 36(2) penalty up to ₹50,000 for non-standard units.",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-06-1-E",
                    title="Maximum Retail Price (MRP) Inclusive of All Taxes",
                    category="all",
                    statutory_reference="Rule 6(1)(e), PCR 2011",
                    severity="CRITICAL",
                    description="Retail sale price inclusive of all taxes must be unambiguously stated. No retailer may charge higher than MRP.",
                    penalty_clause="Section 36(1) compounding penalty up to ₹25,000.",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-06-11",
                    title="Unit Sale Price (USP) Display Requirement",
                    category="all",
                    statutory_reference="Rule 6(11), PCR 2011",
                    severity="MAJOR",
                    description="Unit Sale Price in Rupees per g/ml/piece must accompany commodities sold by weight/volume exceeding 1g or 1ml.",
                    penalty_clause="Compounding fine under Section 36 for omitted USP.",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-06-1-D",
                    title="Month and Year of Manufacture / Pre-packing",
                    category="all",
                    statutory_reference="Rule 6(1)(d), PCR 2011",
                    severity="MAJOR",
                    description="Month and year in which commodity is manufactured or pre-packed must be clearly indicated in MM/YYYY format.",
                    penalty_clause="Statutory violation under Rule 6(1)(d).",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-06-1-DA",
                    title="Consumer Care Helpline & Redressal Details",
                    category="all",
                    statutory_reference="Rule 6(1)(da), PCR 2011",
                    severity="MAJOR",
                    description="Name, address, telephone number, and email address of designated consumer care representative must be displayed.",
                    penalty_clause="Mandatory declaration under 2017 amendments.",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-07-FONT",
                    title="Minimum Numeral Height for Net Quantity & MRP",
                    category="all",
                    statutory_reference="Rule 7, Table 1, PCR 2011",
                    severity="MAJOR",
                    description="Numeral font heights must strictly adhere to Table 1 based on principal display panel area.",
                    penalty_clause="Statutory non-compliance compounding under Rule 7.",
                ),
                ComplianceRulePolicy(
                    rule_code="RULE-06-1-G",
                    title="Country of Origin on Imported Commodities",
                    category="imported",
                    statutory_reference="Rule 6(1)(g), PCR 2011",
                    severity="CRITICAL",
                    description="The name of the country of origin must be stated prominently on every imported commodity package.",
                    penalty_clause="Customs and Legal Metrology seizure on import clearance.",
                ),
            ]
            db.add_all(policies)
            db.commit()
            print(f"[STARTUP] Seeded {len(policies)} baseline statutory compliance rule policies.")

        db.close()
    except Exception as e:
        print(f"[STARTUP WARNING] DB initial seeding: {e}")




@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "ocr_engine": settings.OCR_ENGINE}
