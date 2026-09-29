# AquaSense Architecture

## 1. Architecture Overview
AquaSense is designed as a modular, web-first platform for structured citizen environmental reporting. The system combines a responsive frontend application, a Python API backend, a structured database, spatial analytics, and AI-assisted interpretation services.

The high-level architecture supports these goals:
- capture public observations efficiently,
- validate image and answer consistency,
- store structured evidence,
- derive signals and trends,
- route important cases to expert review,
- support future interoperability and analytics.

## 2. System Components
### Frontend
Technology: React 19 + TypeScript + Vite + Tailwind CSS

Supporting libraries:
- TanStack Query for API state and cache management
- React Hook Form + Zod for form validation
- Lucide for interface icons
- MapLibre GL + OpenStreetMap for map rendering and geographic context

Responsibilities:
- observation capture UI,
- photo upload and preview,
- guided assessment forms,
- map display and signal summary,
- dashboard and reviewer workflows,
- citizen-friendly evidence cards.

### Backend API
Technology: Python + FastAPI + Uvicorn

Supporting libraries:
- SQLAlchemy 2 for ORM modeling and queries
- Alembic for schema versioning and migrations
- asyncpg for async PostgreSQL access

Responsibilities:
- authentication and session flows,
- observation creation and updates,
- AI calling layer,
- validation and rule-check logic,
- spatial query endpoints,
- reviewer actions and assignment APIs,
- FHIR-compatible mapping endpoint.

### Data Layer
Technology: Supabase PostgreSQL with geospatial-ready schema and managed storage

Responsibilities:
- persistence of users, sites, observations, media, assessments, reviews,
- geospatial lookup and clustering,
- aggregated trends and dashboards,
- metadata and audit trail support,
- auth and access control for citizen and reviewer roles.

Supabase acts as the managed Postgres backbone for AquaSense, providing the database, storage, and authentication layer needed for a reliable citizen-science workflow. Uploaded observation images are stored in Supabase storage, while the Postgres database remains the source of truth for structured observation and review records.

Deferred or optional additions such as Firebase, Carto, and messaging services are intentionally not in the default MVP stack. AquaSense’s core requirements are structured observation capture, reviewer workflows, geospatial exploration, and a single reliable relational data layer.

### AI Layer
Responsibilities:
- image quality assessment,
- observation consistency checks,
- evidence summary generation,
- confidence scoring,
- explainability outputs for evidence cards.

### Integration Layer
Responsibilities:
- FHIR-style observation export,
- future environmental data connectors,
- optional external dataset ingestion.

## 3. Core Flow
1. Citizen opens the app and begins an assessment.
2. User selects a location or site and uploads an image.
3. Guided assessment form captures qualitative observations.
4. Frontend sends the payload to the FastAPI backend.
5. Backend validates required fields and triggers AI evaluation services.
6. AI service produces quality checks, issue flags, and a confidence signal.
7. Backend composes an evidence card with explanation and a signal. 
8. Observation is stored in PostgreSQL/PostGIS with geospatial and metadata context.
9. Map and dashboard query aggregated results.
10. Reviewers can verify, flag, or request more information.

## 4. Data Model
### User
- id
- role
- display_name
- email
- status

### Site
- id
- name
- coordinates
- waterbody type
- created_by

### Observation
- id
- user_id
- site_id
- created_at
- image_url
- assessment_answers
- status
- confidence
- signal
- ai_summary

### Review
- id
- observation_id
- reviewer_id
- verdict
- notes
- action_taken

### Evidence Item
- id
- observation_id
- type
- title
- description
- confidence
- source

## 5. Signal Logic
Signals derive from both individual observation quality and spatial-temporal context.

Possible states:
- Normal
- Watch
- Investigate

This should be an interpretable classification, not a definitive safety or toxicity verdict.

## 6. API Design Concepts
### Observation APIs
- POST /observations
- GET /observations/:id
- GET /observations?location=&date=&signal=
- PATCH /observations/:id

### Review APIs
- POST /reviews
- GET /reviews/:observation_id
- PATCH /reviews/:id

### AI APIs
- POST /ai/assess-image
- POST /ai/check-consistency
- POST /ai/build-evidence-card

### Mapping APIs
- GET /interop/fhir/observation/:id

## 7. Security and Privacy Architecture
- Authentication and role-based access for reviewers.
- Public citizen submissions should be isolated from expert-only review actions.
- Sensitive personal data should be minimized and controlled.
- AI outputs should be stored with traceability to the underlying observation.
- Safety claims should be blocked or clearly labeled as outside scope.

## 8. Spatial and Analytics Design
Using PostGIS enables:
- geolocation queries,
- repeated site monitoring,
- cluster detection,
- map-based signal overlays,
- trend analysis over time.

Analytics should support both real-time dashboards and periodic environmental summaries.

## 9. Interoperability Design
AquaSense is designed to support lightweight interoperability in a hackathon-friendly scope.

Planned approach:
- persist structured observation data using consistent fields,
- expose a FHIR Observation-style representation,
- use standards-aligned vocabulary where practical,
- keep external integration simple and explainable.

## 10. Deployment Model
Recommended deployment for MVP:
- Frontend deployed as a static web app or PWA shell
- Backend deployed on a managed service or containerized environment
- Supabase for PostgreSQL/PostGIS and authentication
- Cloud storage for uploaded images
- AI services via hosted or managed inference endpoints

## 11. Architectural Principles
- Keep the user flow simple and guided.
- Ensure all AI outputs can be explained.
- Separate citizen data capture from expert verification workflows.
- Treat location and time as first-class data dimensions.
- Keep the system extensible for future multi-city deployments.

## 12. Architectural Risks and Mitigations
### Risk: AI-generated outputs over-trust
Mitigation: confidence bands, review hooks, and transparent evidence summaries.

### Risk: weak data quality
Mitigation: guided user flow, validation rules, and image checks.

### Risk: map overload and poor usability
Mitigation: clear clustering, filtered views, and simple signal legend.

## 13. Recommended MVP Architecture Diagram
Client App
  → React + Vite
  → FastAPI API
      → PostgreSQL/PostGIS
      → AI Assessment Service
      → Reviewer Workflow

This architecture keeps the MVP lean while supporting future scaling and more advanced analytics.
