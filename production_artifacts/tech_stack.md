# METRA — Tech Stack Reference

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js / React (TypeScript) | |
| Styling | Tailwind CSS | Tokens in tailwind.config.ts, not hardcoded per-component |
| Avatar | Rive + @rive-app/react-canvas | State machine: avatarState, mouthOpen |
| Backend | FastAPI (Python) | |
| OCR/CV | PaddleOCR + OpenCV | See benchmarked config in Technical_Specification.md |
| Rule matching | sentence-transformers (all-MiniLM-L6-v2) + Chroma | Confirmed choice — see vector_database.md |
| Entity resolution | Chroma (seller_registry collection) | Repeat-offender detection across inconsistent seller records |
| Database | SQLite (WAL mode) | Upgrade path: PostgreSQL |
| Email | Resend (or fastapi-mail/smtplib fallback) | DEMO_MODE required |
| Nutrition data | Open Food Facts API | Free, no key required |
| Report export | ReportLab (PDF), python-docx (DOCX) | |
| UI design source | Figma (Dev Mode MCP) primary, v0.dev fallback | Never bare text-to-UI |

Deployment stack intentionally not finalized yet — deferred by team decision.
