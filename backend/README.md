# Backend Service — AI-Powered Financial Inclusion Platform

The backend service is built with **Node.js** and **Express**, orchestrating data ingestion, applicant management, feature engineering pipelines, interaction with PostgreSQL, ML prediction requests to the FastAPI microservice, and Gemini LLM explainability.

---

## 1. Responsibilities

- **Authentication & Authorization**: User registration, login, JWT token issuance, and role-based access control.
- **Application Orchestration**: Managing loan applicant profiles and underwriting application lifecycle.
- **Financial Data Ingestion**: Ingesting manual inputs, synthetic profiles, and CSV/statement data into a canonical schema.
- **Feature Engineering Integration**: Transforming raw canonical financial data into validated feature vectors for ML consumption.
- **ML Service Gateway**: Sending sanitized feature vectors to the Python FastAPI ML microservice.
- **Explainability Orchestrator**: Invoking the provider-agnostic LLM interface (Gemini) with read-only tools to generate structured, grounded explanations.
- **Audit & Persistence**: Storing applicant data, canonical records, assessments, explanations, and what-if simulation results in PostgreSQL.

---

## 2. Directory Structure

```text
backend/
├── src/
│   ├── config/              # Database, environment, and security configurations
│   ├── controllers/         # HTTP request handlers
│   ├── integrations/        # External service gateways
│   │   ├── llm/             # Provider-agnostic LLM interface (Gemini & Mock)
│   │   ├── ml/              # FastAPI ML Service client adapter
│   │   └── storage/         # Local filesystem / AWS S3 document handlers
│   ├── middleware/          # Auth, validation, error, and logging middleware
│   ├── repositories/        # Database access and query abstractions
│   ├── routes/              # Express API route declarations
│   ├── services/            # Core business logic and orchestration
│   ├── utils/               # Formatting, constants, and helper functions
│   ├── app.js               # Express application initialization
│   └── server.js            # Server entrypoint and lifecycle handling
├── tests/                   # Unit, integration, and API contract tests
├── package.json
└── README.md
```

---

## 3. Getting Started

### Local Setup
1. Ensure the root `.env` is configured:
   ```bash
   cp ../.env.example ../.env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server with auto-reload:
   ```bash
   npm run dev
   ```
4. Run tests:
   ```bash
   npm test
   ```

---

## 4. API Endpoints

The API implements the public endpoints defined in `financial-risk-assessment-openapi.yaml`:
- `GET /health` — Service health check
- `GET /ready` — Database and dependency readiness check
- `POST /api/v1/auth/register` — User registration
- `POST /api/v1/auth/login` — User authentication
- `POST /api/v1/applications` — Create applicant profile
- `POST /api/v1/applications/:id/financial-data` — Ingest canonical financial records
- `POST /api/v1/applications/:id/assess` — Execute risk assessment pipeline
- `GET /api/v1/applications/:id/explanation` — Retrieve grounded explanation
- `POST /api/v1/applications/:id/what-if` — Run dynamic scenario analysis
