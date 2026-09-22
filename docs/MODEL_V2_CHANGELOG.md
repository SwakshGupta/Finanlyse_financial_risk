# Finalyse Model V2.0.0 & 24-Month Temporal Upgrade Changelog

## 1. Executive Summary

Finalyse Model V2 (`logistic_regression_v2.0.0`) represents a major evolutionary leap from static single-month snapshot underwriting to **24-month longitudinal financial behavioral analysis**. This upgrade equips alternative lenders and underwriters with deeper visibility into income trajectory, liquidity retention, payment discipline, and cash-flow resilience without relying on traditional credit bureaus.

---

## 2. Core Architectural Changes

### A. Transition to 24-Month Longitudinal Financial History
* **Previous (V1)**: Relied on single-month estimated profiles (`monthlyIncome`, `monthlyExpenses`, `monthlyEmi`, `averageBalance`) representing a static snapshot.
* **Upgraded (V2)**: Generates and ingests a **24-month month-by-month temporal timeline** (2024–2026), capturing seasonal income fluctuations, expense spikes, utility payment regularity, and minimum balance retention over time.

### B. Feature Set V2 (20 Total Features)
Model V2 expands the feature space from 15 features to 20 features by introducing 5 new longitudinal dimensions while maintaining strict mathematical factor explainability.

| # | Feature Key | Category | Description | Underwriting Direction |
|---|---|---|---|---|
| 1 | `monthly_income` | Baseline Financial | Normalized monthly gross inflow | Higher = Lower Risk |
| 2 | `monthly_expenses` | Baseline Financial | Living and discretionary expenses | Higher = Higher Risk |
| 3 | `monthly_emi` | Existing Debt | Formal debt obligations | Higher = Higher Risk |
| 4 | `cash_flow_surplus` | Cashflow | Free net cashflow margin | Higher = Lower Risk |
| 5 | `debt_to_income` | Leverage | Ratio of EMI obligations to gross income | Higher = Higher Risk |
| 6 | `expense_ratio` | Cashflow | Living expenses as a fraction of income | Higher = Higher Risk |
| 7 | `savings_rate` | Savings | Net cash surplus savings rate | Higher = Lower Risk |
| 8 | `average_balance` | Liquidity | Mean end-of-day bank balance | Higher = Lower Risk |
| 9 | `minimum_balance_ratio` | **NEW (V2)** | Ratio of minimum balance to average balance (liquidity floor) | Higher = Lower Risk |
| 10 | `income_stability` | Volatility | Inverse variance of month-to-month gross receipts | Higher = Lower Risk |
| 11 | `expense_volatility` | Volatility | Variance in monthly outgoing debit flows | Higher = Higher Risk |
| 12 | `transaction_regularity` | Alternative | Consistency of daily/weekly transaction events | Higher = Lower Risk |
| 13 | `negative_cashflow_months` | **NEW (V2)** | Count of deficit months over 24-month horizon | Higher = Higher Risk |
| 14 | `income_trend_3m` | **NEW (V2)** | 3-month momentum comparing recent 3M average to baseline | Higher = Lower Risk |
| 15 | `utility_payment_consistency`| **NEW (V2)** | Regularity score of on-time utility/telco bill payments | Higher = Lower Risk |
| 16 | `digital_transaction_ratio` | **NEW (V2)** | Ratio of digital/UPI/card flows vs untraceable cash | Higher = Lower Risk |
| 17 | `non_debt_recurring_obligations`| **REWORKED (V2)** | Living subscriptions, insurance, and utilities (NO EMI double-count) | Higher = Higher Risk |
| 18 | `failed_payment_count` | Alternative | Bounced debit attempts or ECS return count | Higher = Higher Risk |
| 19 | `existing_debt_amount` | Existing Debt | Cumulative outstanding loan balance estimate | Higher = Higher Risk |
| 20 | `observation_months` | Data Quality | Duration of observed financial history (calibrated to 24) | Higher = Lower Risk |

