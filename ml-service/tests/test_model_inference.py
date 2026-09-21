"""
Model Inference & Risk Attribution Unit Tests
Tests artifact loading, probability bounds, risk scoring, and factor contributions.
"""

import pytest
from app.model.risk_model import RiskModel, MODEL_VERSION, FEATURE_SET_VERSION

@pytest.fixture
def loaded_model():
    return RiskModel.load(artifacts_dir="ml-service/artifacts")

def test_model_artifact_loading(loaded_model):
    assert loaded_model.model is not None
    assert loaded_model.scaler is not None
    assert loaded_model.model_version == MODEL_VERSION
    assert loaded_model.feature_set_version == FEATURE_SET_VERSION

def test_inference_probability_and_score_bounds(loaded_model):
    sample_features = {
        "monthlyIncome": 45000.0,
        "monthlyExpenses": 25000.0,
        "monthlyEmi": 3000.0,
        "averageBalance": 18000.0,
        "incomeStability": 0.88,
        "expenseVolatility": 0.12,
        "transactionRegularity": 0.90,
        "failedPaymentCount": 0
    }

    result = loaded_model.predict(sample_features, application_id="app_test_123")

    assert result["applicationId"] == "app_test_123"
    assert "defaultProbability" in result
    assert "riskScore" in result
    assert "riskBand" in result
    assert "factors" in result

    # Verify probability bounds
    prob = result["defaultProbability"]
    assert 0.0 <= prob <= 1.0

    # Verify score bounds [0, 100]
    score = result["riskScore"]
    assert 0 <= score <= 100
    assert result["riskBand"] in ["LOW", "MODERATE", "HIGH"]

def test_feature_attributions_structure(loaded_model):
    sample_features = {
        "monthlyIncome": 35000.0,
        "monthlyExpenses": 28000.0,
        "monthlyEmi": 6000.0,
        "averageBalance": 4000.0,
        "failedPaymentCount": 1
    }

    result = loaded_model.predict(sample_features)
    factors = result["factors"]

    assert "positive" in factors
    assert "negative" in factors
    assert len(factors["positive"]) > 0 or len(factors["negative"]) > 0

    for factor in factors["positive"]:
        assert factor["direction"] == "POSITIVE"
        assert factor["contribution"] >= 0.0
        assert "feature" in factor
        assert "value" in factor

    for factor in factors["negative"]:
        assert factor["direction"] == "NEGATIVE"
        assert factor["contribution"] >= 0.0

def test_risk_sensitivity_to_increased_emi(loaded_model):
    """
    Validates model monotonicity: When EMI increases substantially,
    default probability must increase and risk score must decrease.
    """
    baseline_features = {
        "monthlyIncome": 50000.0,
        "monthlyExpenses": 25000.0,
        "monthlyEmi": 3000.0,
        "averageBalance": 20000.0,
        "failedPaymentCount": 0
    }

    stressed_features = {
        "monthlyIncome": 50000.0,
        "monthlyExpenses": 25000.0,
        "monthlyEmi": 18000.0,  # Elevated debt burden
        "averageBalance": 20000.0,
        "failedPaymentCount": 0
    }

    baseline_res = loaded_model.predict(baseline_features)
    stressed_res = loaded_model.predict(stressed_features)

    assert stressed_res["defaultProbability"] > baseline_res["defaultProbability"]
    assert stressed_res["riskScore"] < baseline_res["riskScore"]
