# AI-Powered Financial Inclusion Platform
## Dynamic Risk Assessment — Master Architecture & Implementation Guide

**Document purpose:** Master technical blueprint for the implementation agent (Antigravity) and the developer/reviewer.

**Project type:** Hackathon MVP / portfolio-grade prototype  
**Primary use case:** Explainable alternative risk assessment for thin-file / new-to-credit / underserved applicants  
**Frontend:** React  
**Backend:** Node.js + Express  
**Database:** PostgreSQL + pgvector  
**ML service:** Python + FastAPI + scikit-learn  
**LLM:** Provider-agnostic orchestration layer, initially Gemini API using `gemini-3.1-flash-lite`  
**Cloud:** AWS  
**Version control:** Git + GitHub  
**Local-first:** Every component must work locally before cloud deployment.

---

# 1. Architecture Goals

The system must:

1. Collect applicant and financial information through structured form inputs and supported uploads.
2. Normalize incoming data into a canonical financial representation.
3. Calculate financially meaningful risk features.
4. Run a transparent baseline ML model to estimate repayment/default risk.
5. Produce an Alternative Risk Score, estimated default probability, risk band, and model-derived risk drivers.
6. Use an LLM only for explainability, summarization, and analyst-facing interpretation. The LLM must not determine creditworthiness or alter the numerical model score.
7. Support provider/model replacement through a provider-agnostic LLM interface.
8. Support tool calling in a controlled, read-only way for explanation grounding.
9. Store application, financial, prediction, explanation, and audit information in PostgreSQL.
10. Store uploaded documents in object storage (local filesystem during development; S3 in AWS).
11. Be secure by design: authentication, authorization, validation, secret management, secure file handling, audit logging, minimal sensitive-data exposure.
12. Be testable locally and deployable to AWS.
13. Be modular so Antigravity can implement and modify one component without destabilizing the rest of the project.
14. Maintain meaningful Git history and component-level README documentation.

---

# 2. Product Positioning

The product is an **explainable risk-intelligence layer** rather than a loan-approval engine.

The prototype should communicate:

> “The system transforms consented financial behaviour and available credit information into an explainable alternative risk profile for applicants with limited traditional credit history.”

Do NOT describe the output as a CIBIL score or as a replacement for a bureau score.

Preferred terminology:

- Alternative Risk Score
- Dynamic Risk Assessment
- Estimated Default Probability
- Risk Band
- Risk Drivers
- Financial Behaviour Insights
- Data Coverage

If bureau information is actually supplied in the prototype, it may be shown separately as “Bureau Information”. Never fabricate a bureau score or DPD history.

---

# 3. Core Design Principles

## 3.1 ML owns the numerical decision

The ML service is responsible for:

- default probability
- risk score
- risk band
- feature-level contributions / risk drivers

The LLM is not the credit decision-maker.

## 3.2 LLM owns explanation, not risk scoring

The LLM may:

- explain the model output
- summarize the applicant’s financial profile
- convert technical factors into analyst-readable language
- explain what changed in a what-if scenario
- retrieve approved feature definitions through read-only tools

The LLM must not:

- approve or reject an applicant
- invent a risk factor
- invent DPD history
- invent a bureau score
- override the model probability
- calculate a new risk score independently
- use sensitive personal traits as hidden decision criteria

## 3.3 Canonical data model

Every ingestion source must ultimately map to the same internal schema.

Examples of sources:

- manual form
- synthetic dataset
- CSV transaction file
- bank-statement parser
- future Account Aggregator adapter

The ML model should consume the canonical feature vector, not source-specific raw payloads.

## 3.4 Local-first

The project must run locally with a documented setup.

Target local environment:

- React frontend
- Node/Express backend
- PostgreSQL
- Python/FastAPI ML service
- local object storage or filesystem
- optional local mock LLM provider
- Gemini adapter when API key is available

Use Docker Compose where practical.

## 3.5 Fail safely

If the LLM is unavailable:

- risk assessment must still work
- dashboard must still show model result
- explanation should fall back to deterministic template-based explanation

If the ML service is unavailable:

- backend must return a controlled error
- frontend must show a useful status
- no fake prediction may be displayed

---

# 4. System Context

High-level flow:

```text
Applicant / Analyst
        |
        v
React Frontend
        |
      HTTPS
        |
        v
Node.js + Express API
        |
        +-------------------+
        |                   |
        v                   v
PostgreSQL             Object Storage
        |
        v
Data Normalization
        |
        v
Feature Engineering
        |
        v
Python/FastAPI ML Service
        |
        v
Risk Assessment Result
        |
        v
Explainability Orchestrator
        |
        +-------------------+
        |                   |
        v                   v
LLM Provider          Read-only Tools
(Gemini initially)    / Feature Catalog
        |
        v
Structured Explanation
        |
        v
Node.js API
        |
        v
React Risk Dashboard
```

---

# 5. Component Architecture

## Component A — Frontend

**Technology:** React

Responsibilities:

- login/authentication UI
- applicant data form
- consent/data-use UI for prototype
- financial information form
- file upload
- assessment submission
- loading and error states
- risk dashboard
- risk drivers
- explanation
- what-if analysis
- application status

The frontend does not calculate the final risk score.

All authoritative predictions come from the backend.

---

## Component B — Backend API

**Technology:** Node.js + Express

Responsibilities:

- REST API
- authentication
- authorization
- input validation
- application lifecycle
- financial data ingestion
- feature-engineering orchestration
- ML-service orchestration
- explanation-service orchestration
- persistence
- audit logging
- error handling
- rate limiting / basic API protection

The backend is the central orchestration layer.

---

## Component C — Database

**Technology:** PostgreSQL

Responsibilities:

- users
- applications
- applicant profiles
- financial profiles
- transactions
- credit information
- engineered features
- predictions
- risk factors
- explanations
- model version metadata
- audit events
- data-source metadata
- consent records

`pgvector` is available for future/meaningful semantic use cases and should not be introduced just to satisfy a checklist.

---

## Component D — Data Ingestion

Data sources are abstracted behind adapters:

```text
ManualInputAdapter
SyntheticDataAdapter
CsvTransactionAdapter
BankStatementAdapter (optional)
AccountAggregatorAdapter (future production integration)
```

All adapters produce the same canonical internal format.

Example:

```text
Source-specific payload
        |
        v
Source Adapter
        |
        v
CanonicalFinancialData
```

---

## Component E — Feature Engineering

Responsibilities:

- clean values
- aggregate transactions
- derive financial ratios
- compute stability/volatility measures
- handle missing fields
- create ML-ready vector
- record feature provenance

Example features:

- monthly income/inflows
- income stability
- average balance
- monthly expenses
- expense volatility
- cash-flow surplus
- EMI / recurring obligations
- debt-to-income ratio
- transaction regularity
- savings behaviour
- payment failure indicators
- credit-history availability
- credit-history length where available

Device-related signals should be secondary and only included where legitimately available and appropriately justified. Social signals should not be core features in the MVP.

---

## Component F — ML Service

**Technology:** Python + FastAPI + scikit-learn

Responsibilities:

- load model artifact
- load preprocessing artifact
- validate feature vector
- run preprocessing
- generate probability
- generate risk score
- generate risk band
- calculate feature contributions
- expose model version
- health check

Initial model:

**Logistic Regression**

Possible later experiment:

**Random Forest / Gradient Boosted Trees**

Model selection must be based on prototype goals, data quality, interpretability, and time.

---

## Component G — Explainability Orchestrator

This is a backend-facing service/module that sits between the risk result and the LLM provider.

Responsibilities:

1. Receive ML result.
2. Build a safe explanation context.
3. Attach approved feature definitions.
4. Optionally expose read-only tools to the LLM.
5. Call the selected LLM provider through a provider abstraction.
6. Validate structured output.
7. Reject or repair malformed/unsupported explanations.
8. Persist explanation and model/provider metadata.
9. Provide deterministic fallback if the LLM fails.

---

## Component H — LLM Provider Layer

Use an internal provider interface:

```text
LLMProvider
  |
  +-- GeminiProvider
  |
  +-- OpenAIProvider (future)
  |
  +-- AnthropicProvider (future)
  |
  +-- LocalProvider / MockProvider (testing)
```

The rest of the application must not directly depend on Gemini SDK types.

Recommended internal abstraction:

```text
generateStructured(request, schema)
generateText(request)
generateWithTools(request, tools)
```

Provider configuration should come from environment/config:

```text
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.1-flash-lite
```

Switching provider/model should not require changes to the risk engine, frontend, database schema, or API contracts.

---

# 6. LLM Explainability Architecture

## 6.1 Correct flow

