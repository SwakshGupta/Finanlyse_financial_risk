"""
Synthetic Financial Dataset Generator (Version 2)
Generates reproducible, financially grounded 24-month temporal credit datasets
for training the enhanced Model V2 Logistic Regression risk model.
"""

import os
import random
import numpy as np
import pandas as pd
from app.features.catalog import ORDERED_FEATURE_NAMES_V2

RANDOM_SEED = 42
TOTAL_SAMPLES = 3000

def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))

def generate_synthetic_dataset_v2(n_samples: int = TOTAL_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    records = []

    for i in range(n_samples):
        segment_roll = np.random.rand()
        months = 24

        if segment_roll < 0.35:
            # Segment 1: Thin-file Gig Economy Worker (35%)
            # High digital activity, variable monthly income, zero bureau, low debt
            base_income = float(np.random.normal(38000, 6000))
            base_income = max(20000.0, base_income)
            monthly_incomes = []
            monthly_expenses = []
            monthly_emis = []
            monthly_balances = []
            negative_months = 0
            curr_balance = float(np.random.uniform(8000, 16000))

            emi = float(np.random.choice([0, 1500, 2500, 3500], p=[0.4, 0.3, 0.2, 0.1]))
            recurring_non_debt = float(np.random.uniform(3000, 5000))

            for m in range(months):
                # Monthly fluctuation +/- 18%
                inc_factor = float(np.random.uniform(0.82, 1.20))
                m_inc = base_income * inc_factor
                # Expenses ~62% of income with small variance
                m_exp = m_inc * float(np.random.uniform(0.55, 0.72))
                m_surplus = m_inc - m_exp - emi
                if m_surplus < 0:
                    negative_months += 1
                curr_balance = max(1500.0, curr_balance + m_surplus * 0.35)
                monthly_incomes.append(m_inc)
                monthly_expenses.append(m_exp)
                monthly_emis.append(emi)
                monthly_balances.append(curr_balance)

            income = float(np.mean(monthly_incomes))
            expenses = float(np.mean(monthly_expenses))
            avg_balance = float(np.mean(monthly_balances))
            min_balance = float(np.min(monthly_balances))
            income_stability = float(max(0.0, min(1.0, 1.0 - (np.std(monthly_incomes) / income))))
            expense_volatility = float(min(1.0, np.std(monthly_expenses) / expenses))
            transaction_regularity = float(np.random.uniform(0.80, 0.94))
            failed_payments = int(np.random.choice([0, 1], p=[0.93, 0.07]))
            utility_consistency = float(np.random.uniform(0.85, 0.98))
            digital_ratio = float(np.random.uniform(0.82, 0.96))
            credit_hist_avail = 0
            credit_hist_len = 0
            existing_debt = emi * 12

        elif segment_roll < 0.65:
            # Segment 2: New-to-Credit Salaried Professional (30%)
            # Stable salary deposits, low volatility, punctual utilities, low debt
            base_income = float(np.random.normal(64000, 12000))
            base_income = max(35000.0, base_income)
            monthly_incomes = []
            monthly_expenses = []
            monthly_emis = []
            monthly_balances = []
            negative_months = 0
            curr_balance = float(np.random.uniform(25000, 45000))

            emi = float(np.random.choice([0, 3000, 6000], p=[0.5, 0.3, 0.2]))
            recurring_non_debt = float(np.random.uniform(5000, 9000))

            for m in range(months):
                # Predictable salary with slight increment after month 12
                inc_growth = 1.05 if m >= 12 else 1.0
                m_inc = base_income * inc_growth * float(np.random.uniform(0.98, 1.02))
                m_exp = m_inc * float(np.random.uniform(0.42, 0.58))
                m_surplus = m_inc - m_exp - emi
                if m_surplus < 0:
                    negative_months += 1
                curr_balance = max(8000.0, curr_balance + m_surplus * 0.40)
                monthly_incomes.append(m_inc)
                monthly_expenses.append(m_exp)
                monthly_emis.append(emi)
                monthly_balances.append(curr_balance)

            income = float(np.mean(monthly_incomes))
            expenses = float(np.mean(monthly_expenses))
            avg_balance = float(np.mean(monthly_balances))
            min_balance = float(np.min(monthly_balances))
            income_stability = float(max(0.0, min(1.0, 1.0 - (np.std(monthly_incomes) / income))))
            expense_volatility = float(min(1.0, np.std(monthly_expenses) / expenses))
            transaction_regularity = float(np.random.uniform(0.90, 0.98))
            failed_payments = int(np.random.choice([0, 1], p=[0.98, 0.02]))
            utility_consistency = float(np.random.uniform(0.92, 1.0))
            digital_ratio = float(np.random.uniform(0.75, 0.92))
            credit_hist_avail = int(np.random.choice([0, 1], p=[0.75, 0.25]))
            credit_hist_len = int(np.random.uniform(1, 14)) if credit_hist_avail else 0
            existing_debt = emi * 15

        elif segment_roll < 0.85:
            # Segment 3: Micro-Entrepreneur / Kirana Merchant (20%)
            # High transaction volume, seasonal inventory cycles, medium debt
            base_income = float(np.random.normal(88000, 22000))
            base_income = max(40000.0, base_income)
            monthly_incomes = []
            monthly_expenses = []
            monthly_emis = []
            monthly_balances = []
            negative_months = 0
            curr_balance = float(np.random.uniform(18000, 35000))

            emi = float(np.random.choice([4000, 8000, 12000, 16000], p=[0.3, 0.35, 0.25, 0.1]))
            recurring_non_debt = float(np.random.uniform(6000, 12000))

            for m in range(months):
                # Cyclical business turnover (seasonal peaks in months 9-11)
                seasonality = 1.25 if (m % 12) in [9, 10, 11] else 0.95
                m_inc = base_income * seasonality * float(np.random.uniform(0.85, 1.15))
                # Restocking expenses spike
                m_exp = m_inc * float(np.random.uniform(0.52, 0.72))
                m_surplus = m_inc - m_exp - emi
                if m_surplus < 0:
                    negative_months += 1
                curr_balance = max(4000.0, curr_balance + m_surplus * 0.30)
                monthly_incomes.append(m_inc)
                monthly_expenses.append(m_exp)
                monthly_emis.append(emi)
                monthly_balances.append(curr_balance)

            income = float(np.mean(monthly_incomes))
            expenses = float(np.mean(monthly_expenses))
            avg_balance = float(np.mean(monthly_balances))
            min_balance = float(np.min(monthly_balances))
            income_stability = float(max(0.0, min(1.0, 1.0 - (np.std(monthly_incomes) / income))))
            expense_volatility = float(min(1.0, np.std(monthly_expenses) / expenses))
            transaction_regularity = float(np.random.uniform(0.82, 0.95))
            failed_payments = int(np.random.choice([0, 1, 2], p=[0.88, 0.10, 0.02]))
            utility_consistency = float(np.random.uniform(0.82, 0.96))
            digital_ratio = float(np.random.uniform(0.72, 0.90))
            credit_hist_avail = int(np.random.choice([0, 1], p=[0.55, 0.45]))
            credit_hist_len = int(np.random.uniform(3, 24)) if credit_hist_avail else 0
            existing_debt = emi * 18

        else:
            # Segment 4: Overleveraged / Distressed Profile (15%)
            # Heavy EMI obligations, recurrent negative cash-flow months, liquidity stress
            base_income = float(np.random.normal(34000, 8000))
            base_income = max(18000.0, base_income)
            monthly_incomes = []
            monthly_expenses = []
            monthly_emis = []
            monthly_balances = []
            negative_months = 0
            curr_balance = float(np.random.uniform(2000, 6000))

            emi = float(np.random.choice([8000, 12000, 16000, 20000], p=[0.3, 0.3, 0.25, 0.15]))
            recurring_non_debt = float(np.random.uniform(4000, 7000))

            # Downward income trend
            for m in range(months):
                decay = 1.0 - (m * 0.008) # slight income contraction
                m_inc = base_income * decay * float(np.random.uniform(0.88, 1.08))
                m_exp = m_inc * float(np.random.uniform(0.68, 0.85))
                m_surplus = m_inc - m_exp - emi
                if m_surplus < 0:
                    negative_months += 1
                curr_balance = max(500.0, curr_balance + m_surplus * 0.20)
                monthly_incomes.append(m_inc)
                monthly_expenses.append(m_exp)
                monthly_emis.append(emi)
                monthly_balances.append(curr_balance)

            income = float(np.mean(monthly_incomes))
            expenses = float(np.mean(monthly_expenses))
            avg_balance = float(np.mean(monthly_balances))
            min_balance = float(np.min(monthly_balances))
            income_stability = float(max(0.0, min(1.0, 1.0 - (np.std(monthly_incomes) / income))))
            expense_volatility = float(min(1.0, np.std(monthly_expenses) / expenses))
            transaction_regularity = float(np.random.uniform(0.55, 0.78))
            failed_payments = int(np.random.choice([1, 2, 3, 4], p=[0.35, 0.35, 0.20, 0.10]))
            utility_consistency = float(np.random.uniform(0.52, 0.78))
            digital_ratio = float(np.random.uniform(0.50, 0.75))
            credit_hist_avail = int(np.random.choice([0, 1], p=[0.5, 0.5]))
            credit_hist_len = int(np.random.uniform(6, 36)) if credit_hist_avail else 0
            existing_debt = emi * 24

        # 3-Month Trailing Income Trend Calculation
        earliest_3m = float(np.mean(monthly_incomes[:3]))
        latest_3m = float(np.mean(monthly_incomes[-3:]))
        income_trend_3m = float((latest_3m - earliest_3m) / earliest_3m) if earliest_3m > 0 else 0.0
        income_trend_3m = max(-0.50, min(0.50, income_trend_3m))

        surplus = income - expenses - emi
        dti = (emi / income) if income > 0 else 1.0
        min_balance_ratio = (min_balance / income) if income > 0 else 0.05
        savings_rate = (max(0.0, surplus) / income) if income > 0 else 0.0

        records.append({
            "monthly_income": round(income, 2),
            "monthly_expenses": round(expenses, 2),
            "monthly_emi": round(emi, 2),
            "cash_flow_surplus": round(surplus, 2),
            "debt_to_income": round(dti, 4),
            "average_balance": round(avg_balance, 2),
            "minimum_balance_ratio": round(min_balance_ratio, 4),
            "income_stability": round(income_stability, 3),
            "expense_volatility": round(expense_volatility, 3),
            "transaction_regularity": round(transaction_regularity, 3),
            "negative_cashflow_months": int(negative_months),
            "income_trend_3m": round(income_trend_3m, 4),
            "utility_payment_consistency": round(utility_consistency, 3),
            "digital_transaction_ratio": round(digital_ratio, 3),
            "savings_rate": round(savings_rate, 4),
            "failed_payment_count": failed_payments,
            "non_debt_recurring_obligations": round(recurring_non_debt, 2),
            "existing_debt_amount": round(existing_debt, 2),
            "credit_history_available": credit_hist_avail,
            "credit_history_length": credit_hist_len
        })

    df = pd.DataFrame(records)

    # Calculate ground-truth latent default probability using standardized logistic function
    # Risk Drivers (positive log-odds impact):
    # - High DTI
    # - Negative cash-flow months count (NEW)
    # - Declining income trend (negative trend -> higher risk) (NEW)
    # - Bounced/failed payments
    # - High expense volatility
    # Risk Mitigants (negative log-odds impact):
    # - Strong cash-flow surplus
    # - High minimum balance ratio / liquidity floor (NEW)
    # - Strong utility payment consistency (NEW)
    # - High digital transaction ratio (NEW)
    # - High average balance buffer
    # - Income stability & transaction regularity

    norm_surplus = (df["cash_flow_surplus"] - df["cash_flow_surplus"].mean()) / df["cash_flow_surplus"].std()
    norm_dti = (df["debt_to_income"] - df["debt_to_income"].mean()) / df["debt_to_income"].std()
    norm_balance = (df["average_balance"] - df["average_balance"].mean()) / df["average_balance"].std()
    norm_min_bal = (df["minimum_balance_ratio"] - df["minimum_balance_ratio"].mean()) / df["minimum_balance_ratio"].std()
    norm_reg = (df["transaction_regularity"] - df["transaction_regularity"].mean()) / df["transaction_regularity"].std()
    norm_stab = (df["income_stability"] - df["income_stability"].mean()) / df["income_stability"].std()
    norm_exp_vol = (df["expense_volatility"] - df["expense_volatility"].mean()) / df["expense_volatility"].std()
    norm_neg_months = (df["negative_cashflow_months"] - df["negative_cashflow_months"].mean()) / df["negative_cashflow_months"].std()
    norm_trend = (df["income_trend_3m"] - df["income_trend_3m"].mean()) / df["income_trend_3m"].std()
    norm_utility = (df["utility_payment_consistency"] - df["utility_payment_consistency"].mean()) / df["utility_payment_consistency"].std()
    norm_digital = (df["digital_transaction_ratio"] - df["digital_transaction_ratio"].mean()) / df["digital_transaction_ratio"].std()

    log_odds = (
        -1.35  # Intercept (baseline default rate ~23%)
        + 1.30 * norm_dti
        + 0.95 * norm_neg_months
        + 0.85 * df["failed_payment_count"]
        + 0.50 * norm_exp_vol
        - 0.45 * norm_trend  # positive trend reduces risk
        - 1.15 * norm_surplus
        - 0.80 * norm_min_bal  # liquidity floor protects against default
        - 0.65 * norm_balance
        - 0.50 * norm_utility  # payment discipline
        - 0.40 * norm_reg
        - 0.35 * norm_stab
        - 0.25 * norm_digital
    )

    probs = sigmoid(log_odds.values)
    defaults = (np.random.rand(n_samples) < probs).astype(int)

    df["default_probability_ground_truth"] = np.round(probs, 4)
    df["default_risk"] = defaults

    return df

def generate_and_save(output_path: str = "data/synthetic/training_dataset_v2.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df = generate_synthetic_dataset_v2()
    df.to_csv(output_path, index=False)
    print(f"[DataGen V2] Saved {len(df)} synthetic 24-month records to {output_path}")
    print(f"[DataGen V2] Features count: {len(ORDERED_FEATURE_NAMES_V2)}")
    print(f"[DataGen V2] Default rate: {df['default_risk'].mean():.2%}")
    return df

if __name__ == "__main__":
    generate_and_save()
