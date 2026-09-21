# Project Status

## Project Goal
Build a complete, explainable, secure, locally runnable, and AWS-deployable dynamic financial-risk assessment platform for thin-file, new-to-credit, and underserved applicants. The system transforms consented financial behaviour into an Alternative Risk Score, Estimated Default Probability, Risk Band, Risk Drivers, and Data Coverage, paired with an interpretable, provider-agnostic LLM explanation layer (Gemini).

## Current Phase
Phase 6 — React Frontend & Complete Core User Flow (Completed)

## Completed Work
- **Phase 1 — Project Foundation & Engineering Setup**:
  - Master documents verified (`Antigravity_Master_Agent_Prompt_Definitive.md`, `Architecture.md`, `financial-risk-assessment-openapi.yaml`).
  - Git repository initialized on `main` branch.
  - Comprehensive `.gitignore`, `.env.example`, root `package.json`, root `README.md`.
  - Scaffolding for `backend/`, `frontend/`, `ml-service/`, `data/`, `tests/`.
- **Phase 2 — Backend, Database & Security Foundation**:
  - PostgreSQL database connection pool (`pg.Pool`) in `backend/src/config/database.js`.
  - Relational schema migrations (`001_initial_schema.sql`).
  - Request ID tracing (`X-Request-Id`) and OpenAPI-compliant error formatting.
  - JWT authentication and role-based authorization (`APPLICANT`, `ANALYST`, `ADMIN`).
- **Phase 3 — Financial Data Ingestion & Canonical Data Model**:
  - Canonical financial schema definitions and financial ratio calculator (`backend/src/modules/financial/canonical.schema.js`).
  - Source Adapters (ManualInput, SyntheticData, CsvTransaction).
  - Repositories & Services (`ApplicationRepository`, `FinancialRepository`, `ApplicationService`, `FinancialService`).
- **Phase 4 — Feature Engineering & ML Pipeline**:
  - Authoritative Feature Catalog `feature_set_v1` (`ml-service/app/features/catalog.py`).
  - Preprocessing pipeline with imputation, `StandardScaler`, and linear log-odds feature attribution.
  - Calibrated synthetic training dataset generator (`data/synthetic/training_dataset_v1.csv`).
  - Baseline Logistic Regression training pipeline yielding **Test ROC-AUC: 0.9496**, **Accuracy: 84.00%**, **Brier Score: 0.0905**.
  - Serialized model artifacts in `ml-service/artifacts/`.
- **Phase 5 — ML Service & Backend Integration**:
  - FastAPI Pydantic schemas in `ml-service/app/schemas/prediction.py`.
  - FastAPI internal router in `ml-service/app/api/endpoints.py` secured by `X-Internal-API-Key`.
  - Node.js `MLClient` in `backend/src/integrations/ml/mlClient.js`.
  - Schema alignment migration `002_align_risk_assessments_schema.sql`.
  - `AssessmentRepository` and `AssessmentService` persisting results to PostgreSQL and setting status to `ASSESSED`.
  - Endpoints `POST /api/v1/applications/:applicationId/assess` and `GET /api/v1/applications/:applicationId/assessment`.
- **Phase 6 — React Frontend & Complete Core User Flow**:
  - Built with **Vite + React** and bespoke **Vanilla CSS design system** with dark obsidian canvas, HSL color tokens, glassmorphism (`backdrop-filter: blur(16px)`), glowing accents, and micro-interactions.
  - Authentication UI (`AuthPage.jsx`) with Login and Register screens, role switching (`APPLICANT` vs `ANALYST`), and 1-click demo persona quick-fills.
  - Multi-step Intake Wizard (`NewApplicationPage.jsx`):
    - Step 1: Personal profile & mandatory fair lending consent toggle.
    - Step 2: Financial ingestion modes: 1-click Synthetic Personas (*Thin-File Gig Worker*, *New-to-Credit Salaried*, *Micro-Entrepreneur*), manual statement input, or bank statement CSV upload.
    - Step 3: Canonical metrics preview & ML assessment trigger.
  - Dynamic Risk Assessment Dashboard (`AssessmentDashboardPage.jsx`):
    - 0–100 Alternative Risk Score SVG circular arc gauge (`ScoreGauge.jsx`).
    - Estimated default probability (%) and Risk Band pills (`LOW`, `MODERATE`, `HIGH`).
    - Explainable model drivers card (`RiskFactorCard.jsx`) with positive/negative signed contribution magnitude bars.
    - Data coverage & regulatory governance cards (`DataCoverageCard.jsx`).
  - Applications List & Queue (`ApplicationsListPage.jsx`) supporting search and review.
  - API Client layer (`src/services/api.js`) and Auth State Context (`AuthContext.jsx`) with live backend health probing.
  - 42 Jest tests + 17 Pytest tests passing (59 total automated tests). Production Vite bundle built successfully.