```text
Applicant Financial Data
          |
          v
    Feature Engine
          |
          v
      ML Model
          |
          v
Structured Risk Result
          |
          v
Explanation Orchestrator
          |
          +----------------------+
          |                      |
          v                      v
Feature Catalog Tool        Optional data tool
          |                      |
          +-----------+----------+
                      |
                      v
                 LLM Provider
                    Gemini
                      |
                      v
              Structured Explanation
                      |
                      v
                 Validation
                      |
                      v
                  Dashboard
```

## 6.2 Tool calling philosophy

Tools must be:

- read-only
- deterministic where possible
- narrowly scoped
- auditable
- versioned
- irrelevant to credit-decision authority

Good tools:

```text
getFeatureDefinition(featureName)
getRiskMethodology()
getFeatureContributionExplanation(featureName, value, contribution)
getApplicantFinancialSummary(applicationId)
getDataCoverage(applicationId)
```

Bad tools:

```text
approveLoan()
rejectLoan()
changeRiskScore()
setDefaultProbability()
overrideModel()
```

The LLM should never have tools that can modify the authoritative risk result.

## 6.3 Recommended explanation context

The orchestrator should send the LLM:

```json
{
  "applicationId": "app_123",
  "model": {
    "name": "logistic_regression",
    "version": "v1.0.0"
  },
  "risk": {
    "riskScore": 78,
    "defaultProbability": 0.14,
    "riskBand": "MODERATE"
  },
  "topPositiveFactors": [
    {
      "feature": "income_stability",
      "value": 0.92,
      "contribution": -0.18
    }
  ],
  "topNegativeFactors": [
    {
      "feature": "debt_to_income",
      "value": 0.41,
      "contribution": 0.24
    }
  ],
  "dataCoverage": {
    "bankData": true,
    "bureauData": false,
    "transactionMonths": 6
  }
}
```

The LLM should explain this information rather than independently infer a new score.

## 6.4 Structured LLM output

The LLM response must conform to a fixed schema.

Example:

```json
{
  "summary": "The assessment indicates moderate estimated repayment risk.",
  "positiveFactors": [
    "Income has been relatively stable over the observed period.",
    "The applicant maintains a positive monthly cash-flow surplus."
  ],
  "riskFactors": [
    "Debt obligations consume a significant portion of monthly income.",
    "Traditional credit history is limited."
  ],
  "dataLimitations": [
    "The assessment is based on six months of transaction data."
  ],
  "disclaimer": "This explanation describes model outputs and available data; it is not a lending decision."
}
```

Validate the response before returning it to the frontend.

---

# 7. Provider-Agnostic LLM Design

## 7.1 Interfaces

Conceptually:

```text
interface LLMProvider {
    generateText(request): ProviderResponse
    generateStructured(request, schema): StructuredResponse
    generateWithTools(request, tools): ToolAwareResponse
}
```

Provider-specific code stays inside:

```text
llm/providers/
    gemini.provider
    openai.provider
    anthropic.provider
    mock.provider
```

Provider-independent orchestration lives in:

```text
llm/
    orchestrator
    prompts
    schemas
    tools
    safety
```

## 7.2 Configuration

Use:

```text
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=<secret>
```

No API key may appear in source code, Git history, README, frontend bundle, or client-side environment.

Only the backend/server-side LLM module can access the API key.

## 7.3 Mock provider

A mock provider must exist for local tests so that:

- CI tests do not require a real API key
- explanation tests are deterministic
- development can proceed without LLM cost/availability

---

# 8. ML Architecture

## 8.1 Training vs inference

Training is an offline/reproducible pipeline.

```text
Synthetic / historical training dataset
                 |
                 v
             Validation
                 |
                 v
        Feature Engineering
                 |
                 v
          Train / Test Split
                 |
                 v
         Logistic Regression
                 |
                 v
          Evaluation Metrics
                 |
                 v
        Model + Preprocessor
                 |
                 v
            Model Artifact
```

Inference is separate:

```text
API request
   |
   v
Feature vector
   |
   v
Preprocessor
   |
   v
Model artifact
   |
   v
Default probability
   |
   v
Risk score + factors
```

## 8.2 Synthetic-data requirement

Because real borrower-level repayment data is unavailable to the prototype, use synthetic data.

Do not generate labels completely at random.

Create synthetic relationships such as:

- higher debt burden → higher modeled risk
- unstable income → higher modeled risk
- frequent payment failures → higher modeled risk
- stronger positive cash flow → lower modeled risk
- stable income → lower modeled risk

Clearly label the result as a prototype trained/evaluated on synthetic data.

Do not claim real-world predictive accuracy from synthetic evaluation.

## 8.3 Ground truth

