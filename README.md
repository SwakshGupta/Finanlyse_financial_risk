# Finanlyse_financial_risk — AI-Powered Financial Risk Assessment Platform

An explainable, adaptive financial-risk assessment and intelligence platform designed specifically for thin-file, new-to-credit, and gig-economy applicants using alternative financial data and longitudinal temporal behavioral analysis.

---

## 1. Project Overview & Problem Statement

Traditional underwriting models rely heavily on formal credit bureau histories (e.g. CIBIL, Experian), which systematically penalizes or excludes millions of creditworthy thin-file individuals—such as gig economy delivery partners, freelancers, new salaried professionals, and micro-entrepreneurs.

**Finalyse** bridges this financial inclusion gap by ingesting consented alternative financial data (24-month cash-flow stability, utility bill payment regularity, transaction velocity, liquidity buffer retention, savings rates) and transforming it into an **Authoritative Alternative Risk Score (0–100)**, **Estimated Default Probability (%)**, **Risk Band (LOW / MODERATE / HIGH)**, and **Model-derived Risk Drivers**.

Crucially, the system pairs an authoritative, mathematically interpretable machine learning baseline with a **provider-agnostic LLM explainability layer** (powered by Google Gemini `gemini-3.1-flash-lite`). The LLM generates grounded, plain-language underwriting narratives and handles role-aware credit guidance without ever calculating, altering, or fabricating credit scores.

### Core Architectural Principle

```text
Consented 24-Month Financial Data
          ↓
Canonical Data Normalization & Temporal Metrics
          ↓
20-Feature Engineering Pipeline
          ↓
Machine Learning Model V2 (FastAPI)   ──[Authoritative]──→ Risk Score, Default Probability, Factor Drivers
          ↓
Explainability Orchestrator (Node.js)
          ↓
Provider-Agnostic LLM Layer (Gemini)   ──[Non-Authoritative]─→ Grounded Plain-Language Explanation & Role-Aware Chat
          ↓
React Dashboard, What-If Scenario Lab & Behavioral Insights
```

> [!IMPORTANT]
> **Product Boundaries & Disclaimers:**
> - This platform is an **alternative risk-intelligence layer**, NOT an autonomous loan approval engine or a credit bureau replacement.
> - Output metrics are **Alternative Risk Scores**, not formal bureau scores.
> - The Scikit-Learn Logistic Regression model alone is authoritative for numerical risk calculations. The LLM explains model drivers and does not make lending decisions.
> - All demonstration and training datasets utilize calibrated synthetic financial cohorts.

---

## 2. High-Level Architecture & Technology Stack

```text
               +-------------------------------------------------+
               |             React 18 Frontend (Vite)            |
               | (Dashboard, 24M Verification, What-If Simulator)|
               +-----------------------+-------------------------+
                                       | HTTP / REST (/api/v1)
                                       v
               +-------------------------------------------------+
               |            Node.js + Express Backend            |
               |   (Auth, Canonical Normalization, Orchestration)|
               +-----------+-------------------------+-----------+
                           |                         |
           SQL Persistence |                         | Internal REST (/internal/v1/predict)
                           v                         v
               +-----------------------+ +-----------------------+
               |  PostgreSQL Database  | | Python FastAPI ML Svc |
               | (Applications, Audit, | | (Logistic Regression  |
               |  Assessments, JSONB)  | |  Model V2.0.0 Engine) |
               +-----------------------+ +-----------+-----------+
                                                     |
                                                     v
                                       +-------------------------------+
                                       |      Explainability Engine    |
                                       |    (Provider-Agnostic Gemini  |
                                       |     with Read-Only Tools)     |
                                       +-------------------------------+
```

### Main Technology Stack
- **Frontend**: React 18, Vite, Vanilla CSS design system (dark obsidian canvas, glassmorphism, HSL color tokens), Lucide icons, Canvas Confetti.
- **Backend API**: Node.js 20, Express, PostgreSQL driver (`pg.Pool`), JWT authentication, Role-Based Access Control (`APPLICANT`, `ANALYST`, `ADMIN`).
- **Database**: PostgreSQL 15/16 (with JSONB support for versioned feature vectors and factor attributions).
- **ML Microservice**: Python 3.11/3.13, FastAPI, Pydantic v2, Scikit-learn, NumPy, Pandas, Joblib.
- **LLM / GenAI Layer**: Google Gemini (`gemini-3.1-flash-lite`) via Google Gen AI SDK, read-only underwriting tool-calling, and deterministic rule-based safety fallback.

