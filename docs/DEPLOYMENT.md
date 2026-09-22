# Finalyse Local Service Operation & Deployment Guide

This guide documents how to run, verify, and operate the multi-service Finalyse platform locally without containerization.

---

## 1. System Architecture & Port Allocation

| Component | Technology | Directory | Default Port | Health Endpoint |
|---|---|---|---|---|
| **Database** | PostgreSQL 15/16 | System / Local | `5432` | `pg_isready` |
| **ML Microservice** | Python 3.11 + FastAPI + scikit-learn | `ml-service/` | `8000` | `http://localhost:8000/health` |
| **Backend API** | Node.js 20 + Express | `backend/` | `4000` | `http://localhost:4000/health` |
| **Frontend UI** | React 18 + Vite | `frontend/` | `3000` | `http://localhost:3000/` |

---

## 2. Prerequisites & Environment Setup

### A. Environment Files
Ensure each service has its corresponding `.env` configuration:

1. **Backend (`backend/.env`)**:
   ```env
   PORT=4000
   NODE_ENV=development
   DB_USER=swakshgupta
   DB_PASSWORD=
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=finalyse_dev
   JWT_SECRET=your_super_secret_jwt_key
   ML_SERVICE_URL=http://localhost:8000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **ML Service (`ml-service/.env`)**:
   ```env
   PORT=8000
   ENVIRONMENT=development
   ACTIVE_MODEL_VERSION=logistic_regression_v2.0.0
   FEATURE_SET_VERSION=feature_set_v2
   ```

---

## 3. Step-by-Step Local Startup

Always start services in the following order to satisfy dependency health checks:

### Step 1: Verify PostgreSQL Database
Ensure PostgreSQL is active and the database `finalyse_dev` exists:
```bash
psql -d finalyse_dev -c "SELECT current_database(), current_user;"
```
If tables are not yet initialized:
```bash
node backend/scripts/runMigrations.js
```

### Step 2: Start the Python ML Service (Model V2)
In a dedicated terminal:
```bash
cd ml-service
# Activate virtual environment
source .venv/bin/activate
# Start FastAPI server on port 8000
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Verify health:
```bash
curl http://localhost:8000/health
# Response: {"status":"healthy","model_version":"logistic_regression_v2.0.0",...}
```

### Step 3: Start the Express Backend API
In a second terminal:
```bash
cd backend
# Start Express API server on port 4000
node src/server.js
```
Verify health:
```bash
curl http://localhost:4000/health
# Response: {"status":"ok","timestamp":"...","database":"connected","mlService":"connected"}
```

### Step 4: Start the React Frontend Dev Server
In a third terminal:
```bash
cd frontend
# Launch Vite dev server on port 3000
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 4. Running Verification Test Suites

### Backend Unit & Integration Tests (Jest)
Run all backend tests with sequential database safety:
```bash
npm --prefix backend test -- --runInBand
```
Tests covered:
* `auth.test.js`: Registration, login, and JWT issuance
* `application.test.js`: Intake workflow and canonical transformation
* `assessment.test.js`: End-to-end ML scoring (Model V2 + V1 fallback)
* `explanation.test.js`: LLM underwriting synthesis
* `whatIf.test.js`: Counterfactual scenario simulation
* `chat.test.js`: Role-aware conversational advisor
* `health.test.js`: System readiness probe

### ML Microservice Tests (Pytest)
Run all feature engineering, catalog, pipeline, and API endpoint tests:
```bash
source ml-service/.venv/bin/activate
pytest ml-service/tests -v
```
Tests covered:
* `test_api.py`: Health, Model V2 predictions, V1 backward compatibility, validation errors
* `test_feature_engineering.py`: Temporal feature derivation, catalog schema, aliases

### Frontend Build Verification
Verify that the React bundle compiles without errors:
```bash
npm --prefix frontend run build
```

---

## 5. Troubleshooting & Diagnostics

* **Port Conflict (`EADDRINUSE: 4000` or `8000`)**:
  Check for existing processes:
  ```bash
  lsof -i :4000
  lsof -i :8000
  kill -9 <PID>
  ```
* **ML Service Model Not Found**:
  Verify serialized artifacts are present in `ml-service/artifacts/`:
  - `logistic_regression_v2.0.0.joblib`
  - `scaler_v2.0.0.joblib`
  - `feature_catalog_v2.json`
* **Gemini API Rate Limit / Offline**:
  The system automatically falls back to deterministic rule-based explainability templates without throwing unhandled exceptions.