The target should represent an actual repayment outcome in the synthetic training population, for example:

```text
default_event = 1
```

for a defined bad-outcome horizon.

The target should not be “CIBIL score”.

---

# 9. Risk Score Design

Initial mapping:

```text
defaultProbability = p

riskScore = round((1 - p) * 100)
```

Higher score = lower estimated default risk.

Example:

```text
p = 0.14
riskScore = 86
```

A risk-band mapping can be configured rather than hard-coded throughout the codebase.

Example configuration:

```text
LOW
MODERATE
HIGH
```

Exact thresholds must be stored in one configuration/module so they can be changed without changing model code.

The dashboard should show both:

- model probability
- derived risk score

This avoids hiding the statistical meaning of the score.

---

# 10. Explainability at ML Level

The ML service should expose:

```text
prediction
model_version
top_positive_features
top_negative_features
feature_values
data_coverage
```

For Logistic Regression, feature contribution can be approximated from:

```text
coefficient × transformed_feature_value
```

The implementation must account for preprocessing/scaling correctly.

If a more complex tree model is introduced later, add SHAP or another appropriate feature-attribution method.

---

# 11. Canonical Data Model

The canonical applicant object should conceptually contain:

```text
Applicant
  - id
  - basic profile
  - consent metadata
  - data sources

FinancialProfile
  - monthly income
  - average balance
  - monthly expenses
  - recurring obligations
  - EMI
  - savings-related metrics

TransactionSummary
  - transaction count
  - inflow total
  - outflow total
  - payment failures
  - transaction categories
  - transaction regularity

CreditInformation
  - bureau availability
  - credit history length
  - reported DPD if provided
  - utilization if provided
  - enquiries if provided

RiskAssessment
  - score
  - probability
  - risk band
  - model version
  - timestamp

RiskFactor
  - feature name
  - feature value
  - contribution
  - direction
  - explanation key

Explanation
  - provider
  - model
  - prompt version
  - structured output
  - timestamp
```

---

# 12. Database Design

Suggested tables:

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

Relationships:

```text
users
  |
  +---- applications
            |
            +---- applicant_profiles
            |
            +---- consents
            |
            +---- data_sources
            |
            +---- financial_profiles
            |
            +---- transactions
            |
            +---- credit_profiles
            |
            +---- engineered_features
            |
            +---- risk_assessments
                      |
                      +---- risk_factors
                      |
                      +---- llm_explanations
```

Every risk assessment must store the model version used.

Every LLM explanation must store:

- provider
- model
- prompt version
- generated timestamp
- assessment ID

This enables reproducibility and auditability.

---

# 13. API Design

Base:

```text
/api/v1
```

## Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
```

## Applications

```text
POST /applications
GET /applications/:id
PUT /applications/:id
```

## Financial information

```text
POST /applications/:id/financial-profile
POST /applications/:id/transactions
POST /applications/:id/documents
GET  /applications/:id/financial-summary
```

## Assessment

```text
POST /applications/:id/assess
GET  /applications/:id/assessment
```

## What-if analysis

```text
POST /applications/:id/what-if
```

## Explanation

```text
GET /applications/:id/explanation
POST /applications/:id/explanation/regenerate
```

## Health

```text
GET /health
GET /ready
```

All APIs must have a consistent error format.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "monthlyIncome must be greater than zero",
    "requestId": "req_123"
  }
}
```

Never expose stack traces or internal secrets to the frontend.

---

# 14. Assessment Sequence

## Normal assessment

```text
1. User submits application
2. Backend validates request
3. Backend stores application
4. Financial data is normalized
5. Feature engine computes risk features
6. Features are persisted
7. Backend calls ML service
8. ML service validates features
9. ML model produces probability
10. ML service derives score/band/factors
11. Backend persists risk result
12. Explanation orchestrator builds safe context
13. LLM provider generates structured explanation
14. Backend validates explanation
15. Backend persists explanation
16. Frontend receives assessment
17. Dashboard displays result
```

---

# 15. What-if Sequence

```text
User changes parameter
        |
        v
Frontend sends override values
        |
        v
Backend validates allowed fields
        |
        v
Feature engine recalculates affected features
        |
        v
ML service generates new prediction
        |
        v
Backend compares baseline vs scenario
        |
        v
Explanation layer describes change
        |
        v
Frontend shows before/after comparison
```

Important:

What-if analysis must not overwrite the original assessment unless explicitly intended.

Store it as a scenario.

---

# 16. File Upload Architecture

Supported initial inputs:

- CSV
- JSON
- PDF (optional MVP extension)

Upload flow:

```text
Frontend
   |
   v
Upload endpoint
   |
   v
File validation
   |
   +--> MIME type
   +--> size
   +--> extension
   +--> checksum
   |
   v
Object storage
   |
   v
Document/data parser
   |
   v
Canonical financial data
```

For PDF parsing, a provider-agnostic `DocumentExtractionService` may be added.

The uploaded document itself should not be sent to the LLM unless there is a concrete extraction/summarization requirement.

---

# 17. Account Aggregator Abstraction

The application should represent AA as a production data-source concept, not as scraped data.

Conceptual production flow:

```text
Customer
   |
   v
Consent
   |
   v
Account Aggregator
   |
   v
Financial Information Provider
   |
   v
Consented financial information
   |
   v
Financial Information User / lender
   |
   v
Feature Engineering
```

Prototype implementation:

```text
Synthetic / uploaded data
        |
        v
Same canonical financial schema
        |
        v
Same feature-engineering pipeline
```

This allows a future AA adapter without changing the ML model or dashboard.

---

# 18. Frontend Low-Level Design

Suggested pages:

```text
/login
/apply
/application/:id
/application/:id/assessment
/application/:id/what-if
```

Suggested reusable components:

```text
AuthForm
ApplicantForm
FinancialForm
UploadZone
ApplicationSummary
AssessmentCard
RiskScoreCard
RiskBandBadge
FinancialMetrics
RiskDrivers
ExplanationPanel
DataCoverageCard
WhatIfPanel
LoadingState
ErrorState
```

Frontend state should distinguish:

```text
idle
loading
success
error
```

Never silently show stale or missing assessment data.

---

# 19. Backend Low-Level Structure

Suggested structure:

```text
backend/
├── src/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── middleware/
│   ├── validators/
│   ├── integrations/
│   │   ├── ml/
│   │   ├── llm/
│   │   └── storage/
│   ├── modules/
│   │   ├── applications/
│   │   ├── financial/
│   │   ├── assessment/
│   │   └── explanation/
│   ├── utils/
│   └── app.js
├── tests/
└── README.md
```

Use separation between:

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

External services should be called through dedicated integration modules.

---

# 20. ML Service Low-Level Structure

```text
ml-service/
├── app/
│   ├── main.py
│   ├── api/
│   ├── schemas/
│   ├── services/
│   ├── model/
│   ├── preprocessing/
│   ├── features/
│   └── utils/
├── training/
│   ├── generate_data.py
│   ├── train.py
│   └── evaluate.py
├── artifacts/
├── tests/
└── README.md
```

Runtime service must not retrain the model on every request.

Training is separate from inference.

---

# 21. LLM Low-Level Structure

Recommended:

```text
backend/src/integrations/llm/
├── interfaces/
│   └── llm-provider.interface
├── providers/
│   ├── gemini.provider
│   ├── mock.provider
│   └── future-provider.example
├── orchestrator/
│   └── explanation.orchestrator
├── prompts/
│   └── risk-explanation.prompt
├── schemas/
│   └── explanation.schema
├── tools/
│   ├── feature-definition.tool
│   ├── methodology.tool
│   └── data-coverage.tool
└── safety/
    └── explanation.guard
```

The frontend should never communicate directly with Gemini.

---

# 22. Prompt Architecture

Prompts must be versioned.

Example:

```text
risk-explanation-v1
```

The system instruction should establish:

- role
- permitted information
- forbidden actions
- explanation rules
- uncertainty rules
- schema requirements
- no decision override
- no hallucination of missing data

Example policy:

```text
You are an explanation component for a financial risk assessment system.

You must explain only the supplied model output and approved feature metadata.

You must not:
- change the risk score
- invent missing information
- infer sensitive personal characteristics
- recommend approval or rejection
- claim that the prediction is guaranteed
- present synthetic-data results as validated real-world performance
```

---

# 23. Security Design

## Authentication

JWT-based authentication for MVP.

## Authorization

Middleware checks user/role permissions before protected operations.

## Input validation

Validate:

- type
- range
- required fields
- allowed enum values
- string length
- file type
- file size

## Secrets

Local:

```text
.env
```

Production:

AWS Secrets Manager or equivalent secret configuration.

Never commit `.env`.

## File security

- allowed MIME types
- allowed size
- server-generated filenames
- no executable uploads
- malware scanning can be future scope
- store outside executable application directory

## Logging

Log:

- request ID
- endpoint
- status
- latency
- event type
- assessment ID

Do not log raw bank transactions or unnecessary personal/financial data.

---

# 24. Responsible AI Design

The application must display a small transparency section:

```text
Data used
Model
Model version
Data coverage
Known limitations
```

Prototype disclosure:

> “This prototype uses synthetic data and is intended to demonstrate the architecture and explainability workflow. It is not a validated production credit-decision model.”

Other principles:

- minimize data collection
- use financially relevant features
- avoid invasive device/contact/social data in the MVP
- keep the LLM outside the credit-decision path
- preserve model/version traceability
- expose data coverage and uncertainty
- provide human-readable reasons

---

# 25. Error Handling

Every service needs clear failure states.

Examples:

### Database unavailable

```text
503 DATABASE_UNAVAILABLE
```

### ML service unavailable

```text
503 RISK_ENGINE_UNAVAILABLE
```

### LLM unavailable

Use:

```text
DETERMINISTIC_EXPLANATION_FALLBACK
```

and still return the risk result.

### Validation failure

```text
400 VALIDATION_ERROR
```

### Unauthorized

```text
401 UNAUTHORIZED
```

### Forbidden

```text
403 FORBIDDEN
```

### Unknown application

```text
404 APPLICATION_NOT_FOUND
```

---

# 26. Testing Strategy

## Backend

- unit tests
- controller/service tests
- validation tests
- repository integration tests
- API integration tests

## ML

- feature-engineering tests
- preprocessing tests
- model-load tests
- prediction schema tests
- probability/range tests
- deterministic smoke test

## LLM

- mock-provider tests
- schema validation
- prompt contract tests
- fallback behaviour
- tool permission tests

## Frontend

- component tests
- API mocking
- form-validation tests
- dashboard rendering tests

## End-to-end

At least one:

```text
Create application
      ↓
Add financial data
      ↓
Run assessment
      ↓
Receive result
      ↓
Display dashboard
```

---

# 27. Local Development Architecture

Recommended:

```text
Docker Compose
|
+-- frontend
+-- backend
+-- ml-service
+-- postgres
```

Optional local services:

```text
+-- pgadmin
```

Object storage can initially use:

```text
local filesystem
```

or a small S3-compatible local service if needed.

Local LLM mode:

```text
LLM_PROVIDER=mock
```

Production/development mode:

```text
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.1-flash-lite
```

---

# 28. AWS Deployment Architecture

Target production-shaped design:

```text
                         Internet
                            |
                            v
                    CloudFront / HTTPS
                            |
                            v
                      React Frontend
                            |
                            v
                    Node.js Backend
                       /         \
                      /           \
                     v             v
                  RDS          S3 Bucket
               PostgreSQL      Documents
                     |
                     v
              Risk Assessment
                     |
            +--------+---------+
            |                  |
            v                  v
       ML FastAPI         LLM Provider
       service             Gemini
            |
            v
         Results
            |
            v
        CloudWatch
```

Candidate AWS services:

- S3: frontend/static files and uploaded documents
- CloudFront: frontend delivery / HTTPS
- RDS PostgreSQL: relational database
- ECR: container image registry
- ECS/Fargate or another container runtime: backend and ML services
- Secrets Manager: secrets
- CloudWatch: logs/metrics
- IAM: access control

For the hackathon, deployment may use a simpler EC2 + Docker approach if it reduces deployment risk. The application boundaries must remain compatible with later containerized deployment.

---

# 29. Deployment Rule

Deployment happens only after:

```text
Local frontend works
        +
Local backend works
        +
PostgreSQL works
        +
ML service works
        +
Backend -> ML works
        +
LLM works/fallback works
        +
End-to-end test passes
```

Never attempt AWS deployment before the local vertical slice is stable.

---

# 30. Git Strategy

Commit by logical change.

Recommended examples:

```text
chore: initialize repository
feat: initialize express backend
feat: add database configuration
feat: add application schema
feat: add application APIs
feat: add financial ingestion
feat: add feature engineering
feat: initialize ml service
feat: add baseline risk model
feat: integrate backend with ml service
feat: add authentication
feat: add risk dashboard
feat: add explainability orchestrator
feat: add gemini provider
feat: add what-if analysis
test: add end-to-end assessment flow
chore: add docker compose
deploy: configure aws environment
docs: update architecture guide
```

Each commit should leave the repository in a reasonably usable state.

---

# 31. Antigravity Implementation Contract

Antigravity must follow these rules.

