# Skill: consumer_health_report

## Purpose
Give consumers (not officers) a plain-language health/safety report for a scanned product.

## Process
1. New module: `app_build/metra/backend/health_report.py`.
2. New endpoint: `GET /products/{barcode}/health-report` — calls Open Food Facts (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`), no API key required.
3. Parse into: calories, protein, carbohydrates, fat, sugar, salt (per 100g and per serving if available), Nutri-Score grade, NOVA classification, allergen tags.
4. If barcode isn't found, return a clear "no data available" response — never fabricate values.
5. Frontend: a distinct Consumer Health Report screen, clearly separated from officer-facing navigation.

## Rules
- Entirely read-only and public-facing — no officer authentication required, but must not expose officer-side data (case history, risk scores, seller violations).
- Never present this as a Legal Metrology compliance verdict — label clearly as nutritional/health information, separate from label compliance.
