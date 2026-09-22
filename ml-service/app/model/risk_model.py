"""
Authoritative Risk Model Inference Wrapper
Combines Logistic Regression predictions, Alternative Risk Scoring,
Risk Band categorization, and model-derived feature attributions.
Supports both Model V1 (15 features) and Model V2 (20 temporal features).
"""

import os
import joblib
from typing import Dict, Any, Optional
from app.preprocessing.pipeline import PreprocessingPipeline
from app.features.catalog import FEATURE_SET_VERSION_V1, FEATURE_SET_VERSION_V2

DEFAULT_MODEL_NAME_V2 = "Logistic Regression 24-Month Temporal Risk Model"
DEFAULT_MODEL_VERSION_V2 = "logistic_regression_v2.0.0"
DEFAULT_FEATURE_SET_V2 = FEATURE_SET_VERSION_V2

MODEL_NAME = DEFAULT_MODEL_NAME_V2
MODEL_VERSION = DEFAULT_MODEL_VERSION_V2
FEATURE_SET_VERSION = DEFAULT_FEATURE_SET_V2

class RiskModel:
    def __init__(
        self,
        model=None,
        scaler=None,
        model_name: str = DEFAULT_MODEL_NAME_V2,
        model_version: str = DEFAULT_MODEL_VERSION_V2,
        feature_set_version: str = DEFAULT_FEATURE_SET_V2
    ):
        self.model = model
        self.scaler = scaler
        self.model_name = model_name
        self.model_version = model_version
        self.feature_set_version = feature_set_version
        self.pipeline = PreprocessingPipeline(scaler=scaler, feature_set_version=feature_set_version)

    @classmethod
    def load(cls, artifacts_dir: Optional[str] = None, version: Optional[str] = None) -> "RiskModel":
        search_dirs = []
        if artifacts_dir:
            search_dirs.append(artifacts_dir)
        env_dir = os.environ.get("MODEL_ARTIFACTS_DIR")
        if env_dir:
            search_dirs.append(env_dir)
        search_dirs.extend([
            "artifacts",
            "ml-service/artifacts",
            os.path.join(os.path.dirname(__file__), "..", "..", "artifacts")
        ])

        target_version = version or os.environ.get("RISK_MODEL_VERSION", DEFAULT_MODEL_VERSION_V2)

        # Map target version to filenames
        if "v1" in target_version:
            m_filename = "logistic_regression_v1.0.0.joblib"
            s_filename = "scaler_v1.0.0.joblib"
            name = "Logistic Regression Alternative Risk Baseline"
            feat_version = FEATURE_SET_VERSION_V1
            m_version = "logistic_regression_v1.0.0"
        else:
            m_filename = "logistic_regression_v2.0.0.joblib"
            s_filename = "scaler_v2.0.0.joblib"
            name = DEFAULT_MODEL_NAME_V2
            feat_version = FEATURE_SET_VERSION_V2
            m_version = DEFAULT_MODEL_VERSION_V2

        resolved_dir = None
        for candidate in search_dirs:
            if os.path.exists(candidate) and os.path.exists(os.path.join(candidate, m_filename)):
                resolved_dir = candidate
                break

        if not resolved_dir:
            # Fallback to v1 if v2 not found
            for candidate in search_dirs:
                if os.path.exists(candidate) and os.path.exists(os.path.join(candidate, "logistic_regression_v1.0.0.joblib")):
                    resolved_dir = candidate
                    m_filename = "logistic_regression_v1.0.0.joblib"
                    s_filename = "scaler_v1.0.0.joblib"
                    name = "Logistic Regression Alternative Risk Baseline"
                    feat_version = FEATURE_SET_VERSION_V1
                    m_version = "logistic_regression_v1.0.0"
                    break

        if not resolved_dir:
            raise FileNotFoundError(
                f"Model artifacts not found. Searched paths: {search_dirs}. "
                f"Ensure {m_filename} and {s_filename} exist."
            )

        model_path = os.path.join(resolved_dir, m_filename)
        scaler_path = os.path.join(resolved_dir, s_filename)

        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)

        instance = cls(
            model=model,
            scaler=scaler,
            model_name=name,
            model_version=m_version,
            feature_set_version=feat_version
        )
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
            top_n=5
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
