"""
Risk Assessment ML Service - Main Application
FastAPI microservice for serving Alternative Risk Scoring predictions.
"""

import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.model.risk_model import RiskModel
from app.api.endpoints import router as internal_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load risk model artifacts into app state
    try:
        app.state.risk_model = RiskModel.load()
        print(f"[ML Service] Risk model '{app.state.risk_model.model_version}' loaded successfully.")
    except Exception as exc:
        print(f"[ML Service] Warning: Failed to load model artifacts on startup: {exc}")
        app.state.risk_model = None
    yield
    # Shutdown
    app.state.risk_model = None

app = FastAPI(
    title="Financial Risk Assessment ML Service",
    description="Internal ML inference microservice for Alternative Risk Scoring",
    version="1.0.0",
    lifespan=lifespan
)

# Root-level health probe
@app.get("/health")
def root_health():
    return {
        "status": "UP",
        "service": "risk-assessment-ml-service",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

# Root-level readiness probe for container orchestrators (ECS / Docker Compose)
@app.get("/ready")
def root_readiness():
    from fastapi import HTTPException, status
    risk_model = getattr(app.state, "risk_model", None)
    if risk_model is None or risk_model.model is None or risk_model.scaler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model artifacts are not loaded"
        )
    return {
        "status": "READY",
        "model_version": risk_model.model_version,
        "feature_set_version": risk_model.feature_set_version,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

# Mount internal inference router
app.include_router(internal_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
