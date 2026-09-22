"""
Authoritative Feature Catalog (feature_set_v1 and feature_set_v2)
Defines all candidate financial risk features, data types, imputation defaults,
and business interpretation directions.
"""

from typing import Dict, Any, List

FEATURE_SET_VERSION_V1 = "feature_set_v1"
FEATURE_SET_VERSION_V2 = "feature_set_v2"
FEATURE_SET_VERSION = FEATURE_SET_VERSION_V2

# -------------------------------------------------------------------------
# Feature Set V1 (Baseline 15 features)
# -------------------------------------------------------------------------
FEATURE_CATALOG_V1: Dict[str, Dict[str, Any]] = {
    "monthly_income": {
        "type": "float",
        "unit": "INR",
        "description": "Total verified monthly income or inflow",
        "default": 30000.0,
        "direction": "DECREASES_RISK"
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

ORDERED_FEATURE_NAMES_V1: List[str] = list(FEATURE_CATALOG_V1.keys())

# -------------------------------------------------------------------------
# Feature Set V2 (20 features: 15 refined + 5 temporal & behavioral signals)
# -------------------------------------------------------------------------
FEATURE_CATALOG_V2: Dict[str, Dict[str, Any]] = {
    "monthly_income": {
        "type": "float",
        "unit": "INR",
        "description": "Average verified monthly income or inflow over 24-month window",
        "default": 35000.0,
        "direction": "DECREASES_RISK"
    },
    "monthly_expenses": {
        "type": "float",
        "unit": "INR",
        "description": "Average monthly living and non-debt operational expenses",
        "default": 20000.0,
        "direction": "INCREASES_RISK"
    },
    "monthly_emi": {
        "type": "float",
        "unit": "INR",
        "description": "Average monthly debt service and installment commitments",
        "default": 2500.0,
        "direction": "INCREASES_RISK"
    },
    "cash_flow_surplus": {
        "type": "float",
        "unit": "INR",
        "description": "Net uncommitted cash surplus (Income - Expenses - EMI)",
        "default": 12500.0,
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
        "description": "Average daily bank or digital wallet account balance",
        "default": 12000.0,
        "direction": "DECREASES_RISK"
    },
    "minimum_balance_ratio": {
        "type": "float",
        "unit": "ratio",
        "description": "Ratio of lowest observed balance to monthly income (liquidity stress floor)",
        "default": 0.20,
        "direction": "DECREASES_RISK"
    },
    "income_stability": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Normalized stability metric of monthly earnings over 24 months",
        "default": 0.82,
        "direction": "DECREASES_RISK"
    },
    "expense_volatility": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Volatility and variability of monthly expenditures",
        "default": 0.16,
        "direction": "INCREASES_RISK"
    },
    "transaction_regularity": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Consistency score of recurring digital transactions across observation periods",
        "default": 0.85,
        "direction": "DECREASES_RISK"
    },
    "negative_cashflow_months": {
        "type": "int",
        "unit": "count [0-24]",
        "description": "Number of observed months where living expenses and debt exceeded total inflows",
        "default": 0,
        "direction": "INCREASES_RISK"
    },
    "income_trend_3m": {
        "type": "float",
        "unit": "ratio",
        "description": "Trailing income trajectory percentage comparing recent vs earliest observation periods",
        "default": 0.02,
        "direction": "DECREASES_RISK"
    },
    "utility_payment_consistency": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Proportion of recurring utility and telecom invoices settled on or before due date",
        "default": 0.88,
        "direction": "DECREASES_RISK"
    },
    "digital_transaction_ratio": {
        "type": "float",
        "unit": "score [0, 1]",
        "description": "Proportion of transactions conducted via traceable digital payment rails (UPI, cards, netbanking)",
        "default": 0.82,
        "direction": "DECREASES_RISK"
    },
    "savings_rate": {
        "type": "float",
        "unit": "ratio",
        "description": "Proportion of monthly income retained as uncommitted savings",
        "default": 0.28,
        "direction": "DECREASES_RISK"
    },
    "failed_payment_count": {
        "type": "int",
        "unit": "count",
        "description": "Count of bounced checks, ECS rejections, NACH failures, or failed debits",
        "default": 0,
        "direction": "INCREASES_RISK"
    },
    "non_debt_recurring_obligations": {
        "type": "float",
        "unit": "INR",
        "description": "Essential non-debt recurring commitments such as utilities, rent, and telecom (excluding debt EMI)",
        "default": 4500.0,
        "direction": "INCREASES_RISK"
    },
    "existing_debt_amount": {
        "type": "float",
        "unit": "INR",
        "description": "Estimated total outstanding principal debt obligations",
        "default": 20000.0,
        "direction": "INCREASES_RISK"
    },
    "credit_history_available": {
        "type": "int",
        "unit": "binary [0, 1]",
        "description": "Whether any formal bureau record exists (0 for unbanked/thin-file)",
        "default": 0,
        "direction": "NEUTRAL"
    },
    "credit_history_length": {
        "type": "int",
        "unit": "months",
        "description": "Duration of formal credit relationship in months (0 for unbanked)",
        "default": 0,
        "direction": "DECREASES_RISK"
    }
}