### C. Elimination of Double-Counting in Obligations
* In Model V1, `recurring_obligation_amount` sometimes conflated loan EMIs and utility bills.
* In Model V2, `monthly_emi` strictly tracks debt service commitments, while `non_debt_recurring_obligations` isolates non-debt subscriptions, telco, and insurance. The feature catalog routes legacy payloads safely via alias resolvers.

---

## 3. Training & Validation Results

Model V2 was trained using an 80/20 stratified train/test split on 3,000 synthetic profiles across 4 calibrated segments (`THIN_FILE_GIG_WORKER`, `NEW_TO_CREDIT_SALARIED`, `MICRO_ENTREPRENEUR`, `OVERLEVERAGED_STRESSED`).

* **Model Class**: Regularized Logistic Regression (`C=1.0`, `solver='lbfgs'`) with `StandardScaler`
* **Dataset Default Rate**: 27.0%

### Performance Metrics:
* **Train ROC-AUC**: `0.9337`
* **Test ROC-AUC**: `0.9168`
* **Generalization Gap**: `0.0169` (well below 0.05 overfitting threshold)
* **Test Accuracy**: `83.50%`
* **Test F1 Score**: `0.7258`
* **Brier Calibration Score**: `0.1109` (exceptional probability calibration)

---

## 4. Serialized Artifacts

The serialized artifacts are located in `ml-service/artifacts/`:
1. `logistic_regression_v2.0.0.joblib`: Serialized Model V2 scikit-learn pipeline.
2. `scaler_v2.0.0.joblib`: Serialized StandardScaler fitted on 20 features.
3. `feature_catalog_v2.json`: Formal metadata specification of the 20 features.
4. `model_metadata_v2.0.0.json`: Complete training hyperparameters, dataset distributions, and evaluation metrics.
5. *(Preserved for backward compatibility)*: `logistic_regression_v1.0.0.joblib`, `scaler_v1.0.0.joblib`, `model_metadata_v1.0.0.json`.

---

## 5. Microservice & Backend Compatibility

* **FastAPI Microservice (`ml-service`)**:
  - Automatically loads Model V2 by default.
  - Supports model version switching (`v1.0.0` vs `v2.0.0`) via the `modelVersion` payload parameter.
  - Alias resolution layer maps legacy field names seamlessly.
* **Express Backend (`backend`)**:
  - `syntheticData.adapter.js`: Generates 24-month histories with target profiles matching canonical baseline numbers.
  - `canonical.schema.js`: Computes all 5 new temporal metrics and formats `trajectoryInsights` and `incomeHistory`.
  - `assessment.service.js`: Passes V2 features to ML service and enriches returned assessment records with `financialSummary`.
  - `whatIf.service.js`: Supports V2 counterfactual simulations while preserving baseline assessments.
  - `catalog.tools.js`: Exposes V2 features to Gemini LLM tool-calling routines.

---

## 6. Frontend Dashboard & User Experience

1. **24-Month Temporal Inflow Trend Card (`IncomeTrendCard.jsx`)**:
   - Pure SVG responsive line chart displaying 24 consecutive months of gross inflow.
   - Earliest 3M vs Latest 3M average comparison lines.
   - Interactive hover points revealing exact historical monthly inflows.
   - Statistical chips: 24M Average, Historical Peak, Historical Floor, and 3M Momentum.
2. **Financial Trajectory & Behavioral Health Card (`FinancialTrajectoryCard.jsx`)**:
   - 3-Month Momentum (`income_trend_3m`) status indicator.
   - Deficit Months (`negative_cashflow_months`) out of 24 months.
   - Liquidity Floor Buffer (`minimum_balance_ratio`).
   - Utility Consistency (`utility_payment_consistency`).
   - Digital Footprint share (`digital_transaction_ratio`).
   - Obligation Architecture Separation badge (EMI vs non-debt commitments).
3. **Inclusion & Architecture Audit Card (`DataCoverageCard.jsx`)**:
   - Updated to reflect 24-month temporal observation horizon and `logistic_regression_v2.0.0` governance.
4. **Intake UI (`NewApplicationPage.jsx`)**:
   - 4 calibrated presets with 24-month temporal history indicators.
   - Step 3 verification metrics preview displaying all 24M derived indicators prior to model inference.
