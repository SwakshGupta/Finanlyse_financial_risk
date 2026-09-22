# Finalyse Operation, Containerization & AWS Deployment Guide

This document defines the operational architecture, local containerization workflows, and AWS production deployment standards for the **Finalyse Financial Risk Assessment Platform**.

> [!NOTE]
> **Deployment Status for Submission:**
> - **Local Containerized Deployment (Phase 9)**: **COMPLETED & FULLY OPERATIONAL** (Docker Compose stack with PostgreSQL 16, Node.js 20 Backend API, and FastAPI ML Microservice with Model V2).
> - **AWS Cloud Deployment (Phase 10)**: **DEFERRED / NOT DEPLOYED** (Due to submission time constraints, live AWS provisioning in `ap-south-1` is deferred. The system is **NOT currently running on AWS**. All ECS task definitions, ECR workflows, RDS specifications, and `amplify.yml` build configurations are fully drafted and deployment-ready for future cloud rollouts).

---

## 1. System Architecture Overview

```
                      [ Client Browser / Mobile Web ]
                                    │
                         HTTPS (AWS Amplify Hosting)
                                    │
                                    ▼
                      [ React 18 / Vite SPA Frontend ]
                                    │
                         HTTPS (Port 443 -> 4000)
                                    │
                                    ▼
                 [ AWS Application Load Balancer (ALB) ]
                                    │
                                    ▼
              [ Amazon ECS / Fargate - finalyse-backend ]
                     (Node.js 20 Express API :4000)
                           │                │
          Private VPC HTTP │                │ Private VPC SQL
             (Port 8000)   │                │ (Port 5432)
                           ▼                ▼
     [ Amazon ECS / Fargate - ml-service ]  [ Amazon RDS PostgreSQL 16 ]
       (FastAPI + Model V2 :8000)             (finalyse_prod)
                           │
                           ▼
          [ Google Gemini 1.5/Flash-Lite API ]
             (Server-Side Explanations Only)
```

### Component Matrix

| Service | Runtime / Platform | Local Port | Cloud Target | Health Probe | Readiness Probe |
|---|---|---|---|---|---|
| **Frontend** | React 18, Vite | 3000 | AWS Amplify Hosting | `/` (HTTP 200) | SPA Route Resolution |
| **Backend** | Node.js 20, Express | 4000 | AWS ECS / Fargate | `GET /health` | `GET /ready` |
| **ML Microservice** | Python 3.11, FastAPI | 8000 | AWS ECS / Fargate | `GET /health` | `GET /ready` |
| **Database** | PostgreSQL 16 | 5432 (Host 5433) | AWS RDS for PostgreSQL | `pg_isready` | `SELECT 1` |
| **Container Registry** | Docker OCI Images | Local Daemon | Amazon ECR | Docker build | Digest verification |
| **Monitoring** | stdout / JSON | Local console | Amazon CloudWatch | Log stream | Group `/ecs/finalyse` |
| **Secrets** | `.env` (Dev only) | Local filesystem | AWS Secrets Manager | Local load | ECS task secret injection |

---

## 2. Local Containerization (Phase 9)

The platform is fully containerized and orchestrated locally with Docker Compose.

### Topology
* **Network**: `finalyse_finalyse-network` (bridge)
* **Storage**: `pgdata` (named volume for persistent PostgreSQL data)
* **Inter-container DNS**: Services communicate via Docker service names (`postgres:5432`, `ml-service:8000`), never host `localhost`.

### Quickstart

1. **Build Docker images**:
   ```bash
   docker compose build
   ```

2. **Start the stack in the background**:
   ```bash
   docker compose up -d
   ```

3. **Verify running containers and health checks**:
   ```bash
   docker compose ps
   ```
   Expected output:
   * `finalyse-postgres`: `Up (healthy)` on `0.0.0.0:5433->5432/tcp`
   * `finalyse-ml-service`: `Up (healthy)` on `0.0.0.0:8000->8000/tcp`
   * `finalyse-backend`: `Up (healthy)` on `0.0.0.0:4000->4000/tcp`

4. **Verify container health endpoints from host**:
   ```bash
   curl -s http://localhost:4000/health
   curl -s http://localhost:4000/ready
   curl -s http://localhost:8000/health
   curl -s http://localhost:8000/ready
   ```

5. **Start Frontend Dev Server against containerized backend**:
   ```bash
   npm --prefix frontend run dev
   ```
   Open `http://localhost:3000`. The Vite server automatically proxies `/api` and `/health` requests to containerized backend at `http://localhost:4000`.

6. **Tear down containers**:
   ```bash
   docker compose down
   # Or to purge database volume:
   docker compose down -v
   ```

---

## 3. Automated Verification Suites

Before deploying any changes to cloud environments, all test suites must pass:

### Backend Test Suite (Jest)
```bash
npm --prefix backend test -- --runInBand
```
* Coverage: Auth, Application Intake, Risk Assessment, LLM Explainability, What-If Counterfactuals, Conversational Assistant, Health/Readiness Probes.
* Result: **64 / 64 tests passing (100%)**.

### ML Service Test Suite (Pytest)
```bash
PYTHONPATH=ml-service pytest ml-service/tests -v
```
* Coverage: Root `/health` and `/ready`, internal endpoints `/internal/v1/health` and `/internal/v1/ready`, Model V2 inference (20 features), V1 backward compatibility, temporal feature calculation, feature catalog schema validation.
* Result: **18 / 18 tests passing (100%)**.

### Frontend Bundle Verification
```bash
npm --prefix frontend run build
```
* Compiles clean production distribution in `frontend/dist/`.

---

## 4. AWS Production Deployment Architecture (Phase 10 — Planned / Deployment-Ready)

> [!IMPORTANT]
> **Status: PLANNED / DEFERRED FOR THIS SUBMISSION**  
> Due to strict submission time constraints, live AWS cloud provisioning was intentionally halted. **The system is not currently running on AWS**. The task definitions, registry push scripts, RDS schemas, and Amplify configurations documented below are fully prepared, validated, and ready for deployment when cloud rollout commences.

### Target Configuration (ap-south-1 Mumbai)
* **AWS Region**: `ap-south-1` (Asia Pacific - Mumbai)
* **Architecture**: Serverless containerized microservices on AWS Fargate with managed RDS and Amplify Hosting.

---

### 4A. Amazon ECR (Container Registry)

Two private ECR repositories are designated for container images:
1. `finalyse-backend`
2. `finalyse-ml`

#### ECR Push Workflow:
```bash
# 1. Retrieve authenticated login password
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# 2. Tag local images
docker tag finalyse-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/finalyse-backend:v2.0.0
docker tag finalyse-ml-service:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/finalyse-ml:v2.0.0

# 3. Push to Amazon ECR
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/finalyse-backend:v2.0.0
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/finalyse-ml:v2.0.0
```

---

### 4B. Amazon RDS for PostgreSQL

* **Engine**: PostgreSQL 16.x
* **Instance Class**: `db.t4g.micro` (cost-optimized for prototype/hackathon)
* **Storage**: 20 GB gp3 (General Purpose SSD)
* **Networking**: Private Database Subnet Group (Multi-AZ optional for production, Single-AZ for prototype cost awareness).
* **Public Accessibility**: **NO** (`--no-publicly-accessible`). RDS is strictly accessible only from ECS tasks within the VPC.
* **Security Group (`sg-finalyse-rds`)**:
  * Ingress: Port 5432 from `sg-finalyse-backend` only.
  * Egress: None required.

---

### 4C. AWS Secrets Manager & Environment Variables

All sensitive credentials must be stored in AWS Secrets Manager under secret `prod/finalyse/secrets`. **Never commit or hardcode secrets in Git, Dockerfiles, or CI/CD scripts.**

#### Secret JSON Structure (`prod/finalyse/secrets`):
```json
{
  "DB_PASSWORD": "<generated-high-entropy-password>",
  "JWT_SECRET": "<generated-min-32-char-random-secret>",
  "ML_SERVICE_API_KEY": "<generated-internal-service-token>",
  "GEMINI_API_KEY": "<google-gemini-api-key>"
}
```

#### Backend Environment Mapping in ECS Task Definition:
* **Non-Sensitive Variables** (Direct environment values):
  * `NODE_ENV`: `production`
  * `PORT`: `4000`
  * `API_PREFIX`: `/api/v1`
  * `CORS_ORIGIN`: `https://main.<amplifyapp>.amplifyapp.com`
  * `DB_HOST`: `<rds-endpoint-address>`
  * `DB_PORT`: `5432`
  * `DB_NAME`: `finalyse_prod`
  * `DB_USER`: `finalyse_admin`
  * `ML_SERVICE_URL`: `http://finalyse-ml.local:8000` (via AWS Cloud Map Service Discovery or private ALB)
  * `LLM_PROVIDER`: `gemini`
  * `LLM_MODEL`: `gemini-3.1-flash-lite`
  * `PROMPT_VERSION`: `risk-explanation-v1`
* **Sensitive Secrets** (`valueFrom` Secrets Manager ARN):
  * `DB_PASSWORD`: `arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:DB_PASSWORD::`
  * `JWT_SECRET`: `arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:JWT_SECRET::`
  * `ML_SERVICE_API_KEY`: `arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:ML_SERVICE_API_KEY::`
  * `GEMINI_API_KEY`: `arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:GEMINI_API_KEY::`

#### ML Service Environment Mapping in ECS Task Definition:
* **Non-Sensitive Variables**:
  * `PORT`: `8000`
  * `ENVIRONMENT`: `production`
  * `ACTIVE_MODEL_VERSION`: `logistic_regression_v2.0.0`
  * `FEATURE_SET_VERSION`: `feature_set_v2`
