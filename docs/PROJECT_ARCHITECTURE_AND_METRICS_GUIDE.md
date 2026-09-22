# Finalyse: Architecture, Metrics & Phase 1–8 Master Technical Guide

---

## 1. Executive Summary & Core Mission

### 1.1 The Core Problem: The Thin-File Penalty
Traditional underwriting systems rely heavily on centralized credit bureau scores (e.g., CIBIL, Experian, FICO) and formal tax documentation. This creates a systemic barrier for:
- **Gig-economy workers** (delivery drivers, freelancers, rideshare operators) with fragmented, multi-platform inflows.
- **Micro-entrepreneurs & kirana store owners** whose revenue is primarily digital UPI cash flows rather than audited balance sheets.
- **New-to-credit (NTC) / Thin-file individuals** who have never taken a formal bank loan or credit card, resulting in an automatic "No Bureau Hit" or credit rejection.

### 1.2 The Finalyse Solution
**Finalyse** is an explainable, alternative credit-risk assessment and intelligence platform. It ingests consented alternative banking, UPI, and cash-flow data, derives canonical financial behavior, and passes it through an interpretable machine-learning model to generate:
1. **Alternative Risk Score (0–100)**
2. **Estimated Default Probability (%)**
3. **Risk Band (`LOW`, `MODERATE`, `HIGH`)**
4. **Mathematical Feature Drivers (Signed Contributions)**
5. **Grounded, Plain-Language LLM Explanations (Gemini)**
6. **Dynamic What-If Counterfactual Sensitivity Analysis**

> [!IMPORTANT]
> **Authoritative Boundary**: The numerical calculations (Risk Score, Default Probability, Factor Weights) are determined **exclusively and authoritatively by the Machine Learning model**. The Large Language Model (Gemini) is strictly an **explainability and coaching interface**—it cannot modify scores, override decisions, or hallucinate credit bureau metrics.

---

## 2. High-Level System Architecture & Topology

Finalyse is built as a **3-tier distributed microservice system**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          REACT 19 FRONTEND                             │
│       Vite • Obsidian Glassmorphism • SVG Gauge • What-If Lab          │
│       Port: 3000 • AuthContext • ApiService • Role Switching           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/v1)
                                    │ Bearer JWT + X-Request-Id
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       NODE.JS / EXPRESS BACKEND                        │
│   Port: 4000 • Security (Helmet/CORS) • JWT RBAC (Analyst/Applicant)   │
│   Canonical Normalization • Repositories • What-If Sensitivity Engine   │
│   LLM Factory Orchestrator • Gemini 3.1 Flash-Lite + Tool Calling      │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │ PostgreSQL                               │ Internal REST
               │ Connection Pool                          │ X-Internal-API-Key
               ▼                                          ▼