---

## 3. Model V2 Overview: 20-Feature 24-Month Temporal Model

In Model V2 (`logistic_regression_v2.0.0`), the system transitioned from static single-month snapshot underwriting to **24-month longitudinal temporal behavioral analysis**.

### Feature Catalog V2 (20 Total Features)

| # | Feature Name | Type | Description & Underwriting Intuition | Direction |
|---|---|---|---|---|
| 1 | `monthly_income` | Baseline | Mean monthly gross inflow | Higher = Lower Risk |
| 2 | `monthly_expenses` | Baseline | Mean monthly living expenditures | Higher = Higher Risk |
| 3 | `monthly_emi` | Debt | Formal committed debt service repayments | Higher = Higher Risk |
| 4 | `cash_flow_surplus` | Cashflow | Net free cash buffer (`income - expenses - emi`) | Higher = Lower Risk |
| 5 | `debt_to_income` | Leverage | Ratio of EMI debt to monthly income (`monthly_emi / monthly_income`) | Higher = Higher Risk |
| 6 | `expense_ratio` | Cashflow | Ratio of living expenses to income | Higher = Higher Risk |
| 7 | `savings_rate` | Savings | Discretionary savings retention fraction | Higher = Lower Risk |
| 8 | `average_balance` | Liquidity | Average daily end-of-day bank balance | Higher = Lower Risk |
| 9 | **`minimum_balance_ratio`** *(NEW)* | Liquidity | Ratio of minimum balance to average balance (liquidity floor) | Higher = Lower Risk |
| 10 | `income_stability` | Volatility | Longitudinal income consistency (`1.0 - std/mean`) | Higher = Lower Risk |
| 11 | `expense_volatility` | Volatility | Variance in monthly outgoing debit flows | Higher = Higher Risk |
| 12 | `transaction_regularity` | Alternative | Proportion of active transaction days | Higher = Lower Risk |
| 13 | **`negative_cashflow_months`** *(NEW)* | Longitudinal | Count of deficit months over 24-month horizon (0–24) | Higher = Higher Risk |
| 14 | **`income_trend_3m`** *(NEW)* | Momentum | 3-month momentum comparing recent 3M average to baseline | Higher = Lower Risk |
| 15 | **`utility_payment_consistency`** *(NEW)*| Alternative | Regularity and on-time compliance score for utility bills | Higher = Lower Risk |
| 16 | **`digital_transaction_ratio`** *(NEW)* | Alternative | Verifiable UPI / Card / Netbanking flow share | Higher = Lower Risk |
| 17 | **`non_debt_recurring_obligations`** *(REWORKED)* | Commitments | Subscriptions, utilities, insurance (NO EMI double-counting) | Higher = Higher Risk |
| 18 | `failed_payment_count` | Alternative | Bounced debit attempts or ECS return count | Higher = Higher Risk |
| 19 | `existing_debt_amount` | Debt | Total outstanding principal estimate | Higher = Higher Risk |
| 20 | `observation_months` | Horizon | Longitudinal observation window duration (calibrated to 24) | Higher = Lower Risk |

### Model V2 Performance & Validation Metrics
- **Algorithm**: Regularized Logistic Regression (`C=1.0`, `solver='lbfgs'`) + `StandardScaler`.
- **Training Cohorts**: 3,000 synthetic longitudinal records across 4 calibrated segments (`THIN_FILE_GIG_WORKER`, `NEW_TO_CREDIT_SALARIED`, `MICRO_ENTREPRENEUR`, `OVERLEVERAGED_STRESSED`).
- **Test ROC-AUC**: `0.9168` (Train ROC-AUC: `0.9337`, Generalization Gap: `0.0169`).
- **Test Accuracy**: `83.50%` | **F1 Score**: `0.7258` | **Brier Score**: `0.1109`.

---