ORDERED_FEATURE_NAMES_V2: List[str] = list(FEATURE_CATALOG_V2.keys())

# Set default active catalog to V2
FEATURE_CATALOG = FEATURE_CATALOG_V2
ORDERED_FEATURE_NAMES = ORDERED_FEATURE_NAMES_V2

def extract_feature_vector(raw_features: Dict[str, Any], version: str = FEATURE_SET_VERSION_V2) -> List[float]:
    """
    Extracts, maps, and imputes a feature vector in strict catalog order.
    Supports camelCase and snake_case keys, alias mapping, and feature set versioning.
    """
    normalized_input = {}
    for k, v in raw_features.items():
        snake_k = ''.join(['_' + c.lower() if c.isupper() else c for c in k]).lstrip('_')
        normalized_input[snake_k] = v

    # Common aliases
    if "monthly_emi" not in normalized_input and "existing_emi" in normalized_input:
        normalized_input["monthly_emi"] = normalized_input["existing_emi"]
    if "bureau_history_available" in normalized_input and "credit_history_available" not in normalized_input:
        normalized_input["credit_history_available"] = 1 if normalized_input["bureau_history_available"] else 0
    if "credit_history_length_months" in normalized_input and "credit_history_length" not in normalized_input:
        normalized_input["credit_history_length"] = normalized_input["credit_history_length_months"]

    # V2-specific alias mappings
    if "non_debt_recurring_obligations" not in normalized_input:
        if "recurring_obligation_amount" in normalized_input:
            # If recurring obligation was supplied in legacy format, map it
            normalized_input["non_debt_recurring_obligations"] = normalized_input["recurring_obligation_amount"]
        elif "monthly_recurring_obligations" in normalized_input:
            normalized_input["non_debt_recurring_obligations"] = normalized_input["monthly_recurring_obligations"]

    if "minimum_balance_ratio" not in normalized_input:
        if "min_balance_ratio" in normalized_input:
            normalized_input["minimum_balance_ratio"] = normalized_input["min_balance_ratio"]
        elif "minimum_balance" in normalized_input and "monthly_income" in normalized_input:
            inc = float(normalized_input["monthly_income"])
            normalized_input["minimum_balance_ratio"] = float(normalized_input["minimum_balance"]) / inc if inc > 0 else 0.0

    if "negative_cashflow_months" not in normalized_input:
        if "negative_cash_flow_months" in normalized_input:
            normalized_input["negative_cashflow_months"] = normalized_input["negative_cash_flow_months"]

    if "income_trend_3m" not in normalized_input:
        if "income_trend" in normalized_input:
            normalized_input["income_trend_3m"] = normalized_input["income_trend"]

    if "utility_payment_consistency" not in normalized_input:
        if "utility_consistency" in normalized_input:
            normalized_input["utility_payment_consistency"] = normalized_input["utility_consistency"]

    if "digital_transaction_ratio" not in normalized_input:
        if "digital_tx_ratio" in normalized_input:
            normalized_input["digital_transaction_ratio"] = normalized_input["digital_tx_ratio"]

    # Select catalog by requested version
    if version == FEATURE_SET_VERSION_V1:
        catalog = FEATURE_CATALOG_V1
        ordered_names = ORDERED_FEATURE_NAMES_V1
    else:
        catalog = FEATURE_CATALOG_V2
        ordered_names = ORDERED_FEATURE_NAMES_V2

    income = float(normalized_input.get("monthly_income", catalog["monthly_income"]["default"]))
    expenses = float(normalized_input.get("monthly_expenses", catalog["monthly_expenses"]["default"]))
    emi = float(normalized_input.get("monthly_emi", catalog["monthly_emi"]["default"]))

    if "cash_flow_surplus" not in normalized_input:
        normalized_input["cash_flow_surplus"] = income - expenses - emi

    if "debt_to_income" not in normalized_input:
        normalized_input["debt_to_income"] = (emi / income) if income > 0 else 0.0

    if "savings_rate" not in normalized_input:
        surplus = normalized_input["cash_flow_surplus"]
        normalized_input["savings_rate"] = (max(0.0, surplus) / income) if income > 0 else 0.0

    if "minimum_balance_ratio" not in normalized_input and "minimum_balance_ratio" in catalog:
        avg_bal = float(normalized_input.get("average_balance", catalog["average_balance"]["default"]))
        # Conservative heuristic fallback: minimum balance typically ~40% of average balance
        normalized_input["minimum_balance_ratio"] = round((avg_bal * 0.40) / income, 4) if income > 0 else 0.10

    if "negative_cashflow_months" not in normalized_input and "negative_cashflow_months" in catalog:
        # Heuristic fallback if monthly timeline was not provided: 1 if surplus negative, else 0
        normalized_input["negative_cashflow_months"] = 2 if normalized_input["cash_flow_surplus"] < 0 else 0

    vector = []
    for fname in ordered_names:
        meta = catalog[fname]
        val = normalized_input.get(fname, meta["default"])
        try:
            if meta["type"] == "int":
                vector.append(int(round(float(val))))
            else:
                vector.append(float(val))
        except (ValueError, TypeError):
            vector.append(meta["default"])

    return vector
