# AquaSense

AI-assisted citizen-science platform for observing urban freshwater conditions.
Citizens submit photo + field-condition observations; a vision model produces an
explainable signal (Normal / Watch / Investigate) with a consistency check and an
auditable AI decision trail; certified reviewers verify or flag important cases.
Informational only — the platform never declares water safe or unsafe.

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4 (in `frontend/`)
- **Backend** — FastAPI, SQLAlchemy 2, Alembic, Supabase Postgres (in `backend/`)
- **AI** — Groq vision model (`qwen/qwen3.8-27b`) with rule-based consistency checks
- **Storage** — Supabase Storage bucket `aquasense-observations` (observation photos)

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
copy .env.example .env   # fill in DATABASE_URL, GROQ_API_KEY, SUPABASE_* keys
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

API docs (Swagger): http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
copy .env.example .env   # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

## Tests & checks

```bash
cd backend && python -m pytest        # API test suite (in-memory SQLite)
cd frontend && npx tsc -b             # typecheck
cd frontend && npx oxlint src         # lint
cd frontend && npm run build          # typecheck + production build
```

## License

Observation data: CC-BY 4.0. Source © Aventorgo LLC.
