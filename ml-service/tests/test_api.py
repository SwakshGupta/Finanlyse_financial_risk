"""
Unit and Integration Tests for Internal ML API Endpoints
Validates authentication, inference, error handling, readiness, and metadata endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

VALID_API_KEY = "dev_internal_ml_service_key_secret"

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_health_checks(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "UP"

    internal_res = client.get("/internal/v1/health")
    assert internal_res.status_code == 200
    assert internal_res.json()["status"] == "UP"

def test_readiness_probe(client):
    res = client.get("/internal/v1/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "READY"
    assert data["checks"]["model_loaded"] == "OK"

def test_model_metadata_endpoint_unauthorized(client):
    res = client.get("/internal/v1/model")
    assert res.status_code == 401

def test_model_metadata_endpoint_authorized(client):
    res = client.get(
        "/internal/v1/model",
        headers={"X-Internal-API-Key": VALID_API_KEY}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Logistic Regression Alternative Risk Baseline"
    assert data["version"] == "logistic_regression_v1.0.0"
    assert data["featureSetVersion"] == "feature_set_v1"
    assert data["algorithm"] == "LOGISTIC_REGRESSION"

def test_prediction_endpoint_unauthorized(client):
    payload = {
        "applicationId": "app-test-001",
        "features": {
            "monthlyIncome": 50000.0,
            "monthlyExpenses": 25000.0
        }
    }
    # No header
    res1 = client.post("/internal/v1/predict", json=payload)
    assert res1.status_code == 401

    # Wrong header
    res2 = client.post(
        "/internal/v1/predict",
        headers={"X-Internal-API-Key": "wrong-key"},
        json=payload
    )
    assert res2.status_code == 401

def test_prediction_endpoint_success(client):
    payload = {
        "applicationId": "app-test-002",
        "features": {
            "monthlyIncome": 60000.0,
            "monthlyExpenses": 25000.0,
            "monthlyEmi": 5000.0,
            "averageBalance": 35000.0,
            "incomeStability": 0.92,
            "expenseVolatility": 0.10,
            "transactionRegularity": 0.95,
            "failedPaymentCount": 0
        }
    }

    res = client.post(
        "/internal/v1/predict",
        headers={"X-Internal-API-Key": VALID_API_KEY},
        json=payload
    )
    assert res.status_code == 200
    data = res.json()

    assert data["applicationId"] == "app-test-002"
    assert "defaultProbability" in data
    assert 0.0 <= data["defaultProbability"] <= 1.0
    assert 0 <= data["riskScore"] <= 100
    assert data["riskBand"] in ["LOW", "MODERATE", "HIGH"]
    assert "factors" in data
    assert isinstance(data["factors"]["positive"], list)
    assert isinstance(data["factors"]["negative"], list)
    assert "generatedAt" in data

def test_prediction_endpoint_invalid_payload(client):
    # Missing required 'applicationId' or 'features'
    res = client.post(
        "/internal/v1/predict",
        headers={"X-Internal-API-Key": VALID_API_KEY},
        json={"invalid": "payload"}
    )
    assert res.status_code == 422
