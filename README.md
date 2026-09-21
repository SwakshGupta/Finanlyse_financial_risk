# AI-Powered Financial Inclusion: Dynamic Risk Assessment Platform

An explainable financial-risk assessment and intelligence platform designed specifically for thin-file, new-to-credit, and underserved applicants.

---

## 1. Project Overview

Traditional underwriting models often penalize or exclude applicants with limited formal credit history ("thin-file" applicants). This platform bridges the gap by ingesting consented alternative financial data (cash-flow stability, utility and bill consistency, transaction behavior, savings rates) and transforming it into an **Alternative Risk Score**, **Estimated Default Probability**, **Risk Band**, and **Model-derived Risk Drivers**.

Crucially, the system pairs an interpretable machine learning baseline with a **provider-agnostic LLM explainability layer** (powered initially by Google Gemini `gemini-3.1-flash-lite`). The LLM provides clear, grounded, analyst-ready explanations without ever modifying the authoritative numerical risk calculations.

### Core Architectural Principle

```text
Consented Financial Data
          ↓
Canonical Data Normalization
          ↓
Feature Engineering
          ↓
Machine Learning Risk Model (FastAPI)  ──[Authoritative]──→ Risk Score, Probability, Drivers
          ↓
Explainability Orchestrator (Node.js)
          ↓
Provider-Agnostic LLM Layer (Gemini)   ──[Non-Authoritative]─→ Grounded Plain-Language Explanation
          ↓
React Dashboard & What-if Scenario Analysis
```

> [!IMPORTANT]
> **Product Boundaries & Disclaimers:**
> - This platform is an **alternative risk-intelligence layer**, NOT an autonomous loan approval engine or a credit bureau replacement.
> - Output metrics are **Alternative Risk Scores**, not CIBIL/bureau scores.
> - The ML model alone is authoritative for numerical risk calculations. The LLM explains model drivers and does not make lending decisions.

---

## 2. System Architecture

```text
               +----------------------------------+
               |          React Frontend          |
               |       (Dashboard & What-if)      |
               +-----------------+----------------+
                                 |  HTTP / REST (/api/v1)
                                 v
               +----------------------------------+
               |     Node.js + Express Backend    |
               | (Auth, Ingestion, Orchestration) |
               +-------+------------------+-------+
                       |                  |
       SQL Persistence |                  | Internal REST (/internal/v1/predict)
                       v                  v
         +--------------------+   +-----------------------+
         |     PostgreSQL     |   | Python FastAPI ML Svc |
         |   (Canonical Data, |   | (Logistic Regression  |
         |    Audit, Results) |   |    Risk Baseline)     |
         +--------------------+   +-----------+-----------+
                                              |
                                              v
                              +-------------------------------+
                              |    Explainability Engine      |
                              |  (Provider-Agnostic Gemini    |
                              |   with Read-Only Tool Calls)  |
                              +-------------------------------+
```

---

## 3. Repository Structure

```text
Finalyse/
├── .env.example                                      # Environment variable template
├── .gitignore                                        # Global ignore rules
├── Antigravity_Master_Agent_Prompt_Definitive.md     # Authoritative Master Prompt
├── Architecture.md                                   # Master Architecture Blueprint
├── financial-risk-assessment-openapi.yaml            # Authoritative OpenAPI 3.0.3 Contract
├── package.json                                      # Root package orchestration
├── README.md                                         # Root documentation (this file)
│
├── backend/                                          # Node.js + Express REST API
│   ├── src/                                          # Controllers, services, routes, db repositories
│   ├── tests/                                        # Backend unit and integration tests
│   ├── package.json
│   └── README.md
│
├── frontend/                                         # React Single Page Application
│   ├── src/                                          # UI components, forms, dashboards, charts
│   └── README.md
│
├── ml-service/                                       # Python + FastAPI ML Microservice
│   ├── app/                                          # FastAPI endpoints, preprocessing, models
│   ├── training/                                     # Synthetic data generation and training pipelines
│   ├── artifacts/                                    # Serialized model and scaler artifacts
│   ├── tests/                                        # ML inference and validation tests
│   ├── requirements.txt
│   └── README.md
│
├── data/                                             # Data storage boundaries
│   ├── raw/                                          # Raw sample uploads / files (gitignored)
│   ├── processed/                                    # Normalized canonical dataset
│   ├── synthetic/                                    # Reproducible synthetic applicant dataset
│   └── README.md
│
├── docs/                                             # Project specifications and status tracking
│   ├── PROJECT_STATUS.md                             # Live 10-phase milestone tracker
│   └── ...
│
└── tests/                                            # End-to-end and cross-service validation
    └── README.md
```

---

## 4. Prerequisites & Local Environment Setup

### Prerequisites
- **Node.js**: v20+ (active version: v24.7+)
- **npm**: v10+ (active version: 11.5+)
- **Python**: v3.11+ (active version: 3.13+)
- **PostgreSQL**: v15+ (local brew service or Docker container)
- **Homebrew** (for macOS)

### macOS Local Setup Guide

#### 1. PostgreSQL Installation (Homebrew)
```bash
# Install PostgreSQL 16
brew install postgresql@16

# Start PostgreSQL background service
brew services start postgresql@16

# Create the default postgres superuser and application database
createuser -s postgres
createdb -U postgres finalyse_db
```

#### 2. Docker Installation (Optional for Dev, Required for Phase 9)
Install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) or via Homebrew:
```bash
brew install --cask docker
```

#### 3. Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY` and update `JWT_SECRET` with a secure random key.

---

## 5. Development Roadmap (10 Exact Phases)

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | **Project Foundation & Engineering Setup** | **Completed** |
| **Phase 2** | Backend, Database & Security Foundation | Next |
| **Phase 3** | Financial Data Ingestion & Canonical Data Model | Pending |
| **Phase 4** | Feature Engineering & ML Pipeline | Pending |
| **Phase 5** | ML Service & Backend Integration | Pending |
| **Phase 6** | React Frontend & Complete Core User Flow | Pending |
| **Phase 7** | Explainability Orchestrator, Gemini & Tool Calling | Pending |
| **Phase 8** | What-if Analysis & Product Differentiation | Pending |
| **Phase 9** | Hardening, Testing, Documentation & Containerization | Pending |
| **Phase 10** | AWS Deployment & Final Delivery | Pending |

Track real-time progress in [docs/PROJECT_STATUS.md](file:///Users/swakshgupta/Desktop/Finalyse/docs/PROJECT_STATUS.md).

---

## 6. License & Disclaimer

This project is developed for evaluation and demonstrative purposes under the AI-Powered Financial Inclusion initiative. It must not be deployed as an autonomous credit decision engine without human underwriting oversight and regulatory approval.
