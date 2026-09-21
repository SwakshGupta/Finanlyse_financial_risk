"""
Synthetic Financial Dataset Generator
Generates reproducible, financially grounded alternative credit datasets
for training the baseline Logistic Regression risk model.
"""

import os
import random
import numpy as np
import pandas as pd
from app.features.catalog import ORDERED_FEATURE_NAMES

RANDOM_SEED = 42
TOTAL_SAMPLES = 2500

def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))

def generate_synthetic_dataset(n_samples: int = TOTAL_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    records = []

    for i in range(n_samples):
        segment_roll = np.random.rand()

        if segment_roll < 0.35:
            # Segment 1: Thin-file Gig Economy Worker
            income = float(np.random.normal(38000, 8000))
            income = max(18000.0, income)
            expense_ratio = np.random.uniform(0.55, 0.75)
            expenses = income * expense_ratio
            emi = float(np.random.choice([0, 1500, 3000, 4500], p=[0.3, 0.4, 0.2, 0.1]))
            avg_balance = float(np.random.normal(12000, 4000))
            avg_balance = max(2000.0, avg_balance)
            income_stability = float(np.random.uniform(0.70, 0.90))
            expense_volatility = float(np.random.uniform(0.10, 0.25))
            regularity = float(np.random.uniform(0.75, 0.92))
            failed_payments = int(np.random.choice([0, 1], p=[0.92, 0.08]))
            recurring_obligations = float(np.random.uniform(3000, 6000))
            existing_debt = emi * 12
            credit_hist_avail = 0
            credit_hist_len = 0

        elif segment_roll < 0.65:
            # Segment 2: New-to-Credit Salaried Professional
            income = float(np.random.normal(62000, 15000))
            income = max(30000.0, income)
            expense_ratio = np.random.uniform(0.40, 0.60)
            expenses = income * expense_ratio
            emi = float(np.random.choice([0, 2500, 5000], p=[0.5, 0.3, 0.2]))
            avg_balance = float(np.random.normal(30000, 10000))
            avg_balance = max(5000.0, avg_balance)
            income_stability = float(np.random.uniform(0.90, 0.98))
            expense_volatility = float(np.random.uniform(0.05, 0.15))
            regularity = float(np.random.uniform(0.88, 0.98))
            failed_payments = int(np.random.choice([0, 1], p=[0.97, 0.03]))
            recurring_obligations = float(np.random.uniform(5000, 10000))
            existing_debt = emi * 15
            credit_hist_avail = int(np.random.choice([0, 1], p=[0.8, 0.2]))
            credit_hist_len = int(np.random.uniform(1, 12)) if credit_hist_avail else 0

        elif segment_roll < 0.85:
            # Segment 3: Micro-Entrepreneur / Merchant
            income = float(np.random.normal(85000, 25000))
            income = max(35000.0, income)
            expense_ratio = np.random.uniform(0.50, 0.70)
            expenses = income * expense_ratio
            emi = float(np.random.choice([3000, 6000, 10000, 15000], p=[0.3, 0.3, 0.25, 0.15]))
            avg_balance = float(np.random.normal(25000, 8000))
            avg_balance = max(4000.0, avg_balance)
            income_stability = float(np.random.uniform(0.65, 0.85))
            expense_volatility = float(np.random.uniform(0.15, 0.30))
            regularity = float(np.random.uniform(0.80, 0.95))
            failed_payments = int(np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03]))
            recurring_obligations = float(np.random.uniform(6000, 15000))
            existing_debt = emi * 18
            credit_hist_avail = int(np.random.choice([0, 1], p=[0.6, 0.4]))
            credit_hist_len = int(np.random.uniform(3, 24)) if credit_hist_avail else 0

        else:
            # Segment 4: Overleveraged / Distressed Profile
            income = float(np.random.normal(32000, 10000))
            income = max(15000.0, income)
            expense_ratio = np.random.uniform(0.70, 0.90)
            expenses = income * expense_ratio
            emi = float(np.random.choice([6000, 10000, 14000, 18000], p=[0.3, 0.3, 0.25, 0.15]))
            avg_balance = float(np.random.normal(3000, 1500))
            avg_balance = max(500.0, avg_balance)
            income_stability = float(np.random.uniform(0.50, 0.70))
            expense_volatility = float(np.random.uniform(0.25, 0.50))
            regularity = float(np.random.uniform(0.50, 0.75))
            failed_payments = int(np.random.choice([1, 2, 3, 4], p=[0.4, 0.3, 0.2, 0.1]))
            recurring_obligations = float(np.random.uniform(4000, 8000))
            existing_debt = emi * 24
            credit_hist_avail = int(np.random.choice([0, 1], p=[0.5, 0.5]))
            credit_hist_len = int(np.random.uniform(6, 36)) if credit_hist_avail else 0

        surplus = income - expenses - emi
        dti = (emi / income) if income > 0 else 1.0
        savings_rate = ((income - expenses) / income) if income > 0 else 0.0

        records.append({
            "monthly_income": round(income, 2),
            "monthly_expenses": round(expenses, 2),
            "monthly_emi": round(emi, 2),
            "cash_flow_surplus": round(surplus, 2),
            "debt_to_income": round(dti, 4),
            "average_balance": round(avg_balance, 2),
            "income_stability": round(income_stability, 3),
            "expense_volatility": round(expense_volatility, 3),
            "transaction_regularity": round(regularity, 3),
            "savings_rate": round(savings_rate, 4),
            "failed_payment_count": failed_payments,
            "recurring_obligation_amount": round(recurring_obligations, 2),
            "existing_debt_amount": round(existing_debt, 2),
            "credit_history_available": credit_hist_avail,
            "credit_history_length": credit_hist_len
        })

    df = pd.DataFrame(records)

    # Calculate ground-truth latent default probability using standardized logistic function
    # Higher risk drivers (positive log-odds impact):
    # - High DTI
    # - Low or negative surplus
    # - Bounced/failed payments
    # - High expense volatility
    # Mitigating factors (negative log-odds impact):
    # - Strong savings rate
    # - High average balance buffer
    # - High transaction regularity and stability

    norm_surplus = (df["cash_flow_surplus"] - df["cash_flow_surplus"].mean()) / df["cash_flow_surplus"].std()
    norm_dti = (df["debt_to_income"] - df["debt_to_income"].mean()) / df["debt_to_income"].std()
    norm_balance = (df["average_balance"] - df["average_balance"].mean()) / df["average_balance"].std()
    norm_reg = (df["transaction_regularity"] - df["transaction_regularity"].mean()) / df["transaction_regularity"].std()
    norm_stab = (df["income_stability"] - df["income_stability"].mean()) / df["income_stability"].std()
    norm_exp_vol = (df["expense_volatility"] - df["expense_volatility"].mean()) / df["expense_volatility"].std()

    log_odds = (
        -1.2  # Base intercept (baseline default rate ~23%)
        + 1.45 * norm_dti
        + 1.10 * df["failed_payment_count"]
        + 0.65 * norm_exp_vol
        - 1.30 * norm_surplus
        - 0.90 * norm_balance
        - 0.55 * norm_reg
        - 0.40 * norm_stab
    )

    probs = sigmoid(log_odds.values)
    defaults = (np.random.rand(n_samples) < probs).astype(int)

    df["default_probability_ground_truth"] = np.round(probs, 4)
    df["default_risk"] = defaults

    return df

def generate_and_save(output_path: str = "data/synthetic/training_dataset_v1.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df = generate_synthetic_dataset()
    df.to_csv(output_path, index=False)
    print(f"[DataGen] Saved {len(df)} synthetic records to {output_path}")
    print(f"[DataGen] Default rate: {df['default_risk'].mean():.2%}")
    return df

if __name__ == "__main__":
    generate_and_save()
