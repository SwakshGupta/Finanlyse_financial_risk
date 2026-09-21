"""
Feature Engineering Unit Tests
Tests catalog integrity, vector extraction, imputation, and derived calculations.
"""

from app.features.catalog import (
    FEATURE_CATALOG,
    ORDERED_FEATURE_NAMES,
    FEATURE_SET_VERSION,
    extract_feature_vector
)

def test_feature_catalog_integrity():
    assert FEATURE_SET_VERSION == "feature_set_v1"
    assert len(ORDERED_FEATURE_NAMES) == 15
    for fname in ORDERED_FEATURE_NAMES:
        assert fname in FEATURE_CATALOG
        meta = FEATURE_CATALOG[fname]
        assert "type" in meta
        assert "unit" in meta
        assert "default" in meta
        assert "direction" in meta

def test_extract_feature_vector_with_full_payload():
    input_data = {
        "monthly_income": 50000.0,
        "monthly_expenses": 30000.0,
        "monthly_emi": 5000.0,
        "average_balance": 15000.0,
        "income_stability": 0.90,
        "expense_volatility": 0.10,
        "transaction_regularity": 0.92,
        "savings_rate": 0.30,
        "failed_payment_count": 0,
        "recurring_obligation_amount": 4000.0,
        "existing_debt_amount": 20000.0,
        "credit_history_available": 1,
        "credit_history_length": 18
    }

    vec = extract_feature_vector(input_data)
    assert len(vec) == 15
    assert vec[0] == 50000.0  # monthly_income
    assert vec[1] == 30000.0  # monthly_expenses
    assert vec[2] == 5000.0   # monthly_emi
    assert vec[3] == 15000.0  # cash_flow_surplus: 50000 - 30000 - 5000 = 15000
    assert vec[4] == 0.10     # debt_to_income: 5000 / 50000 = 0.10

def test_extract_feature_vector_with_camel_case_keys():
    input_data = {
        "monthlyIncome": 60000.0,
        "monthlyExpenses": 35000.0,
        "monthlyEmi": 6000.0,
        "averageBalance": 22000.0,
        "bureauHistoryAvailable": True,
        "creditHistoryLengthMonths": 24
    }

    vec = extract_feature_vector(input_data)
    assert len(vec) == 15
    assert vec[0] == 60000.0
    assert vec[1] == 35000.0
    assert vec[2] == 6000.0
    assert vec[3] == 19000.0  # 60000 - 35000 - 6000 = 19000
    assert vec[4] == 0.10     # 6000 / 60000 = 0.10

def test_extract_feature_vector_missing_values_imputation():
    # Minimal input with only partial keys provided
    input_data = {
        "monthlyIncome": 40000.0
    }

    vec = extract_feature_vector(input_data)
    assert len(vec) == 15
    # Should use defaults for missing values without throwing an exception
    assert vec[0] == 40000.0
    assert vec[1] == FEATURE_CATALOG["monthly_expenses"]["default"]
    assert vec[2] == FEATURE_CATALOG["monthly_emi"]["default"]
