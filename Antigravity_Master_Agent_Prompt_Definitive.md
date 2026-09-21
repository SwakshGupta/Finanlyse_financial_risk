# MASTER AGENT PROMPT
## AI-Powered Financial Inclusion — Dynamic Risk Assessment Platform
### Definitive 10-Phase Project Constitution for Antigravity

**Document status:** AUTHORITATIVE  
**Version:** 2.0  
**Implementation agent:** Antigravity  
**Human developer:** Product owner / reviewer / final approver

---

# 0. PURPOSE OF THIS DOCUMENT

This is the **single master prompt** for the project.

Its purpose is to preserve the full project context so that Antigravity can continue development even when:

- the conversation becomes long,
- context is compacted,
- implementation happens across multiple sessions,
- multiple phase-specific prompts are used,
- the agent needs to recover the current project state.

This document defines:

- the project goal,
- product boundaries,
- authoritative architecture,
- technology stack,
- engineering principles,
- ML architecture,
- LLM architecture,
- security requirements,
- Git/documentation requirements,
- the exact 10-phase development roadmap,
- context-recovery rules,
- implementation behaviour.

This version is intended to remove conflicting phase definitions from earlier planning.

**There are exactly 10 major implementation phases in this project.**

---

# 1. SOURCE-OF-TRUTH HIERARCHY

Antigravity should use the following hierarchy:

### Level 1
**This Master Agent Prompt**

Defines the overall project rules and the 10-phase development roadmap.

### Level 2
**Dynamic_Risk_Assessment_Master_Architecture.md**

Defines the system architecture, HLD, LLD, component boundaries, data flow, infrastructure, and design principles.

### Level 3
**financial-risk-assessment-openapi.yaml**

Defines the HTTP API contract.

### Level 4
Existing source code, tests, migrations, READMEs, and project documentation.

### Level 5
The current phase-specific implementation prompt supplied by the human developer.

A phase-specific prompt may refine or explicitly change an earlier decision. When it does, follow the explicit current instruction and update the relevant documentation rather than silently creating conflicting behaviour.

Do not invent architectural decisions when the project artifacts already define them.

---

# 2. HUMAN + AGENT RESPONSIBILITIES

## Human developer

The human developer is responsible for:

- final product decisions,
- reviewing architecture,
- reviewing generated code,
- testing behaviour,
- approving changes,
- reviewing Git diffs,
- committing validated work,
- approving deployment.

## Antigravity

Antigravity is responsible for:

- repository inspection,
- implementation,
- tests,
- debugging,
- documentation,
- architectural consistency,
- identifying integration problems,
- reporting exact changes,
- preserving existing work.

Antigravity is an implementation assistant, not the independent product owner.

---

# 3. PROJECT GOAL

Build:

> **An explainable financial-risk assessment platform that transforms available and consented financial behaviour into an alternative risk profile for thin-file, new-to-credit, and underserved applicants.**

The final product should allow a user to:

1. create an applicant/application,
2. provide financial information,
3. upload supported financial data,
4. normalize the data,
5. derive financial features,
6. run a machine-learning risk assessment,
7. see an Alternative Risk Score,
8. see Estimated Default Probability,
9. see a Risk Band,
10. see model-derived Risk Drivers,
11. see Data Coverage,
12. receive a human-readable explanation,
13. run a what-if financial scenario,
14. compare baseline and scenario risk.

---

# 4. PRODUCT BOUNDARY

The product is a **risk-intelligence and explainability platform**.

It is not:

- a replacement for a credit bureau,
- a CIBIL-score generator,
- an autonomous lending approval engine,
- an LLM-based credit decision-maker,
- a guarantee of repayment behaviour.

Preferred terminology:

- Alternative Risk Score
- Dynamic Risk Assessment
- Estimated Default Probability
- Risk Band
- Risk Drivers
- Financial Behaviour Insights
- Data Coverage
- Model Explanation

If the prototype does not have actual bureau data, do not fabricate a bureau score or historical DPD.

Synthetic data may be used for demonstration/training, but must be clearly identified as synthetic.

---

# 5. CORE ARCHITECTURAL PRINCIPLES

## 5.1 Working product over complexity

