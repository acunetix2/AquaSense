# AquaSense Product Requirements Document

## 1. Product Summary
AquaSense is an AI-assisted citizen-science and environmental intelligence platform for urban freshwater ecosystems. It enables citizens to submit structured observations and photographs of streams and other freshwater environments, then applies AI-assisted quality checks and environmental assessment to make those observations more useful to researchers and communities.

The product does not position AI as an environmental authority. Instead, it supports citizens and experts by improving data quality, prioritization, interpretation, and explainability.

## 2. Product Vision
AquaSense aims to become an intelligent evidence layer connecting citizen observations with environmental research and decision-support workflows.

Core product principle:
- Citizens capture observations.
- AI helps validate quality and consistency.
- Explainable evidence cards summarize risk indicators.
- Humans verify and act on important signals.
- Environmental intelligence emerges from patterns across time and geography.

## 3. Problem Statement
Urban freshwater ecosystems face pollution, waste accumulation, habitat degradation, climate variability, and rapid urbanization. Citizens often notice changes at locations and times that formal monitoring programs cannot cover continuously.

Citizen-generated observations are often:
- incomplete or inconsistent,
- difficult for non-experts to interpret,
- hard to compare across locations and time,
- difficult for researchers to prioritize,
- poorly structured for downstream data integration,
- uncertain without human verification.

AquaSense transforms distributed citizen observations into structured, quality-aware environmental intelligence.

## 4. Hackathon Alignment
Primary track: Track 3 — AI-Supported Assessment

Secondary alignment:
- Track 2 — Data-to-Insight
- Track 6 — Resilience Informatics
- Track 7 — Digital Health Standards

AquaSense aligns strongly with AI-assisted validation, explainable assessment, and human-in-the-loop review.

## 5. Goals and Success Criteria
### 5.1 Product Goals
- Improve the quality and completeness of citizen environmental observations.
- Use AI responsibly to assist, not replace, human judgment.
- Convert individual observations into understandable environmental evidence.
- Detect emerging spatial and temporal patterns.
- Help reviewers prioritize cases requiring attention.
- Increase citizen understanding and repeat participation.
- Demonstrate interoperability-ready structured environmental data.

### 5.2 Hackathon Success Criteria
- Clear connection between citizen data, ecosystem monitoring, and One Health objectives.
- Differentiated AI/data-quality layer instead of a generic monitoring dashboard.
- Working end-to-end observation flow including AI assessment, database, map, and reviewer workflow.
- Non-expert users can submit observations without ecological jargon.
- Architecture remains extensible beyond the demo and integrates with existing environmental systems.

## 6. Target Users
### Primary Users
- Citizen Observer
- Environmental Researcher
- Environmental Reviewer
- Community Monitor
- Public / Community User

### User Needs
- Simple environmental reporting with guided questions.
- Clear explanation of observed conditions and likely indicators.
- Trust signals and confidence levels.
- Spatial and temporal understanding of local water health.
- Prioritized review workflow for expert intervention.

## 7. Core User Journey
1. Open AquaSense and choose “Assess a Stream.”
2. Select or confirm a monitoring location.
3. Capture or upload a photograph.
4. Complete a guided assessment using plain-language questions.
5. AquaSense runs image-quality and observation-consistency checks.
6. The citizen reviews warnings or suggested corrections.
7. AI generates an explainable evidence card.
8. The observation receives a monitoring signal such as Normal, Watch, or Investigate.
9. The observation is stored and appears on the map.
10. Multiple observations contribute to spatial and temporal signal detection.
11. Important observations can be routed to human reviewers.
12. Verified observations strengthen the platform’s evidence base.

## 8. Product Scope
### In Scope for MVP
- Citizen observation workflow
- Image upload and preview
- Structured stream assessment questions
- AI image and observation assistance
- Image-quality checks
- Observation consistency checks
- Explainable evidence card
- Confidence and data-quality indicators
- Environmental signal generation
- Interactive map
- Basic trend analysis
- Spatial cluster detection
- Human verification workflow
- Citizen contribution dashboard
- Basic educational content
- Structured observation API
- FHIR-compatible observation mapping proof of concept

### Out of Scope for MVP
- Clinical diagnosis or medical advice
- Declaring water safe/unsafe for consumption
- A complete national environmental monitoring system
- Physical sensor hardware
- Custom deep-learning model training from scratch
- Full production FHIR infrastructure
- Complex social networking
- Payments or subscriptions
- Large-scale enterprise administration

## 9. Functional Requirements
### FR-01: Account and Access
Users may register or log in; a guest/demo mode may be provided for the hackathon flow.

### FR-02: Start Assessment
Users can start a new environmental observation.

### FR-03: Location Capture
System records selected GPS coordinates or a manually selected monitoring site.

### FR-04: Image Upload
Users can capture or upload, preview, replace, and remove an image.

