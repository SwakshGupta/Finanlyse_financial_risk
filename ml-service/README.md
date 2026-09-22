# ML Microservice — AI-Powered Financial Inclusion

Internal Python & FastAPI microservice hosting the machine learning risk assessment inference engine and training pipelines.

---

## 1. Responsibilities

- **Model Inference**: Serves the calibrated Logistic Regression Model V2 (`logistic_regression_v2.0.0`) predicting default probability and Alternative Risk Scores.
- **20-Feature Temporal Pipeline**: Ingests 24-month longitudinal features including liquidity floor (`minimum_balance_ratio`), deficit frequency (`negative_cashflow_months`), 3-month momentum (`income_trend_3m`), utility consistency, and digital transaction ratio.
- **Risk Attribution**: Computes linear log-odds feature contributions (positive and negative risk drivers).
- **Feature Preprocessing**: Applies standard scaling (`scaler_v2.0.0.joblib`) and missing-value imputation on validated feature vectors.
- **Internal Security**: Secured with an internal service API key (`X-Internal-API-Key`).

> [!IMPORTANT]
> The ML service is authoritative for all numerical risk calculations. The LLM explainability layer consumes these outputs but never alters scores, probabilities, or bands.

---

## 2. Directory Structure

```text
ml-service/
├── Dockerfile               # Production Python 3.11-slim Dockerfile (non-root appuser)
├── app/
│   ├── api/                 # FastAPI routes (/internal/v1/predict, /internal/v1/health, /internal/v1/ready)
│   ├── features/            # Feature Catalog V2 (20 features) and temporal derivation
│   ├── model/               # Model loading, inference wrapper, risk scoring logic
│   ├── preprocessing/       # Scaler and imputer pipeline
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Inference orchestration
│   ├── utils/               # Metric helpers and logging
│   └── main.py              # Application entrypoint with root /health and /ready probes
├── training/
│   ├── generate_data.py     # 3,000 longitudinal synthetic profile generator
│   ├── train.py             # Model V2 Logistic Regression training pipeline
│   └── evaluate.py          # Validation metrics (AUC, precision, recall)
├── artifacts/               # Serialized model (.joblib), scaler (.joblib), and feature catalog JSON
├── tests/                   # Microservice unit & inference tests (Pytest)
├── requirements.txt
└── README.md
```

---

## 3. Running Locally

### Development Mode (Host)
```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --port 8000
```

### Automated Tests
Run all 18 Pytest tests:
```bash
PYTHONPATH=. pytest tests/ -v
```

---

## 4. Containerized Execution (Docker)

The ML microservice is containerized using Python 3.11-slim running as unprivileged user `appuser` (UID 1001) with preloaded model artifacts:

```bash
# Build ML image
docker build -t finalyse-ml-service .

# Run container
docker run -p 8000:8000 finalyse-ml-service
```

---

## 5. Health & Readiness Endpoints

- `GET /health` / `GET /internal/v1/health` — Returns HTTP 200 `{"status":"UP","service":"risk-assessment-ml-service",...}`.
- `GET /ready` / `GET /internal/v1/ready` — Verifies model and scaler artifacts are loaded in memory (HTTP 200 `{"status":"READY","model_version":"logistic_regression_v2.0.0",...}` or HTTP 503).