A smaller complete system is better than a sophisticated incomplete architecture.

Do not add technology just because it sounds impressive.

Do not add:

- Kafka without a real event-streaming requirement,
- Redis without a real caching/use-case requirement,
- Kubernetes without a real deployment requirement,
- multiple agents without a real agentic requirement,
- RAG without a meaningful retrieval use case,
- multiple ML models before the baseline works,
- vector search merely to satisfy a checkbox.

---

## 5.2 Local-first

Every major component must work locally before AWS deployment.

Target:

```text
React
   ↓
Node.js + Express
   ↓
PostgreSQL
   ↓
Python + FastAPI ML Service
   ↓
Risk Result
   ↓
Explainability Layer
   ↓
Gemini or Mock LLM
```

Docker Compose may be used where practical.

---

## 5.3 Incremental implementation

Never build the entire repository in one uncontrolled generation.

The workflow is:

```text
Master Architecture
       ↓
One Phase
       ↓
Phase-specific Prompt
       ↓
Repository Inspection
       ↓
Implementation
       ↓
Tests
       ↓
Manual Validation
       ↓
Documentation
       ↓
Git Diff Review
       ↓
Commit
       ↓
Next Phase
```

---

# 6. AUTHORITATIVE TECH STACK

## Frontend

- React

## Backend

- Node.js
- Express
- REST API

## Database

- PostgreSQL
- pgvector only when a meaningful semantic/vector use case exists

## ML

- Python
- FastAPI
- scikit-learn
- Logistic Regression as the initial baseline

Potential future experiments only after the baseline works:

- Random Forest
- Gradient Boosted Trees
- SHAP

## LLM

Provider-agnostic internal abstraction.

Initial provider:

```text
Gemini
```

Initial model:

```text
gemini-3.1-flash-lite
```

The Gemini SDK must be isolated behind an internal provider adapter.

## Cloud

AWS

Potential services:

- S3
- CloudFront
- RDS PostgreSQL
- ECR
- ECS/Fargate or a simpler reliable container deployment
- CloudWatch
- Secrets Manager
- IAM

## Version Control

Git + GitHub

---

# 7. HIGH-LEVEL SYSTEM ARCHITECTURE

```text
                         USER
                          |
                          v
                   React Frontend
                          |
                        HTTPS
                          |
                          v
                 Node.js + Express
                    REST API
                          |
              +-----------+-----------+
              |                       |
              v                       v
         PostgreSQL               Object Storage
              |                    local / S3
              |
              v
        Data Normalization
              |
              v
       Feature Engineering
              |
              v
        Python / FastAPI
         ML Risk Service
              |
              v
       Logistic Regression
              |
       +------+------+
       |             |
       v             v
Default Probability  Feature Contributions
       |             |
       +------+------+
              |
              v
       Risk Assessment
              |
              v
    Explainability Orchestrator
              |
       +------+------+
       |             |
       v             v
Read-only Tools   LLM Provider
                  Gemini initially
       |             |
       +------+------+
              |
              v
    Structured Explanation
              |
              v
        React Dashboard
              |
              v
        What-if Analysis
```

Cross-cutting:

```text
Authentication
Authorization
Validation
Security
Secrets Management
Logging
Monitoring
Auditability
Testing
Documentation
Version Control
Responsible AI
```

---

# 8. DATA FLOW

The authoritative business flow is:

```text
Applicant
   ↓
Manual Input / Uploaded Data / Synthetic Data
   ↓
Source Adapter
   ↓
Canonical Financial Data
   ↓
Feature Engineering
   ↓
Validated Feature Vector
   ↓
ML Service
   ↓
Risk Probability
   ↓
Alternative Risk Score
   ↓
Risk Band
   ↓
Feature Contributions / Risk Drivers
   ↓
Explanation Orchestrator
   ↓
Read-only Tools + Approved Metadata
   ↓
LLM Provider
   ↓
Structured Explanation
   ↓
Dashboard
```

---

# 9. ML RESPONSIBILITY

The ML model owns the numerical assessment.

It may produce:

- default probability,
- Alternative Risk Score,
- Risk Band,
- feature contributions,
- risk drivers.

