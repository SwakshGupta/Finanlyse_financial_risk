import datetime
from fastapi import FastAPI

app = FastAPI(
    title="Financial Risk Assessment ML Service",
    description="Internal ML inference microservice for Alternative Risk Scoring",
    version="1.0.0"
)

@app.get("/health")
@app.get("/internal/v1/health")
def health_check():
    return {
        "status": "UP",
        "service": "risk-assessment-ml-service",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