## Rule 1 — Work incrementally

Never refactor unrelated modules while implementing a requested component.

## Rule 2 — Preserve existing contracts

Do not change an existing API response or database schema without explicitly documenting the migration.

## Rule 3 — No secret generation

Never add real API keys or passwords to source code.

## Rule 4 — Documentation is mandatory

Every major component change must create or update its README.

## Rule 5 — Test before claiming completion

The implementation is not complete until the required tests and manual smoke checks pass.

## Rule 6 — Report changes

After implementation, report:

```text
Files created
Files modified
Dependencies added
Tests added
Commands used
Tests executed
Known issues
Architecture decisions
```

## Rule 7 — Minimal dependencies

Do not introduce a library when a small internal module is sufficient.

## Rule 8 — No fake functionality

Do not add placeholder endpoints that return fake risk results and present them as production functionality.

Synthetic demo data is allowed only when clearly marked as synthetic.

---

# 32. Master End-to-End Data Flow

```text
                              USER
                               |
                               v
                      React Application
                               |
                +--------------+---------------+
                |                              |
                v                              v
        Applicant Form                   File Upload
                |                              |
                +--------------+---------------+
                               |
                               v
                         REST API
                               |
                               v
                    Node.js / Express
                               |
                +--------------+---------------+
                |                              |
                v                              v
          PostgreSQL                     Object Storage
                |
                v
          Data Normalization
                |
                v
         Feature Engineering
                |
                v
          Engineered Features
                |
                v
          Python / FastAPI
                |
                v
       Logistic Regression Model
                |
        +-------+--------+
        |                |
        v                v
 Default Probability   Feature Contributions
        |                |
        +-------+--------+
                |
                v
        Risk Score + Band
                |
                v
      Explanation Orchestrator
                |
        +-------+--------+
        |                |
        v                v
 Feature Catalog     LLM Provider
 / Data Tools          Gemini
        |                |
        +-------+--------+
                |
                v
       Structured Explanation
                |
                v
           Validation
                |
                v
          PostgreSQL
                |
                v
        React Dashboard
                |
                v
          What-if Analysis
```

---

# 33. What the User Sees

## Step 1 — Application

Applicant enters:

- basic information
- income
- expenses
- EMI
- financial information
- available credit information

and uploads supported financial data.

## Step 2 — Assessment

System displays:

```text
Assessment in progress...
Collecting data
Normalizing data
Calculating financial features
Running risk model
Generating explanation
```

## Step 3 — Dashboard

Example:

```text
ALTERNATIVE RISK SCORE
78 / 100

ESTIMATED DEFAULT PROBABILITY
14%

RISK BAND
MODERATE

TOP POSITIVE FACTORS
Stable income
Positive monthly cash flow

TOP RISK FACTORS
High debt-to-income
Limited credit history

DATA COVERAGE
6 months financial data
No bureau history supplied
```

## Step 4 — Explanation

The explanation must clearly distinguish:

```text
Model output
        vs
Human-readable interpretation
```

## Step 5 — What-if

User changes:

```text
EMI: ₹5,000 -> ₹18,000
```

System shows:

```text
Original score
New score
Change in probability
Changed features
Explanation of change
```

---

# 34. MVP Scope

## Must Have

- React frontend
- Node/Express API
- PostgreSQL
- application creation
- financial data input
- canonical data model
- feature engineering
- logistic-regression risk model
- Python/FastAPI service
- backend ↔ ML integration
- risk dashboard
- deterministic explanation fallback
- Gemini provider
- provider abstraction
- basic tool calling / feature-definition retrieval
- authentication
- input validation
- audit logging
- tests
- README
- GitHub
- local end-to-end execution

## Should Have

- CSV upload
- PDF financial statement extraction
- what-if analysis
- pgvector
- model comparison
- SHAP
- S3 upload
- Docker Compose
- CloudWatch logging
- AWS deployment

## Nice to Have

- full Account Aggregator integration
- advanced model monitoring
- multiple LLM providers
- advanced fraud model
- sophisticated document extraction
- advanced bias evaluation dashboard

The project must prioritize a complete working MVP over optional features.

---

# 35. Implementation Order

The agent must implement in this order unless explicitly instructed otherwise:

```text
PHASE 0
Repository + documentation foundation
        |
        v
PHASE 1
Node/Express backend foundation
        |
        v
PHASE 2
PostgreSQL schema + repository layer
        |
        v
PHASE 3
Application + financial APIs
        |
        v
PHASE 4
Canonical data normalization
        |
        v
PHASE 5
Feature engineering
        |
        v
PHASE 6
Synthetic-data generation + ML training
        |
        v
PHASE 7
FastAPI ML inference service
        |
        v
PHASE 8
Backend -> ML integration
        |
        v
PHASE 9
React frontend
        |
        v
PHASE 10
Risk dashboard
        |
        v
PHASE 11
LLM abstraction + mock provider
        |
        v
PHASE 12
Gemini provider + explanation orchestration
        |
        v
PHASE 13
Tool calling + structured explanation
        |
        v
PHASE 14
What-if analysis
        |
        v
PHASE 15
Security hardening
        |
        v
PHASE 16
Testing + E2E
        |
        v
PHASE 17
Docker
        |
        v
PHASE 18
AWS deployment
        |
        v
PHASE 19
Final demo/PPT/documentation
```

---

# 36. Definition of Done

A component is complete only when:

- implementation exists
- tests exist where applicable
- local execution works
- integration contract is verified
- README is updated
- environment variables are documented
- errors are handled
- security implications are reviewed
- Git diff is reviewed
- changes are committed

---

# 37. Final Architectural Rules

1. **Do not use the LLM as the credit decision-maker.**
2. **Do not fabricate bureau scores or DPD history.**
3. **Do not claim synthetic-data accuracy is real-world accuracy.**
4. **Do not put financial/PII data unnecessarily into logs or prompts.**
5. **Do not hardcode secrets.**
6. **Do not make frontend decisions authoritative.**
7. **Do not make provider-specific LLM code leak into business logic.**
8. **Do not let the LLM mutate authoritative model outputs.**
9. **Do not build optional complexity before the end-to-end MVP works.**
10. **Do not allow one giant AI-generated change to rewrite the entire repository.**
11. **Document every major architectural decision.**
12. **Keep the system locally runnable before cloud deployment.**

---

# 38. Primary Architecture Summary

```text
                    ┌─────────────────────┐
                    │    React Frontend   │
                    └──────────┬──────────┘
                               │
                               v
                    ┌─────────────────────┐
                    │ Node.js + Express    │
                    │ REST API             │
                    └──────────┬──────────┘
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
      ┌───────────────┐                 ┌─────────────┐
      │ PostgreSQL    │                 │ Object S3   │
      └───────┬───────┘                 └─────────────┘
              |
              v
      ┌───────────────────┐
      │ Feature Engineering│
      └─────────┬─────────┘
                |
                v
      ┌───────────────────┐
      │ Python + FastAPI  │
      │ Logistic Model    │
      └─────────┬─────────┘
                |
                v
      ┌───────────────────┐
      │ Risk Assessment   │
      └─────────┬─────────┘
                |
                v
      ┌───────────────────┐
      │ Explainability    │
      │ Orchestrator      │
      └─────────┬─────────┘
                |
         +------+------+
         |             |
         v             v
    Feature Tools   LLM Provider
                    (Gemini first)
         |             |
         +------+------+
                |
                v
      ┌───────────────────┐
      │ Structured        │
      │ Explanation       │
      └─────────┬─────────┘
                |
                v
      ┌───────────────────┐
      │ React Dashboard   │
      │ + What-if         │
      └───────────────────┘

Cross-cutting:
Authentication | Authorization | Validation | Security
Testing | Logging | Monitoring | Auditability
Versioning | Documentation | Responsible AI
```

---

# 39. Current Gemini Configuration

Initial provider configuration:

```text
Provider: Gemini
Model: gemini-3.1-flash-lite
```

The current Google AI documentation lists `gemini-3.1-flash-lite` as a stable model and documents structured outputs and function calling for the model. The older `gemini-3.1-flash-lite-preview` model was shut down on May 25, 2026; use the stable model identifier. 

The implementation must still hide this provider-specific choice behind `LLMProvider`.

---

# 40. Agent Instruction — Highest Priority

When implementing this project, preserve the architecture in this document unless a change is explicitly requested.

Before making a significant architectural change:

1. Identify the existing component affected.
2. Explain why the change is required.
3. Identify interfaces/contracts affected.
4. Minimize the blast radius.
5. Update documentation.
6. Add/update tests.
7. Report the changes.

The end goal is not the maximum number of technologies.

The end goal is:

> **A complete, secure, explainable, locally runnable, cloud-deployable financial risk assessment system with a clear separation between data ingestion, feature engineering, ML scoring, LLM explanation, application APIs, and presentation.**
