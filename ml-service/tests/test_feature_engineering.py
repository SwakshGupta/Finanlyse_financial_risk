"""
Feature Engineering Unit Tests
Tests catalog integrity, vector extraction, imputation, derived calculations,
and backward compatibility for feature_set_v1 and feature_set_v2.
"""

from app.features.catalog import (
    FEATURE_CATALOG,
    FEATURE_CATALOG_V1,
    FEATURE_CATALOG_V2,
    ORDERED_FEATURE_NAMES,
    ORDERED_FEATURE_NAMES_V1,
    ORDERED_FEATURE_NAMES_V2,
    FEATURE_SET_VERSION,
    FEATURE_SET_VERSION_V1,
    FEATURE_SET_VERSION_V2,
    extract_feature_vector
)

def test_feature_catalog_integrity():
    # V2 is the active default
    assert FEATURE_SET_VERSION == FEATURE_SET_VERSION_V2
    assert len(ORDERED_FEATURE_NAMES) == 20
    assert len(ORDERED_FEATURE_NAMES_V2) == 20
    assert len(ORDERED_FEATURE_NAMES_V1) == 15

    for fname in ORDERED_FEATURE_NAMES_V2:
        assert fname in FEATURE_CATALOG_V2
        meta = FEATURE_CATALOG_V2[fname]
        assert "type" in meta
        assert "unit" in meta
        assert "default" in meta
        assert "direction" in meta

    # Verify 5 new V2 features exist
    assert "minimum_balance_ratio" in FEATURE_CATALOG_V2
    assert "negative_cashflow_months" in FEATURE_CATALOG_V2
    assert "income_trend_3m" in FEATURE_CATALOG_V2
    assert "utility_payment_consistency" in FEATURE_CATALOG_V2
    assert "digital_transaction_ratio" in FEATURE_CATALOG_V2
    assert "non_debt_recurring_obligations" in FEATURE_CATALOG_V2

def test_extract_feature_vector_v2_full_payload():
    input_data = {
        "monthly_income": 50000.0,
        "monthly_expenses": 30000.0,
        "monthly_emi": 5000.0,
        "average_balance": 15000.0,
        "minimum_balance_ratio": 0.22,
        "income_stability": 0.90,
        "expense_volatility": 0.10,
        "transaction_regularity": 0.92,
        "negative_cashflow_months": 1,
        "income_trend_3m": 0.04,
        "utility_payment_consistency": 0.95,
        "digital_transaction_ratio": 0.88,
        "savings_rate": 0.30,
        "failed_payment_count": 0,
        "non_debt_recurring_obligations": 4000.0,
        "existing_debt_amount": 20000.0,
        "credit_history_available": 1,
        "credit_history_length": 18
    }

    vec = extract_feature_vector(input_data, version=FEATURE_SET_VERSION_V2)
    assert len(vec) == 20
    assert vec[0] == 50000.0  # monthly_income
    assert vec[1] == 30000.0  # monthly_expenses
    assert vec[2] == 5000.0   # monthly_emi
    assert vec[3] == 15000.0  # cash_flow_surplus: 50000 - 30000 - 5000 = 15000
    assert vec[4] == 0.10     # debt_to_income: 5000 / 50000 = 0.10
    assert vec[6] == 0.22     # minimum_balance_ratio
    assert vec[10] == 1       # negative_cashflow_months
    assert vec[11] == 0.04    # income_trend_3m

def test_extract_feature_vector_v1_backward_compatibility():
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

    vec = extract_feature_vector(input_data, version=FEATURE_SET_VERSION_V1)
    assert len(vec) == 15
    assert vec[0] == 50000.0
    assert vec[1] == 30000.0
    assert vec[2] == 5000.0
    assert vec[3] == 15000.0

def test_extract_feature_vector_with_camel_case_keys():
    input_data = {
        "monthlyIncome": 60000.0,
        "monthlyExpenses": 35000.0,
        "monthlyEmi": 6000.0,
        "averageBalance": 22000.0,
        "minimumBalanceRatio": 0.25,
        "negativeCashflowMonths": 0,
        "incomeTrend3m": 0.08,
        "utilityPaymentConsistency": 0.92,
        "digitalTransactionRatio": 0.85,
        "bureauHistoryAvailable": True,
        "creditHistoryLengthMonths": 24
    }

    vec = extract_feature_vector(input_data)
    assert len(vec) == 20
    assert vec[0] == 60000.0
    assert vec[1] == 35000.0
    assert vec[2] == 6000.0
    assert vec[3] == 19000.0  # 60000 - 35000 - 6000 = 19000
    assert vec[4] == 0.10     # 6000 / 60000 = 0.10
    assert vec[6] == 0.25     # minimumBalanceRatio
    assert vec[10] == 0       # negativeCashflowMonths

def test_extract_feature_vector_missing_values_imputation():
    # Minimal input with only partial keys provided
    input_data = {
        "monthlyIncome": 40000.0
    }

    vec = extract_feature_vector(input_data)
    assert len(vec) == 20
    assert vec[0] == 40000.0
    assert vec[1] == FEATURE_CATALOG["monthly_expenses"]["default"]
    assert vec[2] == FEATURE_CATALOG["monthly_emi"]["default"]
    # Imputed derived features should not be None
    assert isinstance(vec[6], float)  # minimum_balance_ratio
    assert isinstance(vec[10], int)   # negative_cashflow_months