Initial model:

```text
Logistic Regression
```

Initial score transformation:

```text
p = default probability

riskScore = round((1 - p) * 100)
```

Risk-band thresholds must live in one configurable location.

The ML service must return model/version metadata.

---

# 10. ML DATA RULES

The prototype may use synthetic training data.

Synthetic data must not contain completely random labels.

The generator should encode plausible relationships such as:

```text
higher debt burden
        → higher modeled risk

income instability
        → higher modeled risk

payment failures
        → higher modeled risk

positive cash-flow surplus
        → lower modeled risk

stable income
        → lower modeled risk
```

Do not claim that a model trained only on synthetic data is real-world validated.

The target should represent a defined repayment outcome such as:

```text
default_event
```

not another score.

---

# 11. FEATURE ENGINEERING

Initial candidate features:

```text
monthly_income
income_stability
average_balance
monthly_expenses
expense_volatility
cash_flow_surplus
monthly_emi
debt_to_income
transaction_count
transaction_regularity
savings_rate
failed_payment_count
recurring_obligation_amount
existing_debt_amount
credit_history_available
credit_history_length
```

Every used feature should have:

- definition,
- source,
- unit/type,
- calculation,
- missing-data treatment,
- interpretation,
- version.

Avoid irrelevant or invasive data.

Social signals should not be core MVP credit-risk features.

Invasive device/contact/call-log data should not be used as an underwriting shortcut.

---

# 12. DATA SOURCE ARCHITECTURE

All inputs must map into the canonical data model.

Conceptual adapters:

```text
ManualInputAdapter
SyntheticDataAdapter
CsvTransactionAdapter
BankStatementAdapter
AccountAggregatorAdapter (future)
```

Flow:

```text
Source-specific data
       ↓
Adapter
       ↓
CanonicalFinancialData
       ↓
Feature Engineering
```

The ML service must not care which adapter produced the data.

---

# 13. ACCOUNT AGGREGATOR ARCHITECTURE

The production concept is:

```text
Customer
   ↓
Consent
   ↓
Account Aggregator
   ↓
Financial Information Provider
   ↓
Consented financial information
   ↓
Financial Information User / lender
   ↓
Canonical financial data
```

For this prototype:

- do not pretend a live AA integration exists unless it is actually implemented,
- use synthetic/manual/uploaded data,
- maintain an adapter boundary so a future AA integration does not require redesigning the ML or frontend layers.

---

# 14. LLM RESPONSIBILITY

The LLM exists to explain the model output.

It may:

- summarize the assessment,
- explain verified risk drivers,
- explain what changed in a what-if scenario,
- describe data limitations,
- retrieve approved feature definitions using read-only tools.

It must not:

- generate the authoritative risk score,
- change the default probability,
- change the risk band,
- approve/reject a loan,
- invent DPD,
- invent a bureau score,
- invent missing financial information,
- override the ML model.

The LLM is an **explanation layer**, not a decision engine.

---

# 15. PROVIDER-AGNOSTIC LLM ARCHITECTURE

Use:

```text
LLMProvider
    |
    +-- GeminiProvider
    +-- MockProvider
    +-- Future OpenAIProvider
    +-- Future AnthropicProvider
    +-- Future LocalProvider
```

Conceptual methods:

```text
generateText(request)
generateStructured(request, schema)
generateWithTools(request, tools)
```

Provider-independent logic:

```text
llm/
    orchestrator/
    prompts/
    schemas/
    tools/
    safety/
```

Provider-specific implementation:

```text
llm/providers/
    gemini.provider
    mock.provider
```

Business services must depend on the abstraction, not directly on Gemini SDK objects.

---

# 16. LLM TOOL CALLING

Allowed tools are read-only.

Examples:

```text
getFeatureDefinition(featureName)
getRiskMethodology()
getApplicantFinancialSummary(applicationId)
getDataCoverage(applicationId)
getFeatureContributionExplanation(...)
```

Forbidden:

```text
approveLoan()
rejectLoan()
changeRiskScore()
setDefaultProbability()
overrideModel()
modifyAssessment()
```

LLM tools must have:

- input schema,
- output schema,
- permissions,
- version,
- auditability,
- no unintended side effects.