## 4. Key Differentiating Features

### 1. Grounded GenAI Underwriting Explanations
The LLM explainability layer synthesizes model weights into human-readable narratives. It uses read-only tools (`getFeatureDefinition`, `getRiskMethodology`) to strictly inspect model parameters without fabricating credit bureau scores.

### 2. Role-Aware Conversational Credit Advisor
- **Analyst Mode**: Delivers direct, objective, concise underwriting evaluations regarding debt serviceability, cash-flow coverage, and covenant structures without borrower coaching.
- **Applicant Mode**: Delivers gentle, supportive, encouraging guidance with actionable steps on how to manage cash flow and improve alternative scores.

### 3. Interactive What-If Counterfactual Lab
Borrowers and underwriters can adjust monthly income, expenses, debt EMI, and balance buffer sliders to preview real-time counterfactual credit score impacts.
- **Invariant**: Authoritative credit assessments (`assessment_type = 'BASELINE'`) are permanently preserved in PostgreSQL and cannot be overwritten by what-if scenarios (`assessment_type = 'SCENARIO'`).

### 4. Financial Trajectory & Behavioral Insights
Displays 3-Month Momentum, Deficit Months frequency out of 24 months, Liquidity Floor buffer retention, Utility regularity, Digital Footprint share, and strict separation between Loan EMIs and Non-Debt commitments.

---

## 5. Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v20+
- **Python**: v3.11+
- **PostgreSQL**: v15+ (local brew or service)

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/SwakshGupta/Finanlyse_financial_risk.git
cd Finanlyse_financial_risk

# Copy environment template
cp .env.example .env
cp .env.example backend/.env
```
Update `.env` with your PostgreSQL database credentials and optional `GEMINI_API_KEY`. (If `GEMINI_API_KEY` is not provided, the platform automatically utilizes a deterministic offline rule-based fallback).

### Step 2: Initialize Database
```bash
# Ensure finalyse_dev database exists in PostgreSQL
psql -d postgres -c "CREATE DATABASE finalyse_dev;"

# Run schema migrations and seed demo accounts
node backend/scripts/runMigrations.js
```

### Step 3: Start Services Locally

**Terminal 1 — Python ML Microservice (Port 8000):**
```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Express Backend API (Port 4000):**
```bash
cd backend
npm install
node src/server.js
```

**Terminal 3 — React Frontend Dev Server (Port 3000):**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 6. Automated Testing

Run the full verification test suites across all layers:

```bash
# 1. Backend Unit & Integration Tests (64 Jest tests across 7 suites)
npm --prefix backend test -- --runInBand

# 2. ML Microservice Tests (18 Pytest tests)
PYTHONPATH=ml-service pytest ml-service/tests -v

# 3. Frontend Production Build Verification
npm --prefix frontend run build
```

---

## 7. Project Documentation Index

- [docs/MODEL_V2_CHANGELOG.md](file:///Users/swakshgupta/Desktop/Finalyse/docs/MODEL_V2_CHANGELOG.md): Technical changelog for Model V2.
- [docs/DEPLOYMENT.md](file:///Users/swakshgupta/Desktop/Finalyse/docs/DEPLOYMENT.md): Local multi-service operation and deployment guide.
- [docs/PROJECT_STATUS.md](file:///Users/swakshgupta/Desktop/Finalyse/docs/PROJECT_STATUS.md): Real-time project milestone tracking.
- [phases/12_MODEL_V2_AND_TEMPORAL_UPGRADE_CHANGELOG.md](file:///Users/swakshgupta/Desktop/Finalyse/phases/12_MODEL_V2_AND_TEMPORAL_UPGRADE_CHANGELOG.md): LLM-ready architectural brief.
- [financial-risk-assessment-openapi.yaml](file:///Users/swakshgupta/Desktop/Finalyse/financial-risk-assessment-openapi.yaml): Authoritative OpenAPI 3.0.3 specification.

---

## 8. License & Responsible AI Disclaimer

This project is developed for evaluation and demonstrative purposes under the AI-Powered Financial Inclusion initiative. It must not be deployed as an autonomous lending approval system without human underwriting oversight, adverse-action compliance, and regulatory review.
