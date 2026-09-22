# Backend Service — AI-Powered Financial Inclusion Platform

The backend service is built with **Node.js 20** and **Express**, orchestrating data ingestion, applicant management, feature engineering pipelines, interaction with PostgreSQL, ML prediction requests to the FastAPI microservice, and Gemini LLM explainability.

---

## 1. Responsibilities

- **Authentication & Authorization**: User registration, login, JWT token issuance, and role-based access control (`APPLICANT`, `ANALYST`, `ADMIN`).
- **Application Orchestration**: Managing loan applicant profiles and underwriting application lifecycle (`DRAFT`, `READY_FOR_ASSESSMENT`, `ASSESSING`, `ASSESSED`).
- **Financial Data Ingestion**: Ingesting manual inputs, synthetic profiles, and CSV/statement data into a canonical 24-month schema.
- **ML Service Gateway**: Sending sanitized 20-feature vectors to the Python FastAPI ML microservice.
- **Explainability Orchestrator**: Invoking the provider-agnostic LLM interface (Gemini) with read-only tools and deterministic fallback to generate structured, grounded explanations.
- **What-If Engine**: Evaluating counterfactual scenarios while preserving baseline assessment immutability.
- **Audit & Persistence**: Storing records, assessments, explanations, and what-if simulation results in PostgreSQL.

---

## 2. Directory Structure

```text
backend/
├── Dockerfile               # Production multi-stage Alpine Node 20 Dockerfile
├── src/
│   ├── config/              # Database pool, environment, and security configurations
│   ├── controllers/         # HTTP request handlers (auth, app, assess, what-if, chat)
│   ├── db/                  # SQL schema migrations (001, 002, 003) and seed scripts
│   ├── integrations/        # External service gateways
│   │   ├── llm/             # Provider-agnostic LLM interface (Gemini & Mock)
│   │   └── ml/              # FastAPI ML Service client adapter
│   ├── middleware/          # Auth, validation, error, and logging middleware
│   ├── repositories/        # Database access and query abstractions
│   ├── routes/              # Express API route declarations
│   ├── services/            # Core business logic and orchestration
│   ├── utils/               # Formatting, constants, and helper functions
│   ├── app.js               # Express application initialization
│   └── server.js            # Server entrypoint with DB retry and graceful shutdown
├── tests/                   # Unit, integration, and API contract tests (Jest)
├── package.json
└── README.md
```

---

## 3. Running Locally

### Development Mode (Host)
```bash
cd backend
npm install
npm run dev
```

### Automated Tests
Run all 64 backend tests across 7 test suites:
```bash
npm test -- --runInBand
```

---

## 4. Containerized Execution (Docker)

The backend is containerized using a secure, multi-stage Alpine Node 20 image running under the unprivileged `node` user:

```bash
# Build backend image
docker build -t finalyse-backend .

# Run container (requires running PostgreSQL and ML service)
docker run -p 4000:4000 \
  -e NODE_ENV=production \
  -e DB_HOST=postgres \
  -e DB_NAME=finalyse_dev \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e ML_SERVICE_URL=http://ml-service:8000 \
  finalyse-backend
```

---

## 5. Health & Readiness Endpoints

- `GET /health` — Lightweight liveness check (HTTP 200 `{"status":"UP","service":"risk-assessment-api",...}`).
- `GET /ready` — Deep dependency readiness probe verifying PostgreSQL pool connectivity (HTTP 200 `{"status":"READY","checks":{"database":"UP"}}` or HTTP 503).
