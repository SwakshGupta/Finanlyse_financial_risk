"""
Authoritative Risk Model Inference Wrapper
Combines Logistic Regression predictions, Alternative Risk Scoring,
Risk Band categorization, and model-derived feature attributions.
"""

import os
import joblib
from typing import Dict, Any, Optional
from app.preprocessing.pipeline import PreprocessingPipeline

MODEL_NAME = "Logistic Regression Alternative Risk Baseline"
MODEL_VERSION = "logistic_regression_v1.0.0"
FEATURE_SET_VERSION = "feature_set_v1"

class RiskModel:
    def __init__(self, model=None, scaler=None):
        self.model = model
        self.scaler = scaler
        self.pipeline = PreprocessingPipeline(scaler=scaler)
        self.model_name = MODEL_NAME
        self.model_version = MODEL_VERSION
        self.feature_set_version = FEATURE_SET_VERSION

    @classmethod
    def load(cls, artifacts_dir: str = "artifacts") -> "RiskModel":
        model_path = os.path.join(artifacts_dir, f"{MODEL_VERSION}.joblib")
        scaler_path = os.path.join(artifacts_dir, "scaler_v1.0.0.joblib")

        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            raise FileNotFoundError(
                f"Model artifacts not found in '{artifacts_dir}'. "
                f"Ensure {model_path} and {scaler_path} exist."
            )

        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)

        instance = cls(model=model, scaler=scaler)
        return instance

    def predict(self, raw_features: Dict[str, Any], application_id: str = "app_default") -> Dict[str, Any]:
        if self.model is None or self.scaler is None:
            raise RuntimeError("RiskModel is not initialized with trained artifacts.")

        scaled_vec, _ = self.pipeline.transform(raw_features)

        # Scikit-learn LogisticRegression predict_proba returns [P(0), P(1)]
        probabilities = self.model.predict_proba(scaled_vec)[0]
        default_prob = float(probabilities[1])

        # Clamp default probability strictly to [0.0, 1.0]
        default_prob = max(0.0, min(1.0, round(default_prob, 4)))

        # Derive Alternative Risk Score (0 - 100, where 100 is best / lowest risk)
        risk_score = int(round((1.0 - default_prob) * 100))

        # Categorize into Risk Band per OpenAPI enum [LOW, MODERATE, HIGH]
        if default_prob < 0.15:
            risk_band = "LOW"
        elif default_prob < 0.40:
            risk_band = "MODERATE"
        else:
            risk_band = "HIGH"

        # Compute feature contributions using model weights and intercept
        factors = self.pipeline.calculate_feature_contributions(
            raw_features=raw_features,
            weights=self.model.coef_,
            intercept=float(self.model.intercept_[0]),
            top_n=4
        )

        return {
            "applicationId": application_id,
            "model": {
                "name": self.model_name,
                "version": self.model_version,
                "featureSetVersion": self.feature_set_version,
                "algorithm": "LOGISTIC_REGRESSION"
            },
            "defaultProbability": default_prob,
            "riskScore": risk_score,
            "riskBand": risk_band,
            "factors": factors
        }
