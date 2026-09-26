# AquaSense

AI-assisted citizen-science platform for observing freshwater conditions.
Citizens submit photo + field-condition observations; a vision model produces an
explainable signal (Normal / Watch / Investigate) with a consistency check and an
auditable AI decision trail; certified reviewers verify or flag important cases.

**Informational only — the platform never declares water safe or unsafe.**

## Features

- **Landing overview** — glassmorphism hero over real freshwater photography,
  worldwide rivers & lakes explorer, recent public observations, platform
  capability cards.
- **Separate login and signup pages** (`/login`, `/signup`) — no tab switcher;
  Google sign-in and email/password flows, password recovery, email
  verification, role selection for reviewers.
- **Guided capture wizard** — GPS pin (or pick a global waterway), up to 3 field
  photos, odor/clarity/debris answers, AI-assisted consistency check with the
  citizen always in control of the final answer.
- **Observation detail** — photo evidence, AI decision trail (model, prompt
  version, rules fired, confidence), comments, likes, shares, per-observation
  analytics tab with cohort rank.
- **Community feed** — For You / Trending ranking, category filters, inline
  likes, shareable links; revalidates silently in the background (focus /
  visibility / 60s — no manual refresh buttons anywhere).
- **Interactive basin map** — OpenStreetMap/Leaflet with signal-coded markers
  and an observation inspector panel.
- **Watershed analytics** — per-location rollups, engagement metrics, trusted
  monitoring-site sources, 14-day basin health snapshots, drill-downs.
- **Impact dashboard** — live platform statistics, 8-day signal trend lines,
  health-index donut, personal submissions.
- **Reviewer queue** — reviewer-only verification/flagging with notes; every
  action is logged against the observation's evidence trail.
- **Profiles & social** — public profiles, follow, profile likes, attribution
  sync for submitted observations.
- **Notifications engine** — reviews, comments, likes, follows, and system
  events with a bell dropdown, unread badge, polling, and mark-as-read.
- **Uber-dark theme** — light/dark toggle in the navbar (persisted, no flash on
  load) with a re-tokenized neutral palette.
- **Progressive loader** — staged, plain-language checklist while auth state
  and workspace data resolve.

## Architecture

```
Browser (React SPA)
   │  fetch  (X-User-Id header for API auth)
   ▼
FastAPI  ── /api/v1 ──┬── auth / health
                      ├── observations (CRUD, analyze-image, comments, likes, views)
                      ├── profiles (upsert, follow, like)
                      ├── analytics (regions, per-observation)
                      └── notifications (list, read, read-all)
   │
   ├── SQLAlchemy 2 async ── Supabase Postgres (Alembic migrations)
   ├── Groq vision model   ── explainable signal + consistency check
   └── Supabase Storage    ── observation photos (bucket: aquasense-observations)
```

Key boundaries:

- **AI assists, never overrides.** The citizen confirms or corrects the final
  answers; every AI-influenced signal carries a logged decision trail
  (model, prompt version, rules, confidence).
- **Human review stays authoritative.** Reviewers verify or flag; citizens can
  always edit/delete their own records (strict `user.id === observation.user_id`
  ownership, server-side).
- **Signals are informational.** No safety, health, or regulatory claims.
- Backend owns validation and storage; the frontend renders plain-language
  states and never invents data.

See [Architecture.md](Architecture.md) for diagrams and service boundaries.

## Repository layout

```
AquaSense/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # auth, observations, profiles, analytics, notifications, health
│   │   ├── core/             # config, permissions
│   │   ├── db/               # engine/session, Base
│   │   ├── models/           # SQLAlchemy models (incl. notification)
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # observation, profile, social, analytics, notification, AI
│   │   └── main.py           # app factory, router registration, CORS
│   ├── alembic/              # migrations (head: 009_notifications)
│   └── tests/                # pytest suite (86 tests)
├── frontend/
│   └── src/
│       ├── components/       # landing, auth, home, feed, map, capture, details,
│       │                     # analytics, dashboard, reviewer, profile, common
│       ├── context/          # AppProvider (views/data), AuthProvider (Supabase)
│       ├── services/         # api.ts (typed endpoints + cache)
│       └── types/            # Observation, ActiveView, roles
├── PRD.md                    # product requirements
├── Architecture.md           # system design
├── Design_System.md          # UI tokens and patterns
└── Agents.md                 # contribution/agent guardrails
```

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4 (CSS-first),
  framer-motion, Leaflet (`frontend/`)
- **Backend** — FastAPI, SQLAlchemy 2 (async), Alembic, Supabase Postgres
  (`backend/`)
- **AI** — Groq vision model (`qwen/qwen3.8-27b`) with rule-based consistency
  checks and an auditable decision trail
- **Storage** — Supabase Storage bucket `aquasense-observations`
- **Auth** — Supabase Auth on the client; API calls carry an `X-User-Id` header
  validated server-side (401 when missing on protected routes)

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
copy .env.example .env       # fill in the values (never commit .env)
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

