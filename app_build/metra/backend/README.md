# METRA Backend — Setup & Run Guide

This is the FastAPI backend for the Core Compliance Pipeline (see
`production_artifacts/Technical_Specification.md` for the full spec).

## 1. Install dependencies

```bash
cd app_build/metra/backend
pip install -r requirements.txt
```

This installs the core API (FastAPI, auth, SQLAlchemy, Pillow) with the
**mock OCR engine** — no PaddleOCR/PaddlePaddle needed to get running.

### Optional: real OCR (PaddleOCR)

The default mode uses a mock OCR engine so you can run and test the whole
pipeline without a heavy ML install. To use real OCR instead:

```bash
pip install paddlepaddle paddleocr opencv-python-headless numpy
```

(uncomment those four lines in `requirements.txt` first, or just run the
command above directly)

## 2. Configure environment (optional)

Defaults work out of the box for local dev. To override anything, copy
this into a `.env` file in this folder or export as shell env vars:

```bash
METRA_ENV=development
METRA_SECRET_KEY=change-this-to-a-long-random-string
METRA_DATABASE_URL=sqlite:///./metra.db
METRA_UPLOAD_DIR=./uploads
METRA_MAX_UPLOAD_MB=15

# mock | paddleocr
METRA_OCR_ENGINE=mock
METRA_OCR_MOCK_FIXTURES_DIR=./dev_fixtures

METRA_ALLOWED_ORIGINS=http://localhost:3000
```

## 3. Run the server

```bash
uvicorn main:app --reload --port 8000
```

- API base URL: `http://localhost:8000/api/v1`
- Interactive API docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

Tables are created automatically on first startup (`Base.metadata.create_all`).
No separate migration step needed for local dev.

## 4. Try it out

### Register a consumer and log in

```bash
curl -X POST http://localhost:8000/api/v1/auth/register/consumer \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"pass1234","full_name":"Test User"}'

TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"pass1234"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```

### Run a scan

```bash
curl -X POST http://localhost:8000/api/v1/scans \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/any/label_photo.jpg" \
  -F "interface=consumer" \
  -F "is_imported=false"
```

With `METRA_OCR_ENGINE=mock` (the default), every scan reads the same
built-in demo label text unless you supply a fixture (see below), so
you'll get a `COMPLIANT` result on any image you upload — the point is
to exercise the pipeline (OCR → field extraction → rules engine → risk
score → case creation), not to actually read your photo.

### Simulate a specific label with the mock engine

Drop a text file into `dev_fixtures/` named after the image file you'll
upload, one OCR "line" per line:

```bash
# dev_fixtures/my_test_label.ocr.txt
No Address Pvt Ltd
Mango Pickle
Net Wt 500 gms
MRP Rs. 90
Mfg 08/2026
```

Then upload a file named `my_test_label.jpg` (any actual image content —
the mock engine ignores pixels and reads the fixture instead) and the
scan will process those exact lines, producing real violations (bad
unit symbol, missing "inclusive of all taxes", missing consumer care).

### Inspector flow

Inspector accounts require HQ verification before login works
(`inspector_verified` starts `False`). There's no HQ-verification
endpoint wired up yet in this cycle — to test the inspector role
locally, either flip the flag directly in the SQLite DB, or wait for
the HQ dashboard feature (a later cycle, per `startcycle.md`'s build
order).

```bash
sqlite3 metra.db "UPDATE users SET inspector_verified=1 WHERE email='inspector@test.com';"
```

## 5. Run the automated smoke test (optional)

There's no formal test suite yet (not in scope for this cycle). To
manually re-verify the pipeline end-to-end, see the curl sequence used
during development in this chat's history, or re-run:

```bash
# from app_build/metra/backend/
python3 -c "import main; print('imports OK')"
```

## Known limitations in this cycle

- Mock OCR only reads real label photos if you're running with
  `METRA_OCR_ENGINE=paddleocr` (requires the optional install above).
- No Ask METRA endpoint yet — depends on the Chroma vector store setup
  planned for the next cycle.
- No HQ dashboard/inspector-verification endpoint yet.
- Font-size legibility check is a rough pixel-based estimate
  (`field_structuring.analyze_font_sizes`) and always returns
  `NEEDS_REVIEW`, never a hard pass/fail — there's no physical scale
  reference in a phone photo to measure real millimetres.
- No automated test suite.
