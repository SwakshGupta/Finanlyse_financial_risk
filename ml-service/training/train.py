"""
Model V2 Logistic Regression Training Pipeline
Trains, evaluates, and serializes the upgraded 24-month risk assessment model.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, brier_score_loss

from app.features.catalog import (
    ORDERED_FEATURE_NAMES_V2,
    FEATURE_CATALOG_V2,
    FEATURE_SET_VERSION_V2,
    ORDERED_FEATURE_NAMES_V1,
    FEATURE_CATALOG_V1,
    FEATURE_SET_VERSION_V1,
)
from training.generate_data import generate_and_save

MODEL_NAME_V2 = "Logistic Regression 24-Month Temporal Risk Model"
MODEL_VERSION_V2 = "logistic_regression_v2.0.0"

def train_and_serialize_v2(
    data_path: str = "data/synthetic/training_dataset_v2.csv",
    artifacts_dir: str = "ml-service/artifacts"
):
    print("=" * 65)
    print("Starting Model V2 ML Training: 24-Month Temporal Logistic Regression")
    print("=" * 65)

    # 1. Load or generate dataset
    if not os.path.exists(data_path):
        print(f"[Train V2] Dataset not found at {data_path}. Generating synthetic dataset...")
        df = generate_and_save(data_path)
    else:
        df = pd.read_csv(data_path)
        print(f"[Train V2] Loaded {len(df)} records from {data_path}")

    feature_names = ORDERED_FEATURE_NAMES_V2
    X = df[feature_names]
    y = df["default_risk"]

    print(f"[Train V2] Features count: {len(feature_names)}")
    print(f"[Train V2] Target distribution: Non-default={sum(y==0)}, Default={sum(y==1)} ({y.mean():.2%})")

    # 2. Train-test split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 3. Fit StandardScaler on train fold only
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Fit Logistic Regression
    model = LogisticRegression(
        C=1.0,
        max_iter=1000,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train_scaled, y_train)

    # 5. Evaluate
    y_pred_train = model.predict(X_train_scaled)
    y_prob_train = model.predict_proba(X_train_scaled)[:, 1]

    y_pred_test = model.predict(X_test_scaled)
    y_prob_test = model.predict_proba(X_test_scaled)[:, 1]

    train_auc = roc_auc_score(y_train, y_prob_train)
    test_auc = roc_auc_score(y_test, y_prob_test)
    test_acc = accuracy_score(y_test, y_pred_test)
    test_f1 = f1_score(y_test, y_pred_test)
    test_brier = brier_score_loss(y_test, y_prob_test)

    print("\n--- Training Evaluation Metrics (Model V2) ---")
    print(f"Train ROC-AUC: {train_auc:.4f}")
    print(f"Test ROC-AUC:  {test_auc:.4f}")
    print(f"Test Accuracy: {test_acc:.4f}")
    print(f"Test F1-Score: {test_f1:.4f}")
    print(f"Brier Score:   {test_brier:.4f}")
    print(f"Train/Test Gap: {abs(train_auc - test_auc):.4f}")

    # 6. Feature coefficients
    feature_importances = []
    for fname, coef in zip(feature_names, model.coef_[0]):
        feature_importances.append({
            "feature": fname,
            "coefficient": round(float(coef), 4),
            "odds_ratio": round(float(np.exp(coef)), 4),
            "effect": "INCREASES_DEFAULT_RISK" if coef > 0 else "DECREASES_DEFAULT_RISK"
        })

    feature_importances.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    print("\n--- Feature Coefficients (Log-Odds Impact in Model V2) ---")
    for item in feature_importances:
        print(f"  {item['feature']:<32} coef={item['coefficient']:+.4f} (OR={item['odds_ratio']:.2f}) -> {item['effect']}")

    # 7. Serialize Artifacts
    os.makedirs(artifacts_dir, exist_ok=True)

    model_path = os.path.join(artifacts_dir, f"{MODEL_VERSION_V2}.joblib")
    scaler_path = os.path.join(artifacts_dir, "scaler_v2.0.0.joblib")
    catalog_path = os.path.join(artifacts_dir, "feature_catalog_v2.json")
    metadata_path = os.path.join(artifacts_dir, "model_metadata_v2.0.0.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    with open(catalog_path, "w") as f:
        json.dump(FEATURE_CATALOG_V2, f, indent=2)

    metadata = {
        "model_name": MODEL_NAME_V2,
        "model_version": MODEL_VERSION_V2,
        "feature_set_version": FEATURE_SET_VERSION_V2,
        "algorithm": "LOGISTIC_REGRESSION",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": {
            "train_roc_auc": round(train_auc, 4),
            "test_roc_auc": round(test_auc, 4),
            "test_accuracy": round(test_acc, 4),
            "test_f1": round(test_f1, 4),
            "test_brier_score": round(test_brier, 4),
            "train_test_gap": round(abs(train_auc - test_auc), 4)
        },
        "feature_coefficients": feature_importances
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[Artifacts V2] Serialized model to:    {model_path}")
    print(f"[Artifacts V2] Serialized scaler to:   {scaler_path}")
    print(f"[Artifacts V2] Saved feature catalog:  {catalog_path}")
    print(f"[Artifacts V2] Saved model metadata:   {metadata_path}")

    return metadata

if __name__ == "__main__":
    train_and_serialize_v2()
