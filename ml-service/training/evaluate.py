"""
Model Evaluation and Diagnostic Reporter
Generates comprehensive validation reports for the baseline risk model.
"""

import os
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, brier_score_loss
from app.features.catalog import ORDERED_FEATURE_NAMES
from app.model.risk_model import MODEL_VERSION

def evaluate_model(
    data_path: str = "data/synthetic/training_dataset_v1.csv",
    artifacts_dir: str = "ml-service/artifacts"
):
    df = pd.read_csv(data_path)
    X = df[ORDERED_FEATURE_NAMES]
    y = df["default_risk"]

    model_path = os.path.join(artifacts_dir, f"{MODEL_VERSION}.joblib")
    scaler_path = os.path.join(artifacts_dir, "scaler_v1.0.0.joblib")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    X_scaled = scaler.transform(X)
    probs = model.predict_proba(X_scaled)[:, 1]
    preds = (probs >= 0.5).astype(int)

    auc = roc_auc_score(y, probs)
    brier = brier_score_loss(y, probs)
    cm = confusion_matrix(y, preds).tolist()
    report = classification_report(y, preds, output_dict=True)

    eval_data = {
        "dataset_records": len(df),
        "roc_auc": round(float(auc), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": cm,
        "classification_report": report,
        "disclaimer": (
            "Model evaluated on calibrated synthetic financial benchmark data. "
            "Demonstrates mathematical consistency and factor interpretability for thin-file underwriting."
        )
    }

    report_path = os.path.join(artifacts_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(eval_data, f, indent=2)

    print(f"[Evaluation] Report generated and saved to {report_path}")
    print(f"[Evaluation] Overall Dataset ROC-AUC: {auc:.4f}")
    return eval_data

if __name__ == "__main__":
    evaluate_model()
