"""
Preprocessing and Scaling Pipeline
Handles feature vector conversion, normalization, and contribution attribution.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from app.features.catalog import (
    ORDERED_FEATURE_NAMES_V1,
    ORDERED_FEATURE_NAMES_V2,
    FEATURE_SET_VERSION_V1,
    FEATURE_SET_VERSION_V2,
    extract_feature_vector
)

class PreprocessingPipeline:
    def __init__(self, scaler=None, feature_set_version: str = FEATURE_SET_VERSION_V2):
        self.scaler = scaler
        self.feature_set_version = feature_set_version
        if feature_set_version == FEATURE_SET_VERSION_V1:
            self.feature_names = ORDERED_FEATURE_NAMES_V1
        else:
            self.feature_names = ORDERED_FEATURE_NAMES_V2

    def transform(self, raw_features: Dict[str, Any]) -> Tuple[np.ndarray, List[float]]:
        """
        Extracts raw feature vector and applies standard scaling.
        Returns: (scaled_vector_2d, unscaled_vector_list)
        """
        raw_vector = extract_feature_vector(raw_features, version=self.feature_set_version)
        arr = np.array(raw_vector).reshape(1, -1)

        if self.scaler is not None:
            import pandas as pd
            df_arr = pd.DataFrame(arr, columns=self.feature_names)
            scaled = self.scaler.transform(df_arr)
        else:
            scaled = arr

        return scaled, raw_vector

    def calculate_feature_contributions(
        self,
        raw_features: Dict[str, Any],
        weights: np.ndarray,
        intercept: float,
        top_n: int = 5
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Calculates linear log-odds feature contributions.
        contribution = w_i * ((x_i - mu_i) / sigma_i)
        
        - If contribution > 0: Increases default probability (NEGATIVE impact on creditworthiness)
        - If contribution < 0: Decreases default probability (POSITIVE impact on creditworthiness)
        """
        scaled_vec, raw_vec = self.transform(raw_features)
        z_scores = scaled_vec[0]
        w = weights.flatten()

        positive_factors = []
        negative_factors = []

        for i, fname in enumerate(self.feature_names):
            if i >= len(w) or i >= len(z_scores):
                continue
            val = raw_vec[i]
            contrib = float(w[i] * z_scores[i])

            factor_item = {
                "feature": fname,
                "value": val,
                "contribution": round(abs(contrib), 4)
            }

            if contrib < 0:
                # Lowers default probability -> Good for applicant
                factor_item["direction"] = "POSITIVE"
                factor_item["impact"] = "STRENGTHENING"
                positive_factors.append(factor_item)
            else:
                # Raises default probability -> Risk driver
                factor_item["direction"] = "NEGATIVE"
                factor_item["impact"] = "RISK_DRIVER"
                negative_factors.append(factor_item)

        # Sort factors by magnitude of contribution
        positive_factors.sort(key=lambda x: x["contribution"], reverse=True)
        negative_factors.sort(key=lambda x: x["contribution"], reverse=True)

        return {
            "positive": positive_factors[:top_n],
            "negative": negative_factors[:top_n]
        }