┌──────────────────────────────┐        ┌────────────────────────────────┐
│      POSTGRESQL DATABASE     │        │     FASTAPI ML MICROSERVICE    │
│  Users • Applications        │        │ Port: 8000 • Python 3.13       │
│  Financial Profiles • Consents│        │ Feature Pipeline (StandardScaler)│
│  Risk Assessments (Baseline  │        │ Logistic Regression Model      │
│  & Scenario) • Explanations  │        │ Linear Log-Odds Attribution    │
└──────────────────────────────┘        └────────────────────────────────┘
```

---

## 3. The Mathematical & Metric Foundation

The platform converts raw transactions and income statements into **15 canonical features** (`feature_set_v1`), which the ML model maps to risk parameters.

### 3.1 Core Derived Financial Metrics

| Metric Name | Mathematical Formula | Underwriting Interpretation | Ideal Target |
| :--- | :--- | :--- | :--- |
| **Net Cash Flow Surplus** | $\text{Income} - \text{Expenses} - \text{EMI}$ | Uncommitted cash available to absorb living shocks and service new credit. | $> 20\%$ of income |
| **Debt-to-Income (DTI)** | $\frac{\text{Monthly Committed Debt (EMI)}}{\text{Monthly Income}}$ | Leverage burden. High DTI indicates that borrower is overextended. | $\le 35\%$ |
| **Savings Rate** | $\frac{\max(0, \text{Cash Flow Surplus})}{\text{Monthly Income}}$ | Proportion of monthly revenue converted to liquid capital retention. | $\ge 15\%$ |
| **Average Daily Balance** | $\frac{1}{N}\sum_{t=1}^N \text{Balance}_t$ | Average ledger liquidity maintained between payout cycles. | $\ge 0.5 \times \text{Expenses}$ |
| **Income Stability Index** | $1 - \min(1, \frac{\sigma_{\text{inflows}}}{\mu_{\text{inflows}}})$ | Measures inflow volatility. High variance indicates seasonal/irregular income. | $\ge 0.75$ |
| **Expense Volatility** | $\frac{\sigma_{\text{outflows}}}{\mu_{\text{outflows}}}$ | Outflow variance. Erratic spikes indicate emergency outlays or impulse spending. | $\le 0.30$ |
| **Transaction Regularity** | $\frac{\text{Active Transaction Days}}{\text{Total Days in Period}}$ | Digital banking engagement frequency (UPI / debit card usage). | $\ge 0.70$ |
| **Failed Payment Count** | $\sum \text{bounced debits or NSF events}$ | Direct indicator of liquidity shortfalls or account overdrafts. | $0$ |

---

### 3.2 Scoring & Default Probability Mechanics

```text
Raw Financials ──→ Feature Scaling ──→ Log-Odds (z) ──→ Sigmoid (P_default) ──→ Risk Score (0-100)
```

1. **Standardization**:
   $$x_i' = \frac{x_i - \mu_i}{\sigma_i}$$
2. **Log-Odds ($z$) Calculation**:
   $$z = \beta_0 + \sum_{i=1}^{K} \beta_i x_i'$$
   *Where $\beta_0$ is the intercept and $\beta_i$ are calibrated logistic regression weights.*
3. **Estimated Default Probability ($P_{\text{default}}$)**:
   $$P_{\text{default}} = \sigma(z) = \frac{1}{1 + e^{-z}}$$
4. **Alternative Risk Score Conversion (0–100 Scale)**:
   The score is calibrated so that higher scores represent higher creditworthiness:
   $$\text{Alternative Risk Score} = \text{round}\Big((1 - P_{\text{default}}) \times 100\Big)$$

### 3.3 Risk Bands & Underwriting Actions

| Risk Band | Score Range | Default Prob ($P_{\text{default}}$) | Underwriting Decision Recommendation |
| :---: | :---: | :---: | :--- |
| **`LOW`** | **$75 - 100$** | $< 25\%$ | **Recommended for Approval**: Qualifies for standard credit line without collateral. |
| **`MODERATE`** | **$50 - 74$** | $25\% - 50\%$ | **Conditional Approval**: Introductory limit with recurring transaction monitoring. |
| **`HIGH`** | **$0 - 49$** | $> 50\%$ | **Discretionary Review**: High debt burden; requires co-signer, escrow, or collateral. |

### 3.4 Feature Attribution (Signed Contribution Weights)
To ensure regulatory compliance (no black-box scoring), the model calculates exact feature attributions:
$$\text{Contribution}_i = -\beta_i \cdot x_i'$$
- **Positive Driver ($\text{Contribution} > 0$)**: Increases credit score (e.g., healthy cash surplus, zero failed payments).
- **Negative Driver ($\text{Contribution} < 0$)**: Compresses credit score (e.g., high DTI, low daily balance).

---

## 4. Phase-by-Phase Technical Breakdown (Phase 1 to Phase 8)

```text
Phase 1: Foundations & Architecture
   ↓
Phase 2: Backend, DB & Security
   ↓
Phase 3: Canonical Financial Ingestion
   ↓
Phase 4: ML Training Pipeline (ROC-AUC: 0.9496)
   ↓
Phase 5: FastAPI ML Service & Node Integration
   ↓
Phase 6: React 19 Frontend Dashboard
   ↓
Phase 7: Explainability Engine & Gemini Assistant
   ↓