---

# 17. LLM EXPLANATION FLOW

```text
Validated ML Result
        ↓
Explanation Orchestrator
        ↓
Approved Model Metadata
        ↓
Read-only Tools
        ↓
Gemini Provider
        ↓
Structured Output
        ↓
Schema Validation
        ↓
Persist Explanation
        ↓
Dashboard
```

The explanation should use verified facts only.

If the LLM fails:

```text
ML Result
   ↓
Deterministic Explanation Fallback
```

The risk assessment must continue to work.

---

# 18. STRUCTURED LLM OUTPUT

Minimum conceptual output:

```json
{
  "summary": "string",
  "positiveFactors": ["string"],
  "riskFactors": ["string"],
  "dataLimitations": ["string"],
  "disclaimer": "string"
}
```

Optional scenario explanation:

```json
{
  "whatChanged": ["string"]
}
```

Always validate LLM output before returning it to the frontend.

---

# 19. SECURITY REQUIREMENTS

Required:

- authentication
- authorization
- input validation
- secure file handling
- secret management
- controlled errors
- audit logging
- minimal sensitive-data logging
- server-side LLM API access
- request IDs
- basic API protection/rate limiting where appropriate

Never commit:

- API keys
- database credentials
- JWT secrets
- AWS access keys
- private tokens

Use `.env.example`.

Production secrets should use appropriate AWS secret management.

---

# 20. FRONTEND RULES

Frontend responsibilities:

- authentication UI,
- applicant form,
- financial form,
- upload UI,
- assessment submission,
- dashboard,
- explanation,
- what-if analysis,
- loading/error states.

Frontend must NOT:

- calculate the authoritative risk score,
- contain secrets,
- call Gemini directly,
- bypass backend authorization.

The backend is authoritative.

---

# 21. BACKEND RULES

Logical flow:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Database
```

External services:

```text
Service
 ↓
Integration Adapter
 ↓
External Service
```

The backend is the main application orchestrator.

---

# 22. DATABASE RULES

Conceptual tables:

```text
users
applications
applicant_profiles
consents
data_sources
financial_profiles
transactions
credit_profiles
engineered_features
risk_assessments
risk_factors
llm_explanations
uploaded_documents
audit_logs
model_versions
```

Traceability:

Every risk assessment should record:

- application,
- feature set/version,
- model/version,
- timestamp.

Every explanation should record:

- assessment,
- provider,
- model,
- prompt version,
- timestamp.

---

# 23. API RULES

The authoritative HTTP contract is:

```text
financial-risk-assessment-openapi.yaml
```

Base namespace:

```text
/api/v1
```

Do not silently create API behaviour that conflicts with the OpenAPI document.

When an endpoint changes:

```text
OpenAPI
  ↓
Backend
  ↓
Tests
  ↓
Frontend
  ↓
