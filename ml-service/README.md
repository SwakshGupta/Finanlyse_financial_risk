# ML Microservice — AI-Powered Financial Inclusion

Internal Python & FastAPI microservice hosting the machine learning risk assessment inference engine and training pipelines.

---

## 1. Responsibilities

- **Model Inference**: Serves the baseline Logistic Regression model predicting default probability and Alternative Risk Scores (300–850).
- **Risk Attribution**: Computes model-derived feature contributions (positive and negative risk drivers).
- **Feature Preprocessing**: Applies standard scaling and missing-value imputation on validated feature vectors.
- **Model Versioning**: Tracks model version (e.g. `logistic_regression_v1.0.0`) and feature-set version (`feature_set_v1`).
- **Internal Security**: Secured with an internal service API key (`X-Internal-API-Key`).

> [!IMPORTANT]
> The ML service is authoritative for all numerical risk calculations. The LLM explainability layer consumes these outputs but never alters scores, probabilities, or bands.

---

## 2. Directory Structure

```text
ml-service/
├── app/
│   ├── api/                 # FastAPI routes (/internal/v1/predict, /internal/v1/health)
│   ├── model/               # Model loading, inference wrapper, risk scoring logic
│   ├── preprocessing/       # Scaler and imputer pipeline
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Inference orchestration
│   ├── utils/               # Metric helpers and logging
│   └── main.py              # Application entrypoint
├── training/
│   ├── generate_data.py     # Reproducible synthetic dataset generator
│   ├── train.py             # Baseline Logistic Regression training pipeline
│   └── evaluate.py          # Validation metrics (AUC, precision, recall)
├── artifacts/               # Serialized model (.joblib) and feature catalog
├── tests/                   # Microservice unit & inference tests
├── requirements.txt
└── README.md
```

---

## 3. Getting Started

### Local Setup
1. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
4. Run tests:
   ```bash
   pytest tests/
   ```