* **Sensitive Secrets**:
  * `ML_SERVICE_API_KEY`: `arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:ML_SERVICE_API_KEY::`

---

### 4D. ECS Fargate Task Definitions

#### Backend Task Definition (`ecs-backend-task.json`):
```json
{
  "family": "finalyse-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/finalyseBackendTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/finalyse-backend:v2.0.0",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 4000,
          "hostPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "4000" },
        { "name": "API_PREFIX", "value": "/api/v1" },
        { "name": "CORS_ORIGIN", "value": "https://main.<amplifyapp>.amplifyapp.com" },
        { "name": "DB_HOST", "value": "<rds-endpoint>" },
        { "name": "DB_PORT", "value": "5432" },
        { "name": "DB_NAME", "value": "finalyse_prod" },
        { "name": "DB_USER", "value": "finalyse_admin" },
        { "name": "ML_SERVICE_URL", "value": "http://finalyse-ml.local:8000" },
        { "name": "LLM_PROVIDER", "value": "gemini" },
        { "name": "LLM_MODEL", "value": "gemini-3.1-flash-lite" },
        { "name": "PROMPT_VERSION", "value": "risk-explanation-v1" }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:DB_PASSWORD::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:JWT_SECRET::"
        },
        {
          "name": "ML_SERVICE_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:ML_SERVICE_API_KEY::"
        },
        {
          "name": "GEMINI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:GEMINI_API_KEY::"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 15
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/finalyse-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### ML Microservice Task Definition (`ecs-ml-task.json`):
```json
{
  "family": "finalyse-ml",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/finalyseMLTaskRole",
  "containerDefinitions": [
    {
      "name": "ml-service",
      "image": "<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/finalyse-ml:v2.0.0",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "PORT", "value": "8000" },
        { "name": "ENVIRONMENT", "value": "production" },
        { "name": "ACTIVE_MODEL_VERSION", "value": "logistic_regression_v2.0.0" },
        { "name": "FEATURE_SET_VERSION", "value": "feature_set_v2" }
      ],
      "secrets": [
        {
          "name": "ML_SERVICE_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:<ACCOUNT_ID>:secret:prod/finalyse/secrets:ML_SERVICE_API_KEY::"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 15
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/finalyse-ml",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ml"
        }
      }
    }
  ]
}
```

---

### 4E. AWS Amplify Hosting (Frontend)

* **Repository**: `https://github.com/SwakshGupta/Finanlyse_financial_risk.git`
* **Branch**: `main`
* **Build Specification**: `amplify.yml` (located at repository root)
* **Framework**: React / Vite (Single-Page Application)
* **Public Environment Variables**:
  * `VITE_API_BASE_URL`: `https://api.finalyse.yourdomain.com` (pointing to the public ALB HTTPS endpoint)
* **Security Check**: Verify that no server secrets (`GEMINI_API_KEY`, `JWT_SECRET`, database passwords) are injected into the Amplify console or client bundle.

#### Amplify SPA Redirect Rule
In AWS Amplify Console -> App Settings -> Rewrites and redirects:
* Source address: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
* Target address: `/index.html`
* Type: `200 (Rewrite)`

---

## 5. Security & Cost Awareness

### Security Guardrails
1. **No Root Users**: Docker containers run as unprivileged users (`node` UID 1000 in backend, `appuser` UID 1001 in ml-service).
2. **Private Network Boundaries**: The ML microservice and PostgreSQL database reside in private subnets with no internet ingress. Only the backend API is routed via the public HTTPS Application Load Balancer.
3. **Restricted CORS**: The production backend allows only the verified Amplify frontend origin (`https://<app-id>.amplifyapp.com`), disallowing wildcard `*` origins.
4. **Least-Privilege IAM**: ECS task execution roles grant access only to read designated Secrets Manager ARNs and write to CloudWatch log groups.

### Cost Control for Prototype / Hackathon
* ECS Fargate tasks sized to minimal footprints (0.25 vCPU / 512 MB for Node, 0.5 vCPU / 1024 MB for ML).
* RDS configured on `db.t4g.micro` with 20 GB storage.
* CloudWatch log retention explicitly configured to 7 days to eliminate indefinite storage accumulation.
* Service discovery via AWS Cloud Map or internal private ALB avoids expensive NAT Gateways for internal service-to-service routing.

---

## 6. Disclaimers & Responsible AI Standards

1. **Alternative Risk Score**: The score produced by this platform is an Alternative Risk Score for thin-file financial inclusion, not a commercial bureau credit score (such as CIBIL).
2. **Synthetic Data**: Demonstration profiles utilize synthetic financial scenarios for reproducibility; synthetic performance does not represent audited real-world underwriting validation.
3. **Human-in-the-Loop**: The platform provides risk intelligence and counterfactual simulation for credit analysts, not autonomous loan approval or rejection.
