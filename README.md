<div align="center">

# 🌊 AquaSense

**AI-assisted citizen-science platform for observing freshwater conditions**

[![Backend Tests](https://img.shields.io/badge/backend%20tests-89%20passing-2ea44f)](#tests--checks)
[![TypeScript](https://img.shields.io/badge/tsc-clean-3178c6)](#tests--checks)
[![Lint](https://img.shields.io/badge/oxlint-0%20errors-blue)](#tests--checks)
[![License: CC BY 4.0](https://img.shields.io/badge/data%20license-CC--BY%204.0-lightgrey)](#license)

Citizens submit photo + field-condition observations. A vision model produces an
explainable signal (**Normal** / **Watch** / **Investigate**) with a consistency
check and an auditable AI decision trail. Certified reviewers verify or flag
important cases.

> ⚠️ **Informational only** — the platform never declares water safe or unsafe.

</div>

---

## 🌏 INCEPTION 2026

Submitted to **INCEPTION 2026** — *"Building Resilient Communities Through
Human-Centered Digital Innovation"*.

**Subtem:** Sustainable Environment and Disaster Resilience — *teknologi untuk
pelestarian lingkungan, pengelolaan sumber daya, dan kesiapsiagaan bencana.*

AquaSense serves community resilience by turning scattered, non-expert field
observations into a shared, reviewable record of freshwater conditions:

| Resilience need | How AquaSense answers it |
| --- | --- |
| Early community awareness | Signal-coded basin map plus `flow_condition` (healthy / low / stagnant / **flooding**) captured on every observation |
| Human-centered design | Plain-language copy, no ecological jargon, step-by-step capture wizard, mobile bottom-nav, staged loader, onboarding tour |
| Trust in automated advice | Explainable AI decision trail, consistency check against what the observer reported, and a mandatory human confirmation at every step |
| Resource management | Watershed analytics with per-location rollups, 14-day basin snapshots and trusted-source weighting |
| Data that outlives the demo | Open observation licence, documented REST API, FHIR-compatible export, role-gated review audit log |

---

## ✨ Features

| Area | Highlights |
| --- | --- |
| **Landing** | Glassmorphism hero over freshwater photography, worldwide rivers & lakes explorer, recent public observations, capability cards |
| **Auth** | Separate `/login` and `/signup` pages (no tab switcher) — Google sign-in, email/password, password recovery, email verification, reviewer role selection |
| **Capture wizard** | Place search or one-tap GPS geolocation with reverse-geocoded address, up to 3 field photos, odor/clarity/debris/flow answers, AI-assisted consistency check — citizen always confirms the final answer; unusable photos are rejected for retake |
| **Observation detail** | Photo evidence, AI decision trail (model, prompt version, rules fired, confidence, observer response, reviewer outcome), comments, likes, shares, per-observation analytics with cohort rank |
| **Community feed** | For You / Trending ranking, category filters, inline likes, shareable links; silently revalidates on focus / visibility / 60s — no manual refresh |
| **Basin map** | Interactive OpenStreetMap/Leaflet map with signal-coded markers and an observation inspector panel |
| **Watershed analytics** | Per-location rollups, engagement metrics, trusted monitoring-site sources, 14-day basin health snapshots, drill-downs |
| **Impact dashboard** | Live platform statistics, 8-day signal trend lines, health-index donut, personal submissions |
| **Reviewer queue** | Reviewer-only verification/flagging with notes and explicit AI agreement/override capture; every action is logged against the observation's evidence trail |
| **AI evaluation** | Live reviewer-agreement, override, review-coverage, and consistency-flag metrics — feedback is evidence for evaluation, never presented as environmental truth |
| **Profiles & social** | Public profiles, follow, profile likes, attribution sync for submitted observations |
| **Notifications** | Reviews, comments, likes, follows, and system events — bell dropdown, unread badge, polling, mark-as-read |
| **Theming** | Uber-dark theme with light/dark toggle in the navbar, persisted, no flash on load |
| **Progressive loader** | Staged, plain-language checklist while auth state and workspace data resolve |

## 🏗️ Architecture

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

**Key boundaries**

- 🤖 **AI assists, never overrides** — the citizen confirms or corrects the final answers; every AI-influenced signal carries a logged decision trail (model, prompt version, rules, confidence).
- 📷 **AI can abstain** — when a photo cannot support a visual assessment, AquaSense requests a clearer image instead of assigning a monitoring signal.
- 🧭 **Visible conditions, not water safety** — image scores describe visible environmental conditions only; they are never a safety, potability, or health rating.
- 👤 **Human review stays authoritative** — reviewers verify or flag; citizens can always edit/delete their own records (strict `user.id === observation.user_id` ownership, enforced server-side).
- 📊 **Signals are informational** — no safety, health, or regulatory claims.
- 🔒 **Backend owns validation and storage** — the frontend renders plain-language states and never invents data.

See [designs/Architecture.md](designs/Architecture.md) for diagrams and service boundaries.

## 📁 Repository layout

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
└── designs/
    ├── PRD.md                    # product requirements
    ├── Architecture.md           # system design
    ├── Design_System.md          # UI tokens and patterns
    └── DESIGN SPECs.md           # screen-by-screen design specification
```

## 🧰 Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS 4 (CSS-first) · framer-motion · Leaflet (`frontend/`) |
| **Backend** | FastAPI · SQLAlchemy 2 (async) · Alembic · Supabase Postgres (`backend/`) |
| **AI** | Groq vision model (`qwen/qwen3.8-27b`) with rule-based consistency checks and an auditable decision trail |
| **Storage** | Supabase Storage bucket `aquasense-observations` |
| **Auth** | Supabase Auth on the client; API calls carry an `X-User-Id` header validated server-side (401 when missing on protected routes) |

## 🚀 Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
copy .env.example .env       # fill in your own values — never commit .env
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

API docs (Swagger): http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
copy .env.example .env       # fill in your own values — never commit .env
npm run dev
```

The dev server defaults to http://localhost:5173 and proxies API calls to the
backend URL configured in your frontend environment file.

## 🔐 Environment configuration

Configuration is supplied entirely through local `.env` files — one for
`backend/` and one for `frontend/`. Each directory ships a `.env.example`
template with empty placeholders; copy it to `.env` and fill in your own
credentials locally.

- **Never commit `.env` files** — both `.env` and any populated `.env.example`
  are git-ignored.
- The backend `.env` configures database connectivity, Supabase project
  access (anon + service-role keys), the Groq API key, environment mode,
  allowed CORS origins, and the API port.
- The frontend `.env` configures the backend API base URL and the public
  Supabase project URL/anon key.
- Consult each directory's `.env.example` file for the exact variable names
  and short descriptions of what each one does.

## 🗄️ Database & migrations

```bash
cd backend
.venv/Scripts/python -m alembic upgrade head     # apply all migrations
.venv/Scripts/python -m alembic current          # show current revision
```

Migrations are guarded with `inspector.has_table` checks so they are safe to
re-run. Current head: **`009_notifications`** (observations/profiles, signals,
indexes, analytics views, notifications).

## 🔌 API reference (base: `/api/v1`)

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
| | `GET /analytics/ai-evaluation` | Reviewer agreement/override and responsible-AI feedback metrics |
| Notifications | `GET /notifications` | Current user's notifications |
| | `POST /notifications/{id}/read`, `POST /notifications/read-all` | Mark read |

Protected routes require the `X-User-Id` header: missing header → `422`,
unknown user → `401`, wrong owner/reviewer role → `403`, missing record →
`404`. Email addresses are never returned on public endpoints.

## ✅ Tests & checks

```bash
cd backend  && .venv/Scripts/python -m pytest     # API suite (in-memory SQLite)
cd frontend && npx tsc -b                          # typecheck
cd frontend && npx oxlint src                      # lint (keep new files at 0 errors)
cd frontend && npm run build                       # typecheck + production build
```

Current baseline: **89 backend tests passing**, `tsc` clean, oxlint 0 errors.

## 🎨 Design system

- **Surfaces** — `#F5F9FC` page background, white cards with `slate` borders; Uber-dark mode re-tokens the neutral scale (`.dark` class on `<html>`).
- **Brand** — deep blue `#0284C7`, teal `#1FB8A6`, live accent `#0284c7`.
- **Signals** — Normal (emerald), Watch (amber), Investigate (rose) — always shown with a text label, never color alone.
- **Type** — DM Sans; 15px base; sentence-case section labels.
- **Spacing/radii** — Supabase-inspired tokens (`--radius-sm/md/lg/xl`, 6–16px).
- **Copy** — calm, plain-language, non-technical; no safety claims.

Full token reference: [Design_System.md](Design_System.md).

## 🛡️ Product guardrails

- AI assists; it does not replace human review.
- The platform never declares water safe or unsafe for consumption.
- Signals are informational, not health diagnoses.
- Insights must be explainable and evidence-based; AI-influenced decisions are logged with metadata.
- Personal data is minimized; reviewer-only fields stay server-protected.

## 📚 Documentation

- [designs/PRD.md](designs/PRD.md) — product requirements
- [designs/Architecture.md](designs/Architecture.md) — system design
- [designs/Design_System.md](designs/Design_System.md) — UI tokens and patterns
- [designs/DESIGN SPECs.md](designs/DESIGN%20SPECs.md) — screen-by-screen design specification
- **Swagger UI** — live API documentation served at `/docs` on the running backend

## 🤖 AI Use Declaration

AquaSense uses AI in two distinct ways. This declaration covers both.

### 1. AI inside the product

| Aspect | Detail |
| --- | --- |
| Provider | [Groq](https://groq.com) hosted vision model, called server-side from `backend/app/services/ai_service.py` |
| Model id | `qwen/qwen3.8-27b` (configured as `_VISION_MODEL`; the public UI intentionally shows a generic **"AI vision model"** label instead of a vendor id) |
| Input | Up to 3 observer-uploaded photos, plus the observer's own answers (odour, clarity, debris, flow) and a text description. No names, emails or credentials are sent in the prompt. |
| Output | A structured assessment: visible-condition signal, `flow_condition`, turbidity/debris/odor indicators, confidence, and reasoning that is stored as an auditable decision trail. |
| Human control | The AI **never** writes the final record. The observer confirms or corrects every AI-suggested answer in Step 4 before submission, and certified reviewers can verify or override afterwards. |
| Abstention | If the photo cannot support a visual assessment — or no API key is configured — the service returns a flagged fallback and requests a clearer image rather than inventing a signal. |
| Consistency layer | A separate deterministic, rule-based check ([`consistency_service.py`](backend/app/services/consistency_service.py)) compares the model's reading with what the observer reported and raises a discrepancy for confirmation. No ML in this layer. |
| Hard limits | The model is asked to describe **visible conditions only**. It is never asked to, and must never be used to, conclude that water is safe, potable, or a health hazard. |
| Transparency | Every AI-influenced observation exposes model type, prompt version, rules fired, confidence, observer response and reviewer outcome. Reviewer agreement / override rates are published on the AI evaluation dashboard as feedback evidence. |

### 2. AI tools used to build the project

Development-time assistance (code generation, refactoring, review and
test writing) was used on this project, with a human author remaining
responsible for every merged change, architecture decision and product
guardrail. All generated code was read, tested and verified against the
suite described in [Tests & checks](#-tests--checks) before commit.

> 📌 Team: confirm and expand this subsection with the exact assistants and
> versions used, and which parts they touched, before submission.

### 3. What the data does **not** claim

Observations are citizen-reported and AI-assisted. They are a starting point for
community awareness and certified review — not regulatory measurement, not a
laboratory result, and not a substitute for official water-quality monitoring.

## 🧩 Third-Party Declaration

Everything below is used under its stated licence. No proprietary code from
third parties is presented as our own, and no third-party service output is
presented as an AquaSense original.

### Runtime services (hosted, free tiers)

| Service | Used for |
| --- | --- |
| **Supabase Postgres** | Primary database (accessed async via `DATABASE_URL`) |
| **Supabase Storage** | Observation photos, public bucket `aquasense-observations` |
| **Supabase Auth** | Email/password and Google sign-in on the client |
| **Groq API** | Vision model inference for image assessment |
| **Render** | Backend (FastAPI) hosting |
| **Vercel** | Frontend (React SPA) hosting |
| **OpenStreetMap** + OSM/Carto tile servers | Basemap tiles on the public basin map |
| **Esri ArcGIS Online** (`server.arcgisonline.com` World_Imagery) | Satellite tile layer on the observation map |
| **Nominatim** (`nominatim.openstreetmap.org`) | Place search and reverse geocoding in the capture wizard |
| **DiceBear 7.x** (`api.dicebear.com`) | Generated fallback avatars where a user has no picture |
| **goQR.me API** (`api.qrserver.com`) | Share QR codes in the observation share/export modal |
| **unpkg CDN** | Leaflet marker icon assets |
| **Google Fonts** | DM Sans and Inter webfonts, loaded from `fonts.googleapis.com` |

### Standards & vocabularies referenced

The FHIR export maps observations onto the **HL7 FHIR R4 `Observation`**
resource and references published code systems by URI only —
`http://loinc.org` and `http://terminology.hl7.org` CodeSystems (see
[`frontend/src/services/fhir.ts`](frontend/src/services/fhir.ts)). No HL7 or
LOINC source code is bundled; LOINC terms are a registry of the Regenstrief
Institute and HL7 FHIR specifications are used under HL7's terms.

### Backend dependencies (`backend/requirements.txt`)

| Package | Version | Purpose | Licence |
| --- | --- | --- | --- |
| FastAPI | 0.141.1 | Web framework / API layer | MIT |
| Uvicorn[standard] | 0.53.0 | ASGI server | MIT |
| SQLAlchemy | 2.0.54 | Async ORM | MIT |
| Alembic | 1.20.0 | Database migrations | MIT |
| asyncpg | 0.31.0 | Postgres driver | PostgreSQL License |
| psycopg[binary] | 3.3.6 | Postgres driver (fallback) | PostgreSQL License |
| pydantic-settings | 2.15.0 | Environment configuration | MIT |
| email-validator | 2.3.0 | `EmailStr` validation | Python Software Foundation |
| python-dotenv | 1.2.3 | Local `.env` loading | MIT |
| python-multipart | 0.0.32 | Multipart/form-data uploads | MIT |
| httpx | 0.28.1 | Outbound HTTP calls | BSD-3 |
| groq | ≥1.7.0 | Groq API client SDK | Apache-2.0 |
| supabase-py | ≥2.15.3 | Storage bucket access from the server | MIT |
| pytest / pytest-asyncio / aiosqlite | 9.1.1 / 1.4.0 / 0.22.1 | Hermetic test suite (in-memory SQLite) | MIT / Apache-2.0 |

### Frontend dependencies (`frontend/package.json`)

| Package | Version | Purpose | Licence |
| --- | --- | --- | --- |
| React / React DOM | 19.2.x | UI runtime | MIT |
| TypeScript | 6.0.x | Type checking | Apache-2.0 |
| Vite | 8.3.x | Build tool and dev server | MIT |
| Tailwind CSS | 4.3.x | Styling (CSS-first config) | MIT |
| lucide-react | 1.48.x | Icon set | ISC |
| framer-motion | 13.4.x | UI transitions | MIT |
| Leaflet / react-leaflet | 1.9.4 / 5.0.x | Basin maps and markers | BSD-2 / Apache-2.0 |
| @supabase/supabase-js | 2.117.x | Client auth + storage uploads | MIT |
| @types/leaflet | 1.9.x | Leaflet typings (dev) | MIT |
| oxlint | 1.81.x | Linting (dev) | MIT |

### Third-party media

| Asset | Source | Notes |
| --- | --- | --- |
| River and lake photographs in `frontend/public/images/` | Team-supplied local photography | Used as waterway showcase imagery |
| Scenic water photographs referenced by URL | [Unsplash](https://unsplash.com) | Unsplash License (free use, attribution not required) — linked remotely, not redistributed |
| `frontend/src/assets/hero.png` | Vite starter template | Unused leftover from the project scaffold — no third-party licence needed, safe to delete |

If any photograph in `frontend/public/images/` was in fact sourced from a third
party rather than taken by the team, swap the row above before submission —
judges check provenance claims.

## 👥 Contributors

| Member | GitHub | Contribution |
| --- | --- | --- |
| Iddy Chesire | [@acunetix2](https://github.com/acunetix2) | Product direction, architecture, FastAPI backend (all routes, services, Alembic migrations, test suite), React frontend and design system, Supabase/Groq/Render/Vercel integration, documentation |

> 📌 Add the remaining team members and split responsibilities before
> submission — the jury requires each member's contribution to be documented.

## 📄 License

Observation data: **CC-BY 4.0**. Source © Aventorgo.
