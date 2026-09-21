"""
Authoritative Feature Catalog (feature_set_v1)
Defines all candidate financial risk features, data types, imputation defaults,
and business interpretation directions.
"""

from typing import Dict, Any, List

FEATURE_SET_VERSION = "feature_set_v1"

FEATURE_CATALOG: Dict[str, Dict[str, Any]] = {
    "monthly_income": {
        "type": "float",
        "unit": "INR",
        "description": "Total verified monthly income or inflow",
        "default": 30000.0,
        "direction": "DECREASES_RISK"  # Higher income generally lowers default risk
    },
    "monthly_expenses": {
        "type": "float",
        "unit": "INR",
        "description": "Total monthly non-debt living expenses",
        "default": 18000.0,
        "direction": "INCREASES_RISK"
    },
    "monthly_emi": {
        "type": "float",
        "unit": "INR",
        "description": "Monthly debt repayment and installment obligations",
        "default": 2000.0,
        "direction": "INCREASES_RISK"
    },
    "cash_flow_surplus": {
        "type": "float",
        "unit": "INR",
        "description": "Net discretionary income after expenses and EMI",
        "default": 10000.0,
        "direction": "DECREASES_RISK"
    },
    "debt_to_income": {
        "type": "float",
        "unit": "ratio",
        "description": "Ratio of monthly debt obligations to monthly income",
        "default": 0.08,
        "direction": "INCREASES_RISK"
    },
    "average_balance": {
        "type": "float",
        "unit": "INR",
        "description": "Average daily bank or wallet account balance",
        "default": 8500.0,
        "direction": "DECREASES_RISK"
    },
    "income_stability": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Normalized stability metric of monthly earnings",
        "default": 0.80,
        "direction": "DECREASES_RISK"
    },
    "expense_volatility": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Volatility/variability metric of monthly outflow",
        "default": 0.15,
        "direction": "INCREASES_RISK"
    },
    "transaction_regularity": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Consistency score of recurring digital transactions",
        "default": 0.82,
        "direction": "DECREASES_RISK"
    },
    "savings_rate": {
        "type": "float",
        "unit": "ratio",
        "description": "Proportion of income retained as savings or surplus",
        "default": 0.25,
        "direction": "DECREASES_RISK"
    },
    "failed_payment_count": {
        "type": "int",
        "unit": "count",
        "description": "Count of bounced checks, ECS rejections, or failed debits",
        "default": 0,
        "direction": "INCREASES_RISK"
    },
    "recurring_obligation_amount": {
        "type": "float",
        "unit": "INR",
        "description": "Recurring utility, rent, and subscription commitments",
        "default": 4000.0,
        "direction": "INCREASES_RISK"
    },
    "existing_debt_amount": {
        "type": "float",
        "unit": "INR",
        "description": "Estimated total outstanding debt obligations",
        "default": 15000.0,
        "direction": "INCREASES_RISK"
    },
    "credit_history_available": {
        "type": "int",
        "unit": "binary [0, 1]",
        "description": "Whether any formal bureau record exists",
        "default": 0,
        "direction": "NEUTRAL"
    },
    "credit_history_length": {
        "type": "int",
        "unit": "months",
        "description": "Duration of formal credit relationship in months",
        "default": 0,
        "direction": "DECREASES_RISK"
    }
}

ORDERED_FEATURE_NAMES: List[str] = list(FEATURE_CATALOG.keys())

def extract_feature_vector(raw_features: Dict[str, Any]) -> List[float]:
    """
    Extracts, maps, and imputes a feature vector in strict catalog order.
    Supports camelCase and snake_case keys.
    """
    # Key normalization dictionary
    normalized_input = {}
    for k, v in raw_features.items():
        # Convert camelCase to snake_case if applicable
        snake_k = ''.join(['_' + c.lower() if c.isupper() else c for c in k]).lstrip('_')
        normalized_input[snake_k] = v

    # Specific common aliases
    if "monthly_emi" not in normalized_input and "existing_emi" in normalized_input:
        normalized_input["monthly_emi"] = normalized_input["existing_emi"]
    if "bureau_history_available" in normalized_input and "credit_history_available" not in normalized_input:
        normalized_input["credit_history_available"] = 1 if normalized_input["bureau_history_available"] else 0
    if "credit_history_length_months" in normalized_input and "credit_history_length" not in normalized_input:
        normalized_input["credit_history_length"] = normalized_input["credit_history_length_months"]

    # Calculate derived features if missing
    income = float(normalized_input.get("monthly_income", FEATURE_CATALOG["monthly_income"]["default"]))
    expenses = float(normalized_input.get("monthly_expenses", FEATURE_CATALOG["monthly_expenses"]["default"]))
    emi = float(normalized_input.get("monthly_emi", FEATURE_CATALOG["monthly_emi"]["default"]))

    if "cash_flow_surplus" not in normalized_input:
        normalized_input["cash_flow_surplus"] = income - expenses - emi

    if "debt_to_income" not in normalized_input:
        normalized_input["debt_to_income"] = (emi / income) if income > 0 else 0.0

    if "savings_rate" not in normalized_input:
        normalized_input["savings_rate"] = ((income - expenses) / income) if income > 0 else 0.0

    vector = []
    for fname in ORDERED_FEATURE_NAMES:
        meta = FEATURE_CATALOG[fname]
        val = normalized_input.get(fname, meta["default"])
        try:
            if meta["type"] == "int":
                vector.append(int(val))
            else:
                vector.append(float(val))
        except (ValueError, TypeError):
            vector.append(meta["default"])

    return vector