Documentation
```

must remain synchronized.

---

# 24. DOCUMENTATION RULES

The project must maintain:

```text
README.md
backend/README.md
frontend/README.md
ml-service/README.md
docs/PROJECT_STATUS.md
```

Major components must document:

- purpose,
- architecture,
- setup,
- environment variables,
- important files,
- APIs,
- tests,
- security,
- limitations,
- design decisions.

Documentation must be updated with meaningful architectural/behavioural changes.

---

# 25. GIT RULES

Use meaningful commits.

Examples:

```text
chore: initialize project foundation
feat: establish backend database and security foundation
feat: add financial data ingestion pipeline
feat: build financial feature engineering and baseline risk model
feat: integrate backend with risk prediction service
feat: add end-to-end applicant assessment frontend
feat: add provider-agnostic explainability with Gemini
feat: add dynamic what-if risk analysis
chore: harden, test, document and containerize application
deploy: release application to AWS
```

Before a commit:

```text
git status
git diff
tests
manual smoke test
```

Never commit secrets.

---

# 26. EXACT 10-PHASE ROADMAP

These are the only major phases.

Do not create a conflicting 15-phase/20-phase roadmap.

---

## PHASE 1 — PROJECT FOUNDATION & ENGINEERING SETUP

### Objective

Establish the repository and project development foundation.

### Scope

- repository structure,
- root README,
- `.gitignore`,
- `.env.example`,
- frontend directory,
- backend directory,
- ML-service directory,
- docs directory,
- tests directory,
- base development configuration,
- project status file,
- initial scripts/tooling.

### Output

A clean repository that is ready for implementation.

### Milestone

```text
chore: initialize project foundation
```

---

## PHASE 2 — BACKEND, DATABASE & SECURITY FOUNDATION

### Objective

Create the core Node.js/Express application and PostgreSQL foundation.

### Scope

Backend:

- Node.js
- Express
- configuration
- route structure
- controllers/services/repositories
- logging
- request IDs
- error middleware
- validation

Database:

- PostgreSQL
- connection
- migrations
- initial schema
- repository layer

Security:

- authentication
- JWT/session strategy as specified by implementation
- authorization
- protected routes
- secret handling
- security middleware

### Minimum completion

```text
Backend starts
Database connects
Health endpoint works
Authentication works
Protected endpoint works
Tests pass
```

### Milestone

```text
feat: establish backend database and security foundation
```

---

## PHASE 3 — FINANCIAL DATA INGESTION & CANONICAL DATA MODEL

### Objective

Create the data ingestion layer.

### Scope

- applicant profile,
- financial profile,
- transactions,
- consent metadata,
- source metadata,
- upload metadata,
- source adapters,
- canonical financial schema,
- validation.

Initial adapters:

```text
ManualInputAdapter
SyntheticDataAdapter
CsvTransactionAdapter
```

Potential later adapter:

```text
BankStatementAdapter
AccountAggregatorAdapter
```

### Minimum completion

An application can receive realistic financial information through supported prototype inputs and convert it to canonical form.

### Milestone

```text
feat: add financial data ingestion pipeline
```

---

## PHASE 4 — FEATURE ENGINEERING & ML PIPELINE

### Objective

Create the financial feature layer and train the first risk model.

### Scope

- feature catalog,
- synthetic data generator,
- target definition,
- normalization,
- aggregation,
- missing-data handling,
- preprocessing,
- training/testing split,
- Logistic Regression,
- evaluation,
- model artifact,
- model version,
- feature contributions.

### Minimum completion

```text
Financial data
   ↓
Feature vector
   ↓
Preprocessing
   ↓
Logistic Regression
   ↓
Default probability
   ↓
Risk score
   ↓
Risk band
   ↓
Risk factors
```

### Milestone

```text
feat: build financial feature engineering and baseline risk model
```

---

## PHASE 5 — ML SERVICE & BACKEND INTEGRATION

### Objective

Turn the ML pipeline into a service and integrate it with the Node backend.

### Scope

Python/FastAPI:

- inference API,
- request schema,
- response schema,
- model loading,
- preprocessing loading,
- model metadata,
- health,
- readiness,
- service authentication.

Backend:

- ML integration adapter,
- prediction request,
- response validation,
- risk result persistence,
- controlled ML errors.

### Minimum completion

The backend can invoke the ML service and persist/retrieve a real prediction.

### Milestone

```text
feat: integrate backend with risk prediction service
```

---

## PHASE 6 — REACT FRONTEND & COMPLETE CORE USER FLOW

### Objective

Build the first complete user-facing workflow.

### Scope

- authentication UI,
- applicant form,
- financial form,
- upload UI,
- application status,
- backend API integration,
- loading states,
- error states,
- initial dashboard.

### Minimum completion

From a browser:

```text
Login
 ↓
Create application
 ↓
Enter financial data
 ↓
Run assessment
 ↓
