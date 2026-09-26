# AquaSense Agent Guide

## 1. Purpose
This document defines how AI agents, contributors, and automation should work on the AquaSense project. It aligns development with the product’s mission: helping communities observe freshwater conditions, interpret them responsibly, and route important findings to expert review.

## 2. Product Guardrails
Agents must protect the product’s core constraints:
- AI assists, but does not replace human review.
- The platform does not declare water safe or unsafe for consumption.
- Signals are informational, not definitive health diagnoses.
- Environmental insights must be explainable and evidence-based.
- Output should remain understandable to non-experts.

## 3. Mission Alignment
AquaSense is built for:
- citizen science,
- trustworthy environmental observation,
- clear evidence generation,
- pattern detection across space and time,
- human-in-the-loop verification.

Any feature or code change should support at least one of these outcomes.

## 4. Agent Roles and Responsibilities
### Product Agent
- Maintains alignment with PRD and hackathon scope.
- Checks that new work supports MVP priorities.
- Helps reject scope creep that is not justified by demo or product value.

### Frontend Agent
- Build accessible, actionable, mobile-first UI flows.
- Prioritize plain-language prompts and clear signal messaging.
- Ensure the observation flow is fast and understandable.

### Backend Agent
- Implement robust API validation and structured storage.
- Ensure review, aggregation, and evidence endpoints are consistent.
- Keep service boundaries clean and testable.

### AI / Data Agent
- Keep AI output explainable and confidence-aware.
- Avoid over-stating certainty or making health claims.
- Capture evidence metadata and signal generation logic in a traceable way.

### QA / Review Agent
- Validate flows from start to finish: submit → assess → evidence → review.
- Check accessibility, error handling, and edge cases.
- Confirm features match the PRD and acceptance criteria.

## 5. Working Rules
- Prefer clean, simple flows over overly complex implementation.
- Keep UI plain-language and non-technical for the citizen experience.
- Keep review and expert workflows explicit and auditable.
- Add logging or metadata whenever AI output influences a signal or decision.
- Maintain a strict boundary between observations, risk indicators, and safety claims.

## 6. Required Acceptance Patterns
Any task should satisfy the following before completion:
- It connects to a real user need or product requirement.
- It fits the MVP scope or clearly documents future extension.
- It preserves explainability and trust.
- It includes relevant validation or test coverage.
- It is understandable to a researcher, reviewer, and citizen user.

## 7. Quality Bar for AI Features
When building or editing AI-related features:
- Expose confidence and rationale.
- Show what evidence informed the output.
- Allow review override or correction.
- Avoid hidden or opaque score-only heuristics.
- Keep the final user-facing language precise and calm.

## 8. Data and Privacy Rules
- Minimize unnecessary personal or sensitive data capture.
- Protect access to reviewer actions and administrative data.
- Keep observation records traceable and auditable.
- Maintain role separation between citizen submissions and expert review.

## 9. Scope Discipline
The MVP is not a clinical or safety system. Agents should resist adding features that imply authority beyond the product’s defined scope.

Do not promote features that:
- declare a water source safe or unsafe for consumption,
- provide medical diagnosis,
- substitute for formal regulatory assessment.

## 10. Recommended Workflow for New Work
1. Review the relevant requirement in the PRD.
2. Check whether the change aligns with the product scope and user journey.
3. Implement the smallest useful feature.
4. Validate UX clarity, trust signals, and reviewer capability.
5. Ensure AI explanations remain understandable.
6. Record any assumptions or future follow-up work.

## 11. Deliverables and Documentation Expectations
For every substantial feature, keep documentation aligned with:
- PRD requirements,
- design system patterns,
- architecture boundaries,
- any AI decision logic and confidence models.

## 12. Summary
AquaSense agents should optimize for trust, clarity, and evidence. The system should empower citizens to participate in environmental monitoring, help reviewers identify meaningful cases, and provide insight without overstepping the product’s boundary as an informational and decision-support platform.