Phase 8: What-If Sensitivity Lab & Role-Aware Chat
```

---

### Phase 1 — Project Foundation & Engineering Setup
- **Deliverables**:
  - `Antigravity_Master_Agent_Prompt_Definitive.md`: The single source of engineering truth.
  - `Architecture.md`: System topology, invariants, and sequence diagrams.
  - `financial-risk-assessment-openapi.yaml`: Formal OpenAPI 3.0.3 contract.
  - Workspace scaffolding: `backend/`, `frontend/`, `ml-service/`, `data/`, `tests/`, `docs/`.

---

### Phase 2 — Backend, Database & Security Foundation
- **Database Architecture (`backend/src/db/migrations/`)**:
  - PostgreSQL schema migration runner with tracking table `schema_migrations`.
  - Tables: `users`, `applications`, `applicant_profiles`, `consents`, `data_sources`, `financial_profiles`, `transactions`, `risk_assessments`, `risk_factors`, `llm_explanations`.
- **Security & RBAC**:
  - JWT Access Tokens (24h) and Refresh Tokens (7d).
  - Passwords hashed with `bcryptjs` (salt rounds: 10).
  - Roles: `APPLICANT` (can only view own files) vs `ANALYST` (underwriter access to all files).
  - Middleware: `requestId.js` (propagating `X-Request-Id`), `auth.js`, `validate.js`, `errorHandler.js`.
- **Database Connection Pooling**:
  - `backend/src/config/database.js` prioritizing individual environment variables (`DB_PASSWORD`, `DB_USER`, `DB_HOST`, `DB_PORT`, `DB_NAME`) over stale connection strings.

---

### Phase 3 — Financial Ingestion & Canonical Normalization
- **Canonical Schema (`backend/src/modules/financial/canonical.schema.js`)**:
  - Normalizes heterogeneous data sources into a unified structure.
- **Source Adapters**:
  - `ManualInputAdapter`: Direct financial declarations (income, expenses, EMI, balance).
  - `SyntheticDataPresetAdapter`: One-click presets for underserved personas:
    1. *Thin-File Gig Worker* (delivery driver with daily UPI flows, zero bureau record).
    2. *New-to-Credit Salaried* (entry-level corporate employee).
    3. *Micro-Entrepreneur / Kirana Owner* (store owner with steady daily digital turnover).
  - `CsvTransactionAdapter`: Ingests and parses bank statement CSV files.
- **Derived Financial Summary**:
  - Computes `cashFlowSurplus`, `debtToIncome`, `savingsRate`, and volatility indices.

---

### Phase 4 — Feature Engineering & Model Training Pipeline
- **Dataset Generation (`data/synthetic/generate_data.py`)**:
  - Generated calibrated synthetic records representing diverse Indian cash-flow segments.
- **Model Training (`ml-service/training/train.py`)**:
  - Model: Calibrated Logistic Regression with L2 regularization.
  - Preprocessing: `StandardScaler` for continuous ratios.
  - Validation Performance:
    - **ROC-AUC**: `0.9496`
    - **Accuracy**: `84.00%`
    - **Brier Score**: `0.0905`
  - Serialization: Model saved to `ml-service/artifacts/model_v1.joblib` and scaler to `scaler_v1.joblib`.

---

### Phase 5 — FastAPI Microservice & Backend Integration
- **FastAPI Endpoints (`ml-service/app/api/endpoints.py`)**:
  - Secured by `X-Internal-API-Key`.
  - `POST /internal/v1/predict`: Accepts feature vector, applies scaler, computes sigmoid probabilities, outputs score (0–100) and signed factor attributions.
  - `GET /health`: Microservice liveness and model readiness probe.
- **Node.js Client (`backend/src/integrations/ml/mlClient.js`)**:
  - Communicates with FastAPI via Axios with timeout and automatic retry logic.
- **Assessment Lifecycle Orchestrator**:
  - `POST /api/v1/applications/:id/assess`: Pulls canonical profile, invokes ML microservice, writes assessment and factors in a single transaction, and transitions status to `ASSESSED`.

---

### Phase 6 — React 19 Frontend & Core User Experience
- **Aesthetic Design System (`frontend/src/index.css`)**:
  - Vanilla CSS design system (zero Tailwind dependency).
  - Obsidian dark palette: Canvas (`#070a13`), Cards (`rgba(17, 24, 39, 0.7)`), Borders (`rgba(99, 102, 241, 0.2)`).
  - Glassmorphic panels (`backdrop-filter: blur(16px)`).
- **Core Pages & Components**:
  - `AuthPage.jsx`: Login/registration with 1-click demo persona quick-fills.
  - `NewApplicationPage.jsx`: 3-stage wizard (Personal details + Fair-lending consent $\rightarrow$ Financial ingestion $\rightarrow$ Verification & Score launch).
  - `AssessmentDashboardPage.jsx`: Complete risk assessment cockpit.
  - `ScoreGauge.jsx`: Custom SVG circular arc gauge displaying 0–100 score, risk band pill, and default probability.
  - `RiskFactorCard.jsx`: Positive and negative factor drivers with signed magnitude bars.
  - `DataCoverageCard.jsx`: Regulatory fair lending and data audit panel.