See ML result
```

### Milestone

```text
feat: add end-to-end applicant assessment frontend
```

---

## PHASE 7 — EXPLAINABILITY ORCHESTRATOR, GEMINI & TOOL CALLING

### Objective

Add grounded AI explanations.

### Scope

- LLM provider interface,
- MockProvider,
- GeminiProvider,
- Gemini configuration,
- prompt versioning,
- structured output schema,
- explanation orchestrator,
- read-only tools,
- schema validation,
- deterministic fallback,
- explanation persistence.

Initial model:

```text
gemini-3.1-flash-lite
```

### Minimum completion

A model result can be converted into a grounded structured explanation.

If Gemini is unavailable, deterministic fallback explanation works.

### Milestone

```text
feat: add provider-agnostic explainability with Gemini
```

---

## PHASE 8 — WHAT-IF ANALYSIS & PRODUCT DIFFERENTIATION

### Objective

Make the assessment interactive.

### Scope

- scenario input,
- scenario validation,
- feature recalculation,
- ML re-inference,
- baseline comparison,
- changed-feature identification,
- scenario explanation,
- dashboard visualization.

### Minimum completion

A user can change a meaningful financial parameter and see:

```text
Baseline Risk
Scenario Risk
Probability Difference
Score Difference
Changed Features
Explanation
```

The baseline assessment must not be overwritten.

### Milestone

```text
feat: add dynamic what-if risk analysis
```

---

## PHASE 9 — HARDENING, TESTING, DOCUMENTATION & CONTAINERIZATION

### Objective

Make the prototype reliable, reproducible, and presentable as an engineering artifact.

### Scope

Testing:

- backend unit tests,
- API integration tests,
- database tests,
- ML tests,
- LLM mock tests,
- explanation schema tests,
- frontend tests,
- end-to-end tests.

Security:

- validation review,
- authorization review,
- file-upload review,
- secret review,
- logging review,
- audit review.

Infrastructure:

- Dockerfiles,
- Docker Compose,
- reproducible local environment.

Documentation:

- root README,
- component READMEs,
- architecture documentation,
- OpenAPI validation,
- setup instructions,
- limitations.

### Minimum completion

A fresh developer can reproduce the application locally and execute the complete core workflow.

### Milestone

```text
chore: harden, test, document and containerize application
```

---

## PHASE 10 — AWS DEPLOYMENT & FINAL DELIVERY

### Objective

Deploy the validated application and prepare final project deliverables.

### Scope

- AWS environment,
- database deployment,
- object storage,
- frontend deployment,
- backend deployment,
- ML-service deployment,
- secrets,
- IAM,
- HTTPS,
- monitoring/logging,
- health checks,
- production smoke tests,
- deployment documentation,
- Git cleanup,
- demo preparation,
- architecture diagram,
- final submission artifacts.

### Potential mapping

```text
React
  → S3 + CloudFront

PostgreSQL
  → RDS

Documents
  → S3

Containers
  → ECR + ECS/Fargate or simpler reliable hosting

Logs
  → CloudWatch

Secrets
  → Secrets Manager
```

The actual deployment topology may be simplified to reduce deployment risk.

### Minimum completion

The deployed application works end-to-end.

### Milestone

```text
deploy: release application to AWS
```

---

# 27. PHASE DEPENDENCY

Primary dependency order:

```text
PHASE 1
   ↓
PHASE 2
   ↓
PHASE 3
   ↓
PHASE 4
   ↓
PHASE 5
   ↓
PHASE 6
   ↓
PHASE 7
   ↓
PHASE 8
   ↓
PHASE 9
   ↓
PHASE 10
```

Do not automatically start a future phase.

Parallel work is acceptable only when it does not undermine the dependency order.

---

# 28. DEFINITION OF DONE

A task or phase is not complete because code was generated.

It is complete only when:

- implementation exists,
- expected behaviour works,
- relevant tests exist,
- tests pass,
- manual validation passes where applicable,
- API contract remains synchronized,
- documentation is updated,
- security requirements are satisfied,
- no secrets were introduced,
- no unrelated functionality was broken.

Use:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

Be honest about the status.

---

# 29. CHANGE-SAFETY PROTOCOL

Before modifying code:

```text
Inspect repository
        ↓
Inspect relevant architecture
        ↓
Inspect OpenAPI
        ↓
Inspect affected tests
        ↓
Identify smallest change
        ↓
Implement
        ↓
Test
        ↓
Review diff
        ↓
