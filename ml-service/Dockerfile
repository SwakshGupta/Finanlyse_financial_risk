# ==============================================================================
# Finalyse ML Microservice - Production Dockerfile
# Python 3.11 Slim with Non-root Security & Preloaded Serialized Models
# ==============================================================================

FROM python:3.11-slim AS runner

WORKDIR /app

# Install curl for healthchecks and clean cache
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root application user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app

# Copy application code and serialized model artifacts (V2 & V1)
COPY app/ ./app/
COPY artifacts/ ./artifacts/

# Set environment
ENV PYTHONPATH=/app
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Switch to non-root user
USER appuser

EXPOSE 8000

# Health probe for container orchestrator
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