---

### Phase 7 — Explainability Orchestrator, Gemini & Tool Calling
- **Provider-Agnostic LLM Engine (`backend/src/integrations/llm/`)**:
  - `LLMFactory` instantiates providers conforming to `ProviderInterface`.
  - Supported providers: `gemini` (`gemini-3.1-flash-lite`) and `mock` (zero-latency offline testing).
- **Tool Calling Catalog (`catalog.tools.js`)**:
  - `getFeatureDefinition(featureName)`: Regulatory definition and model weight impact.
  - `getRiskMethodology()`: Documentation of the 0–100 scale and risk band thresholds.
  - Invariant: Tools are read-only; the LLM cannot mutate application records.
- **Deterministic Safety Fallback (`fallback.generator.js`)**:
  - If Gemini API fails, is rate-limited, or times out, a deterministic template-based explanation is returned with `fallbackUsed: true`.
- **Database Persistence**:
  - Explanations stored in `llm_explanations` table and linked to assessments.
- **Interactive Frontend Component (`AIExplanationCard.jsx`)**:
  - Displays executive summary, positive factor bullets, risk vulnerability flags, regulatory disclaimer, and a "Regenerate Narrative" action.

---

### Phase 8 — What-If Analysis, Sensitivity Lab & Role-Aware Chat
- **Baseline Score Protection Invariant**:
  - In PostgreSQL, baseline assessments have `assessment_type = 'BASELINE'`.
  - Counterfactual scenario simulations are saved with `assessment_type = 'SCENARIO'`.
  - `assessmentRepository.getLatestByApplicationId` strictly queries `assessment_type = 'BASELINE'`, guaranteeing that what-if simulations **never overwrite or shadow the official credit decision**.
- **What-If Engine (`backend/src/services/whatIf.service.js`)**:
  - Validates override parameters (`monthlyIncome`, `monthlyExpenses`, `monthlyEmi`, `averageBalance`).
  - Recalculates dependent ratios:
    - $\text{cashFlowSurplus} = \text{Income} - \text{Expenses} - \text{EMI}$
    - $\text{debtToIncome} = \frac{\text{EMI}}{\text{Income}}$
    - $\text{savingsRate} = \frac{\text{CashFlowSurplus}}{\text{Income}}$
  - Sends scenario features to FastAPI ML service for re-scoring.
  - Calculates deltas (`scoreDelta`, `probabilityDelta`, `changedFactors`).
- **Interactive What-If Simulator (`frontend/src/components/WhatIfSimulator.jsx`)**:
  - Real-time parameter sliders and number inputs.
  - 1-Click quick presets: `+20% Gig Inflows`, `-50% Debt EMI`, `-15% Living Expenses`, `+₹25k Liquidity Buffer`.
  - Live local ratio previews (Surplus, DTI %, Savings Rate %) updated on the fly.
  - Result view: Side-by-side Baseline vs. Scenario score with score delta pill (`+X pts` or `-X pts`), default probability shift, grounded explanation, and feature delta table.
- **Role-Aware Conversational AI Assistant (`chat.service.js` & `AssessmentChatDrawer.jsx`)**:
  - **Institutional Credit Analyst Persona**:
    - Addressed as **"Analyst"** or **"Underwriter"** (never as applicant Arjun).
    - Tone: **Direct, objective, concise, and blunt underwriting evaluation**.
    - Focuses on debt serviceability, cash-flow coverage ratios (DTI, surplus), balance volatility, and covenant structures.
    - Prohibits gentle borrower coaching.
  - **Borrower / Applicant Persona**:
    - Addressed warmly by name (e.g., Arjun).
    - Tone: **Gentle, encouraging, empathetic, and constructive**.
    - Explains factors without bureaucratic jargon and offers supportive coaching steps.
  - **In-Drawer Persona Mode Toggle**:
    - Interactive pill in drawer header allows switching between `🛡️ Underwriter Mode` and `🌱 Borrower Coaching Mode` with dynamic greetings and suggested prompts.

---

## 5. End-to-End Data Flow (User Journey)

The following sequence illustrates how a complete assessment flows through the system:

```text
User / Applicant             Frontend (React)         Backend (Express)        ML Service (FastAPI)     PostgreSQL        Gemini LLM
     │                              │                        │                         │                     │                │
 1.  ├─ Enter financial details ───►│                        │                         │                     │                │
     │  (Income, Expenses, EMI)     │                        │                         │                     │                │
 2.  │                              ├─ POST /financial-prof─►│                         │                     │                │
     │                              │                        ├─ Derive summary metrics ─────────────────────►│ Save Profile   │
 3.  ├─ Click "Run Assessment" ────►│                        │                         │                     │                │
     │                              ├─ POST /assess ────────►│                         │                     │                │
 4.  │                              │                        ├─ POST /predict ────────►│                     │                │
     │                              │                        │  (Feature Vector)       ├─ StandardScaler     │                │
     │                              │                        │                         ├─ Logistic Regress   │                │
     │                              │                        │◄── Score & Drivers ─────┤                     │                │
 5.  │                              │                        ├─ Save Baseline Assessment (type='BASELINE') ─►│ Save Baseline  │
     │                              │◄── Assessment JSON ────┤                         │                     │                │
 6.  │                              ├─ POST /explanation ───►│                         │                     │                │
     │                              │                        ├─ Generate Grounded Prompt ────────────────────────────────────►│
     │                              │                        │◄── Structured Explanation JSON ────────────────────────────────┤
     │                              │                        ├─ Save Explanation ───────────────────────────►│ Save LLM Expl  │
     │                              │◄── Display Expl Card ──┤                         │                     │                │
 7.  ├─ Open Chat & Ask Question ──►│                        │                         │                     │                │
     │  ("hi as analyst")           ├─ POST /chat ──────────►│ (Detects ANALYST Role)  │                     │                │
     │                              │                        ├─ Direct Underwriting System Prompt ───────────────────────────►│
     │                              │◄── Blunt Risk Notes ───┤                         │                     │                │
 8.  ├─ Move EMI Slider (-50%) ────►│                        │                         │                     │                │
     ├─ Click "Simulate Scenario" ─►│                        │                         │                     │                │
     │                              ├─ POST /what-if ───────►│                         │                     │                │
     │                              │                        ├─ Recalculate DTI/Surplus│                     │                │
     │                              │                        ├─ POST /predict ────────►│                     │                │
     │                              │                        │◄── Scenario Score ──────┤                     │                │
     │                              │                        ├─ Save Scenario (type='SCENARIO') ────────────►│ Save Scenario  │
     │                              │◄── Return Delta & Expl─┤ (Baseline Unaltered)    │                     │                │
 9.  │◄─ See +14 pts Delta Pill ────┤                        │                         │                     │                │
```

---

## 6. Testing & Quality Assurance Baseline

The platform maintains a comprehensive automated testing suite:

- **Backend Test Suite (Jest + Supertest)**: `7 suites, 64 tests passing` (100%)
  - `auth.test.js`: Registration, login, JWT issuance, RBAC.
  - `application.test.js`: Life-cycle transitions, consent validation, file access.
  - `assessment.test.js`: Ingestion to assessment integration.
  - `explanation.test.js`: Grounding, schema enforcement, fallback trigger.
  - `chat.test.js`: Analyst vs. Applicant tone differentiation, unassessed file rejection.
  - `whatIf.test.js`: Parameter validation, delta calculations, baseline preservation.
  - `health.test.js`: Health probes.
- **ML Service Test Suite (Pytest)**: `4 suites, 17 tests passing` (100%)
  - Feature extraction, preprocessing pipeline, prediction schemas, internal API key security.
- **Frontend Production Compilation**: Vite bundle builds in under 1.1s with 0 errors.

---

## 7. Configuration & Environment Variables

| Variable Name | Component | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | HTTP Port for Node.js API | `4000` |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Backend | PostgreSQL connection parameters | `localhost`, `5432`, `finalyse_db` |
| `DB_USER`, `DB_PASSWORD` | Backend | Database credentials | `postgres`, `******` |
| `JWT_SECRET` | Backend | Minimum 32-character secret for tokens | `dev_secret_key_...` |
| `ML_SERVICE_URL` | Backend | Base URL of Python ML service | `http://localhost:8000` |
| `ML_SERVICE_API_KEY` | Both | Shared internal secret for ML service | `dev_internal_ml_service_key...` |
| `LLM_PROVIDER` | Backend | Active explainability provider | `gemini` (or `mock` for offline) |
| `GEMINI_API_KEY` | Backend | Google Generative Language API key | `AIzaSy...` |
| `CORS_ORIGIN` | Backend | Frontend URL permitted for CORS | `http://localhost:3000` |