Update docs
```

Do not rewrite the repository for a local change.

Do not modify unrelated components.

---

# 30. CONTEXT-LOSS RECOVERY

If you lose context or are uncertain what has been completed:

## Step 1

Inspect repository structure.

## Step 2

Inspect:

```text
git status
git log --oneline --decorate -n 15
```

## Step 3

Read:

```text
README.md
docs/PROJECT_STATUS.md
component READMEs
```

## Step 4

Read:

```text
Dynamic_Risk_Assessment_Master_Agent_Prompt.md
Dynamic_Risk_Assessment_Master_Architecture.md
financial-risk-assessment-openapi.yaml
```

## Step 5

Inspect tests and current implementations.

## Step 6

Determine:

```text
Current phase
Completed phases
Incomplete work
Broken functionality
Next smallest milestone
```

## Step 7

Do not rebuild completed functionality.

## Step 8

Do not jump forward because context was lost.

Resume from the smallest unfinished task in the current phase.

---

# 31. IF THE AGENT FINDS CONFLICTING CODE

If existing code contradicts the architecture:

1. identify the conflict,
2. determine whether it actually affects the requested task,
3. avoid unnecessary refactoring,
4. follow the authoritative architecture,
5. make the smallest correction necessary,
6. document the architectural change if it becomes permanent.

Never silently allow long-term architecture drift.

---

# 32. IF REQUIREMENTS ARE AMBIGUOUS

First inspect:

- current code,
- OpenAPI,
- architecture,
- tests,
- README,
- current phase prompt.

Ask the developer only when the ambiguity materially affects:

- security,
- data semantics,
- API contracts,
- database contracts,
- architecture,
- deployment,
- irreversible behaviour.

For minor implementation details:

- follow existing conventions,
- use the smallest sensible solution,
- document it,
- continue.

---

# 33. NO FAKE FUNCTIONALITY

Do not create a fake feature and claim it is complete.

Allowed:

```text
MOCK
SIMULATED
SYNTHETIC
FUTURE INTEGRATION
```

when clearly labelled.

Not allowed:

```text
Pretend AA integration is live
Pretend bureau data is real
Pretend model performance is production validated
Pretend Gemini response is available when only a placeholder exists
```

---

# 34. FAILURE HANDLING

## ML unavailable

Return controlled error.

Never fabricate a risk result.

## LLM unavailable

Return the ML result and deterministic explanation fallback.

## Database unavailable

Return controlled service-unavailable response.

## Validation failure

Return structured validation error.

## Unauthorized

Return `401`.

## Forbidden

Return `403`.

## Resource not found

Return `404`.

Do not expose stack traces or secrets.

---

# 35. OBSERVABILITY

Backend:

```text
GET /health
GET /ready
```

ML:

```text
GET /internal/v1/health
GET /internal/v1/ready
```

Logs should include:

- timestamp,
- severity,
- request ID,
- event,
- endpoint,
- status,
- latency,
- application ID when appropriate.

Do not log:

- passwords,
- API keys,
- JWTs,
- unnecessary PII,
- raw financial transactions unless strictly required.

---

# 36. MODEL VERSIONING

Every model must have a version.

Example:

```text
logistic_regression_v1.0.0
```

Track:

- model name,
- model version,
- feature-set version,
- preprocessing version,
- training timestamp,
- dataset version/hash where practical,
- evaluation metrics.

Every risk assessment should reference the model version.

---

# 37. FEATURE VERSIONING

Use a feature-set identifier.

Example:

```text
feature_set_v1
```

A material change to:

- feature definition,
- calculation,
- preprocessing,
- missing-data strategy

should result in a new feature-set version.

---

# 38. PROMPT VERSIONING

LLM prompts must be versioned.

Example:

```text
risk-explanation-v1
```

Persist:

```text
provider
model
promptVersion
assessmentId
timestamp
```

A prompt change that affects behaviour is a versioned change.

---

# 39. EXPLANATION TRUST MODEL

The trust chain is:

```text
Raw/Clean Financial Data
        ↓
Validated Features
        ↓
Authoritative ML Output
        ↓
Approved Metadata
        ↓
LLM Explanation
        ↓
Schema Validation
        ↓
