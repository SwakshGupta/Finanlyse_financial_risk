"""
Internal ML Inference Router
Provides secured endpoints for Node.js backend integration.
"""

import os
from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException, status, Request
from app.schemas.prediction import (
    MLPredictionRequest,
    MLPredictionResponse,
    ModelMetadata,
    ReadinessResponse,
)

router = APIRouter(prefix="/internal/v1", tags=["Internal ML Inference"])

INTERNAL_API_KEY = os.environ.get("ML_SERVICE_API_KEY", "dev_internal_ml_service_key_secret")

def verify_internal_api_key(x_internal_api_key: str = Header(None, alias="X-Internal-API-Key")):
    expected_key = os.environ.get("ML_SERVICE_API_KEY", INTERNAL_API_KEY)
    if not x_internal_api_key or x_internal_api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API key"
        )
    return x_internal_api_key

@router.get("/health")
def internal_health():
    return {
        "status": "UP",
        "service": "risk-assessment-ml-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/ready", response_model=ReadinessResponse)
def internal_readiness(request: Request):
    risk_model = getattr(request.app.state, "risk_model", None)
    if risk_model is None or risk_model.model is None or risk_model.scaler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model artifacts are not loaded"
        )
    return ReadinessResponse(
        status="READY",
        checks={
            "model_loaded": "OK",
            "scaler_loaded": "OK",
            "feature_pipeline": "OK"
        }
    )

@router.get("/model", response_model=ModelMetadata)
def get_model_metadata(
    request: Request,
    api_key: str = Header(None, alias="X-Internal-API-Key")
):
    verify_internal_api_key(api_key)
    risk_model = getattr(request.app.state, "risk_model", None)
    if risk_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Risk model not loaded"
        )
    return ModelMetadata(
        name=risk_model.model_name,
        version=risk_model.model_version,
        featureSetVersion=risk_model.feature_set_version,
        algorithm="LOGISTIC_REGRESSION",
        trainingDataType="SYNTHETIC"
    )

@router.post("/predict", response_model=MLPredictionResponse)
def predict_risk(
    payload: MLPredictionRequest,
    request: Request,
    api_key: str = Header(None, alias="X-Internal-API-Key")
):
    verify_internal_api_key(api_key)
    risk_model = getattr(request.app.state, "risk_model", None)
    if risk_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Risk model not loaded"
        )

    try:
        prediction = risk_model.predict(
            raw_features=payload.features,
            application_id=payload.applicationId
        )
        prediction["generatedAt"] = datetime.now(timezone.utc).isoformat()
        return MLPredictionResponse(**prediction)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Inference error: {str(exc)}"
        )