- **Phase 7 — Explainability Orchestrator, Gemini & Tool Calling**:
  - Provider-agnostic LLM interface in `backend/src/integrations/llm/provider.interface.js` supporting text, structured JSON, and tool-augmented generation.
  - Google Gemini provider in `gemini.provider.js` using `gemini-3.1-flash-lite` with schema enforcement and tool dispatching.
  - Offline `MockProvider` in `mock.provider.js` and `LLMFactory` for seamless zero-latency test execution.
  - Versioned prompt template `risk-explanation-v1` enforcing strict grounding and prohibiting score alteration or bureau hallucinations.
  - Read-only underwriting tools in `catalog.tools.js`: `getFeatureDefinition` and `getRiskMethodology`.
  - Structured output validation schema in `schemas/explanation.schema.js`.
  - Deterministic safety fallback generator in `fallback.generator.js` with automatic failover if API key is invalid, rate-limited, or times out.
  - PostgreSQL persistence in `llm_explanations` table via `explanation.repository.js` and `explanation.service.js`.
  - REST API endpoints `GET /api/v1/applications/:applicationId/explanation` and `POST /api/v1/applications/:applicationId/explanation`.
  - Frontend interactive component `AIExplanationCard.jsx` embedded in the risk assessment dashboard with real-time regeneration controls.
  - 53 Jest tests + 17 Pytest tests (70 total automated tests) passing 100%.

- **Phase 8 — What-If Analysis, Counterfactual Simulations & Role-Aware Conversational AI**:
  - What-If Engine (`whatIf.service.js`, `whatIf.controller.js`, `POST /api/v1/applications/:applicationId/what-if`).
  - Baseline Preservation Invariant: Authoritative assessments (`assessment_type = 'BASELINE'`) are never overwritten or shadowed by scenario simulations (`assessment_type = 'SCENARIO'`).
  - Strict Override Validation: Rejects invalid or negative parameters with 400 Validation Error.
  - Deterministic Feature Recalculation: Accurately recomputes `cashFlowSurplus`, `debtToIncome`, and `savingsRate`.
  - ML Microservice Re-inference: Dispatches scenario feature vectors to FastAPI microservice for calibrated re-scoring.
  - Role-Aware Conversational AI Assistant:
    - Underwriter / Analyst Persona: Addressed as "Analyst" or "Underwriter" (never as applicant Arjun). Provides direct, objective, concise, and blunt underwriting evaluations regarding debt serviceability, cash-flow coverage, and covenant structures without borrower coaching.
    - Borrower / Applicant Persona: Addressed warmly by name. Receives gentle, encouraging, empathetic, and constructive coaching guidance without cold or blunt rejection language.
    - In-drawer persona toggle button allowing instant testing and perspective switching.
  - Frontend Interactive What-If Simulator (`WhatIfSimulator.jsx`):
    - Real-time parameter sliders for Monthly Income, Living Expenses, Committed Debt EMI, and Average Daily Balance.
    - Quick scenario preset buttons (+20% Gig Inflows, -50% Debt EMI, -15% Expenses, +₹25k Buffer).
    - Live projected ratio previews before simulation.
    - Score delta badge (`+X pts`), default probability delta, factor comparison table, and grounded underwriting narrative callout.
  - 64 Jest tests across 7 suites + 17 Pytest tests (81 total automated tests) passing 100%.

## Active Work
- None (Phase 8 completed, ready for Phase 9: Hardening, Testing, Documentation & Containerization)

## Pending Work
- Phase 9 — Hardening, Testing, Documentation & Containerization
- Phase 10 — AWS Deployment & Final Delivery

## Known Issues
- None currently blocking.

## Environment Status
- OS: macOS (Darwin Apple Silicon)
- Working Directory: `/Users/swakshgupta/Desktop/Finalyse`
- Node.js: v24.7.0
- npm: 11.5.1
- Python: 3.13.9 in `ml-service/.venv`
- Database: PostgreSQL connection pool, migrations 001/002/003, and test mock pool
- Dev Servers Running:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:4000`
  - ML Microservice: `http://localhost:8000`

## Testing Status
- Backend Test Suite (Jest + Supertest): 7 suites, 64 tests passed
- ML Service Test Suite (Pytest): 4 suites, 17 tests passed
- Total automated tests: 81 passed (100% passing)

## Deployment Status
- Local-first prototype running on localhost:3000 with live backend, ML microservice, Gemini explainability, and interactive what-if counterfactual scenario laboratory.

## Next Recommended Task
- Proceed to **Phase 9 — Hardening, Testing, Documentation & Containerization**.