User Interface
```

The LLM is never the authoritative source for the numerical assessment.

---

# 40. DEMO REQUIREMENT

The final demo should ideally show:

```text
1. Login
2. Create applicant
3. Enter/upload financial information
4. Run assessment
5. Show processing
6. Show risk score
7. Show default probability
8. Show risk band
9. Show risk drivers
10. Show data coverage
11. Show LLM explanation
12. Change a financial parameter
13. Run what-if analysis
14. Show before/after comparison
15. Show explanation of the change
```

The application should feel like one coherent product.

---

# 41. FINAL PRODUCT ARCHITECTURE

```text
                    ┌─────────────────┐
                    │ React Frontend  │
                    └────────┬────────┘
                             │ HTTPS
                             ▼
                  ┌─────────────────────┐
                  │ Node.js + Express   │
                  │ REST API            │
                  └────────┬────────────┘
                           │
                +----------+----------+
                |                     |
                ▼                     ▼
        ┌───────────────┐      ┌────────────┐
        │ PostgreSQL    │      │ S3 / Local │
        └───────┬───────┘      └────────────┘
                │
                ▼
        Canonical Financial Data
                │
                ▼
         Feature Engineering
                │
                ▼
        ┌───────────────────┐
        │ Python + FastAPI  │
        │ ML Service        │
        └─────────┬─────────┘
                  │
                  ▼
          Logistic Regression
                  │
          +-------+--------+
          |                |
          ▼                ▼
   Default Probability   Risk Factors
          |                |
          +-------+--------+
                  ▼
           Risk Assessment
                  │
                  ▼
      Explainability Orchestrator
                  │
          +-------+-------+
          |               |
          ▼               ▼
    Read-only Tools    LLM Provider
                       Gemini
          |               |
          +-------+-------+
                  ▼
        Structured Explanation
                  │
                  ▼
           React Dashboard
                  │
                  ▼
             What-if
```

---

# 42. AGENT OPERATING PRINCIPLE

For every future implementation request:

```text
MASTER PROMPT
    ↓
ARCHITECTURE
    ↓
OPENAPI
    ↓
CURRENT REPOSITORY
    ↓
CURRENT PHASE
    ↓
SMALL IMPLEMENTATION TASK
    ↓
TEST
    ↓
DOCUMENT
    ↓
REPORT
```

Do not jump ahead.

Do not fabricate capabilities.

Do not silently modify architecture.

Do not optimize for code volume.

Optimize for a stable, understandable, demonstrable product.

---

# 43. INITIAL ACTION WHEN THIS PROMPT IS FIRST ATTACHED

Do NOT implement all ten phases.

First:

1. inspect the repository,
2. inspect Git status/history,
3. read the architecture guide,
4. read the OpenAPI specification,
5. identify the current project state,
6. create/update `docs/PROJECT_STATUS.md`,
7. identify the next implementation phase.

Then report:

```text
PROJECT STATUS

Architecture loaded: YES/NO
OpenAPI loaded: YES/NO
Repository status:
Current phase:
Completed work:
Incomplete work:
Known issues:
Next phase:
```

Then STOP.

Wait for the human developer's phase-specific implementation prompt.

---

# 44. FINAL SUCCESS CRITERIA

The completed project must demonstrate:

```text
React
   ↓
Node/Express
   ↓
PostgreSQL
   ↓
Canonical financial data
   ↓
Feature engineering
   ↓
FastAPI
   ↓
Logistic Regression
   ↓
Risk Score + Probability + Drivers
   ↓
Provider-Agnostic Explainability
   ↓
Gemini
   ↓
Structured Explanation
   ↓
React Dashboard
   ↓
What-if Analysis
   ↓
AWS Deployment
```

alongside:

```text
Authentication
Authorization
Validation
Security
Auditability
Testing
Documentation
Git/GitHub
Cloud deployment
Responsible AI
```

---

# 45. FINAL RULE

The ultimate objective is:

> **Build a complete, explainable, secure, locally runnable, cloud-deployable financial-risk assessment system for thin-file/new-to-credit applicants, using a canonical financial-data pipeline, an interpretable ML risk model, and a provider-agnostic LLM explanation layer.**

The project must be delivered through the **exact ten phases defined in this document**, implemented incrementally, tested at every step, documented, version-controlled, and deployed only after the local end-to-end system works.

END OF MASTER AGENT PROMPT
