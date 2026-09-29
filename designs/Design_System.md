# AquaSense Design System

## 1. Design Mission
AquaSense should balance trust, clarity, and actionability. The design must help non-experts submit valid environmental observations while giving researchers and reviewers enough detail to interpret and validate the evidence.

The system must feel:
- accessible,
- credible,
- explainable,
- calm and non-alarmist,
- grounded in local environmental context.

## 2. Core Principles
### 2.1 Explainable by Default
Every AI decision should show the basis for the output. Evidence cards, confidence labels, and issue warnings should be understandable without technical jargon.

### 2.2 Human-Centered Observation Flow
The application should guide users through a clear and minimal progress path: location → image → assessment → evidence → signal → review.

### 2.3 One Health Framing
Environmental health should be described in clear, community-oriented terms that connect freshwater conditions to public, ecological, and community wellbeing.

### 2.4 Trust Over Drama
Signal states such as Normal, Watch, and Investigate should communicate uncertainty and context rather than sounding sensational or definitive.

## 3. Brand Direction
### Brand Positioning
AquaSense is a civic-science platform for seeing and verifying environmental change in freshwater ecosystems.

### Tone and Voice
- Clear and approachable
- Informative and precise
- Encouraging, not judgmental
- Calm and evidence-based

### Example language
- “We noticed a possible inconsistency in your observation.”
- “This stream may need a closer look.”
- “Based on the photo and your answers, this observation is a watch signal.”

## 4. Design Tokens
### Color Palette
Primary palette:
- Deep Water Blue: #0284C7
- Fresh Teal: #1FB8A6
- River Green: #4CAF50
- Gold / Signal Warning: #E9B44C
- Amber / Watch: #F59E0B
- Coral / Investigate: #E76F51
- Neutral Slate: #2F3A45
- Mist Background: #F5F9FC
- White: #FFFFFF

### Semantic Colors
- Success: River Green
- Warning: Amber
- Risk / Investigate: Coral
- Information: Deep Water Blue
- Neutral surfaces: Mist Background and Slate

### Typography
- Heading font: Inter, Poppins, or similar clean sans-serif
- Body font: Inter or system UI sans
- Scale:
  - H1: 32 px / 700
  - H2: 24 px / 600
  - H3: 20 px / 600
  - Body: 16 px / 400
  - Small label: 12–14 px / 500

### Spacing System
Use an 8px spacing scale:
- 8, 12, 16, 24, 32, 40, 48, 64

### Radius
- Small: 8px
- Medium: 12px
- Large: 20px
- Full pill: 999px

## 5. Technology Stack Alignment
The design system is built to match the AquaSense MVP stack and keep the product experience consistent across devices and interfaces.

- Frontend: React 19 + TypeScript + Vite for a fast, component-driven app shell
- Styling: Tailwind CSS for spacing, color, and responsive layout primitives
- Forms: React Hook Form + Zod for structured validation and clear user feedback
- Data fetching: TanStack Query for observation state, caching, and loading patterns
- Maps: MapLibre GL with OpenStreetMap basemaps for clear geographic context
- Icons: Lucide for clean, accessible status and action icons
- Backend: Python + FastAPI + SQLAlchemy 2 + Alembic + asyncpg
- Database and auth layer: Supabase PostgreSQL + Supabase Auth + storage

This combination supports a mobile-first citizen flow while preserving a trustworthy, explainable review experience for researchers and moderators.

## 6. Layout Principles
- Mobile-first responsive layout
- Clear top-to-bottom information hierarchy
- One primary action path per screen
- Risk information in the same view as the observation summary
- Maps and charts should support scannable, understandable data insights

## 7. Interface Patterns
### 7.1 Observation Capture Screen
- Header with progress indicator
- Location selection card
- Photo upload area with clear drag-and-drop or camera action
- Guided assessment form with plain-language questions
- Status panel showing AI assessment summary

### 7.2 Evidence Card
- Title: “Evidence Summary”
- Signal badge: Normal, Watch, Investigate
- Confidence indicator
- Bulleted evidence items
- Suggested next steps

### 7.3 Map View
- Layered markers grouped by signal type
- Hover or tap to view observation summary
- Filters for date, location, and signal category
- Map legend with simple color coding

### 7.4 Reviewer Queue
- Prioritized observations sorted by urgency
- AI-generated rationale and confidence
- Action buttons: verify, flag, request more info
- Timeline of review actions and notes

### 7.5 Dashboard
- Contribution statistics
- Observation totals and completion status
- Local trend cards
- Community challenge engagement area

## 8. Component Recommendations
### Buttons
- Primary CTA: filled blue or green, strong contrast
- Secondary CTA: outlined neutral button
- Destructive or caution actions: outlined with warm accent

### Form Fields
- Clear labels
- Help text with examples
- Inline validation errors
- Default values only when they are truly helpful

### Tags and Status Pills
- Normal: green
- Watch: amber
- Investigate: coral
- Confidence low/medium/high: consistent label color system

### Cards
- Use rounded corners and subtle shadow
- Keep content layered and scannable
- Include signal chips and key metrics

## 9. Accessibility and Inclusion
- Maintain contrast ratios suitable for readability
- Do not rely only on color to communicate status; pair with text and icons
- Use keyboard accessibility and focus states
- Avoid jargon; provide plain-language explanations for all user-facing metrics
- Support mobile screen sizes and offline-friendly interactions where possible

## 10. Design Quality Checklist
Before shipping a screen, confirm:
- It works for a first-time user with no ecological background.
- The primary action is obvious without reading a tutorial.
- The AI explanation is visible and understandable.
- Status labels are explicit and not misleading.
- The screen is usable on mobile and desktop.
- The path to review and action is clear.

## 11. Example IA Flow
- Home / Explore
- Start assessment
- Capture image
- Guided form
- AI quality review
- Evidence card
- Signal assigned
- Map and dashboard
- Reviewer queue

## 12. UI Governance
- Keep the design system consistent across all screens.
- Use component-level rules for spacing, typography, status labels, and elevated cards.
- Any AI-generated message should explicitly describe confidence and uncertainty.
- Product copy should not claim water safety or health outcomes beyond the platform’s defined scope.