### FR-05: Guided Assessment
System presents plain-language questions covering water appearance, odour, waste, flow, vegetation, wildlife, and human activity.

### FR-06: AI Image Assessment
AI identifies potential visual indicators and image-quality concerns.

### FR-07: Consistency Check
System compares citizen answers with available image and context evidence and highlights inconsistencies.

### FR-08: Evidence Card
System generates a structured, citizen-readable summary containing indicators, evidence, confidence, and next steps.

### FR-09: Environmental Signal
System assigns a monitoring signal: Normal, Watch, or Investigate.

### FR-10: Map
Users can view observations and signals geographically.

### FR-11: Trend Analysis
System aggregates observations over time and displays basic trends.

### FR-12: Spatial Signals
System identifies clusters or unusual concentrations of related observations.

### FR-13: Human Verification
Authorized reviewers can verify, flag, or request more information.

### FR-14: Contribution Dashboard
Users can see observation and verification statistics.

### FR-15: Community Challenges
Users can participate in monitoring goals or location-based challenges.

### FR-16: Education
System provides concise One Health and environmental learning content.

### FR-17: Structured Data
Observations are stored using consistent machine-readable fields.

### FR-18: FHIR Mapping
System exposes a small proof-of-concept mapping to a FHIR Observation-style representation.

## 10. AI and Human-in-the-Loop Requirements
- AI should assist with validation, not act as an authority.
- Image and response quality checks must be explainable.
- Each evidence card must include indicators, confidence, evidence summary, and next steps.
- Sensitive outcomes such as safety declarations must remain outside the MVP scope.
- Human reviewers must be able to override or escalate AI-generated suggestions.
- All AI outputs must be auditable and traceable.

## 11. UX and Information Architecture Requirements
The product should feel accessible to non-specialists while still useful to researchers and reviewers.

Information architecture goals:
- Keep observation capture fast and guided.
- Use plain language instead of ecological jargon.
- Show clear status signals without fear-based or alarmist messaging.
- Provide actionable next steps in an understandable format.
- Surface trends and signals on maps and summary dashboards.

## 12. Technical Requirements
### Platform
- Responsive web application / Progressive Web App
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- UI and data libraries: TanStack Query, React Hook Form, Zod, Lucide icons, Supabase client
- Mapping stack: MapLibre GL + OpenStreetMap base layers
- Backend: Python + FastAPI + Uvicorn
- Data layer: Supabase PostgreSQL + SQLAlchemy 2 + Alembic + asyncpg
- Auth and storage: Supabase Auth + object storage for observation images
- Hosting: managed cloud deployment for frontend and API

This stack is selected to support a fast, maintainable MVP: strong frontend typing and validation for citizen workflows, managed Postgres storage for structured observations and review records, geospatial map rendering, and a clear Python API boundary for AI and review features.

### Data Requirements
- Observations must include metadata such as time, location, image, responses, and AI assessments.
- Signals should be derived from both individual observations and aggregated patterns.
- Structured data must support map rendering, review workflows, and future interoperability.

### Interoperability
- Store data in a consistent model that can map to FHIR-style resources.
- Exposure of a structured observation API is required for hackathon demonstration and future integration.

## 13. Security, Privacy, and Governance
- Protect user identity and observation data.
- Separate public citizen data from expert verification workflows.
- Keep AI outputs explainable and reviewable.
- Avoid making definitive safety claims outside the product’s defined scope.
- Implement role-based access for reviewers and administrators.

## 14. Non-Functional Requirements
- Responsive design across desktop and mobile devices.
- Fast submission flow for field usage.
- Clear loading states and validation feedback.
- Reliable data persistence with review and audit trails.
- Scalable architecture for future multi-city deployment.

## 15. Acceptance Criteria
### MVP Release Criteria
- A user can submit a stream observation with image and guided answers.
- The platform identifies likely image-quality or consistency issues.
- The system generates an explainable evidence card and monitoring signal.
- The observation appears on a map with temporal and spatial context.
- A reviewer can view, verify, flag, or request more information.
- Observation data is stored in a structured and queryable form.

## 16. Risks and Mitigations
### Risk: AI misclassifies conditions
Mitigation: human review, confidence indicators, explainability, and constrained scope.

### Risk: Inconsistent citizen data quality
Mitigation: guided forms, image checks, and response validation.

### Risk: Overstating certainty
Mitigation: clear status labels and a strict boundary around advice and safety claims.

## 17. Future Roadmap
- Expand to broader environmental domain coverage.
- Add more advanced pattern detection and anomaly alerts.
- Integrate with additional public data sets and environmental agencies.
- Support multi-city monitoring programs and community challenge campaigns.
- Advance interoperability and FHIR-based data exchange.

## 18. Final Product Positioning
AquaSense is not a hardware-only sensor platform and not a medical safety system. It is a trusted citizen-science and environmental intelligence layer that helps communities see, verify, and respond to freshwater conditions using a thoughtful blend of observation, AI assistance, and expert review.