API docs (Swagger): http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
copy .env.example .env       # fill in the values (never commit .env)
npm run dev
```

The dev server defaults to http://localhost:5173 and proxies API calls to the
backend URL configured in `VITE_API_URL`.

## Environment variables

Names only — values live in each `backend/.env` / `frontend/.env` and must
never be committed (both `.env` and `.env.example` values are gitignored where
applicable; the example files carry empty placeholders).

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `DATABASE_URL` | Supabase Postgres connection string |
| `backend/.env` | `SUPABASE_URL` | Supabase project URL |
| `backend/.env` | `SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | Server-side storage/admin operations |
| `backend/.env` | `GROQ_API_KEY` | Groq vision model access |
| `backend/.env` | `ENVIRONMENT` | `development` / `production` |
| `backend/.env` | `CORS_ORIGINS` | Allowed frontend origins |
| `backend/.env` | `PORT` | API port |
| `frontend/.env` | `VITE_API_URL` | Backend base URL |
| `frontend/.env` | `VITE_SUPABASE_URL` | Supabase project URL |
| `frontend/.env` | `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) |

## Database & migrations

```bash
cd backend
.venv/Scripts/python -m alembic upgrade head     # apply all migrations
.venv/Scripts/python -m alembic current          # show current revision
```

Migrations are guarded with `inspector.has_table` checks so they are safe to
re-run. Current head: **`009_notifications`** (observations/profiles, signals,
indexes, analytics views, notifications).

## API reference (base: `/api/v1`)

| Group | Endpoint | Notes |
| --- | --- | --- |
| Health | `GET /health` | Liveness + database check |
| Auth | `POST /auth/signup`, `POST /auth/login` | Email/password flows |
| Observations | `GET /observations` | List/filter by signal, status, user |
| | `POST /observations` | Create (owner only) |
| | `GET /observations/{id}` | Detail (email redacted server-side) |
| | `PATCH /observations/{id}` | Owner edit (403 otherwise) |
| | `DELETE /observations/{id}` | Owner delete |
| | `PATCH /observations/{id}/review` | Reviewer verify/flag (logs notification) |
| | `POST /observations/analyze-image` | Vision analysis (single/multi) |
| | `GET/POST /observations/{id}/comments`, `DELETE .../comments/{cid}` | Comments (owner-scoped) |
| | `POST/DELETE /observations/{id}/like`, `POST .../view` | Engagement |
| | `GET /observations/analytics` | Live platform statistics |
| Profiles | `POST /profiles/upsert`, `GET/PATCH /profiles/me` | Own profile |
| | `GET/PATCH /profiles/{user_id}` | Public profile |
| | `POST/DELETE /profiles/{user_id}/follow`, `.../like` | Social edges |
| Analytics | `GET /analytics/regions` | Per-location rollups, trusted sources, basin snapshots |
| | `GET /analytics/observations/{id}` | Engagement, AI trail, site cohort rank |
| Notifications | `GET /notifications` | Current user's notifications |
| | `POST /notifications/{id}/read`, `POST /notifications/read-all` | Mark read |

Protected routes require the `X-User-Id` header: missing header → `422`,
unknown user → `401`, wrong owner/reviewer role → `403`, missing record →
`404`. Email addresses are never returned on public endpoints.

## Tests & checks

```bash
cd backend  && .venv/Scripts/python -m pytest     # API suite (in-memory SQLite)
cd frontend && npx tsc -b                          # typecheck
cd frontend && npx oxlint src                      # lint (keep new files at 0 errors)
cd frontend && npm run build                       # typecheck + production build
```

Current baseline: **86 backend tests passing**, `tsc` clean, oxlint 0 errors.

## Design system

- **Surfaces** — `#F5F9FC` page background, white cards with `slate` borders;
  Uber-dark mode re-tokens the neutral scale (`.dark` class on `<html>`).
- **Brand** — deep blue `#0F4C81`, teal `#1FB8A6`, live accent `#0284c7`.
- **Signals** — Normal (emerald), Watch (amber), Investigate (rose); always
  shown with a text label, never color alone.
- **Type** — DM Sans; 15px base; sentence-case section labels.
- **Spacing/radii** — Supabase-inspired tokens (`--radius-sm/md/lg/xl`,
  6–16px).
- **Copy** — calm, plain-language, non-technical; no safety claims.

Full token reference: [Design_System.md](Design_System.md).

## Product guardrails

- AI assists; it does not replace human review.
- The platform never declares water safe or unsafe for consumption.
- Signals are informational, not health diagnoses.
- Insights must be explainable and evidence-based; AI-influenced decisions are
  logged with metadata.
- Personal data is minimized; reviewer-only fields stay server-protected.

See [Agents.md](Agents.md) for the full working rules.

## Documentation

- [PRD.md](PRD.md) — product requirements
- [Architecture.md](Architecture.md) — system design
- [Design_System.md](Design_System.md) — UI tokens and patterns
- [Agents.md](Agents.md) — guardrails for contributors and agents

## License

Observation data: CC-BY 4.0. Source © Aventorgo LLC.
