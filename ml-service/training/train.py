"""
Baseline Logistic Regression Training Pipeline
Trains, evaluates, and serializes the baseline risk assessment model.
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

from app.features.catalog import ORDERED_FEATURE_NAMES, FEATURE_CATALOG, FEATURE_SET_VERSION
from app.model.risk_model import MODEL_NAME, MODEL_VERSION
from training.generate_data import generate_and_save

def train_and_serialize(
    data_path: str = "data/synthetic/training_dataset_v1.csv",
    artifacts_dir: str = "ml-service/artifacts"
):
    print("=" * 60)
    print("Starting Baseline ML Training: Logistic Regression")
    print("=" * 60)

    # 1. Load or generate dataset
    if not os.path.exists(data_path):
        print(f"[Train] Dataset not found at {data_path}. Generating synthetic dataset...")
        df = generate_and_save(data_path)
    else:
        df = pd.read_csv(data_path)
        print(f"[Train] Loaded {len(df)} records from {data_path}")

    X = df[ORDERED_FEATURE_NAMES]
    y = df["default_risk"]

    print(f"[Train] Features count: {len(ORDERED_FEATURE_NAMES)}")
    print(f"[Train] Target distribution: Non-default={sum(y==0)}, Default={sum(y==1)} ({y.mean():.2%})")

    # 2. Train-test split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 3. Fit StandardScaler on train fold only
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Fit Logistic Regression baseline
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

    print("\n--- Training Evaluation Metrics ---")
    print(f"Train ROC-AUC: {train_auc:.4f}")
    print(f"Test ROC-AUC:  {test_auc:.4f}")
    print(f"Test Accuracy: {test_acc:.4f}")
    print(f"Test F1-Score: {test_f1:.4f}")
    print(f"Brier Score:   {test_brier:.4f}")

    # 6. Feature coefficients
    feature_importances = []
    for fname, coef in zip(ORDERED_FEATURE_NAMES, model.coef_[0]):
        feature_importances.append({
            "feature": fname,
            "coefficient": round(float(coef), 4),
            "odds_ratio": round(float(np.exp(coef)), 4),
            "effect": "INCREASES_DEFAULT_RISK" if coef > 0 else "DECREASES_DEFAULT_RISK"
        })

    feature_importances.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    print("\n--- Top Feature Coefficients (Log-Odds Impact) ---")
    for item in feature_importances[:6]:
        print(f"  {item['feature']:<28} coef={item['coefficient']:+.4f} (OR={item['odds_ratio']:.2f}) -> {item['effect']}")

    # 7. Serialize Artifacts
    os.makedirs(artifacts_dir, exist_ok=True)

    model_path = os.path.join(artifacts_dir, f"{MODEL_VERSION}.joblib")
    scaler_path = os.path.join(artifacts_dir, "scaler_v1.0.0.joblib")
    catalog_path = os.path.join(artifacts_dir, "feature_catalog_v1.json")
    metadata_path = os.path.join(artifacts_dir, "model_metadata.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    with open(catalog_path, "w") as f:
        json.dump(FEATURE_CATALOG, f, indent=2)

    metadata = {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "feature_set_version": FEATURE_SET_VERSION,
        "algorithm": "LOGISTIC_REGRESSION",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": {
            "train_roc_auc": round(train_auc, 4),
            "test_roc_auc": round(test_auc, 4),
            "test_accuracy": round(test_acc, 4),
            "test_f1": round(test_f1, 4),
            "test_brier_score": round(test_brier, 4)
        },
        "feature_coefficients": feature_importances
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[Artifacts] Serialized model to:    {model_path}")
    print(f"[Artifacts] Serialized scaler to:   {scaler_path}")
    print(f"[Artifacts] Saved feature catalog:  {catalog_path}")
    print(f"[Artifacts] Saved model metadata:   {metadata_path}")

    return metadata

if __name__ == "__main__":
    train_and_serialize()
