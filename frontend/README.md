# Frontend — AI-Powered Financial Inclusion Dashboard

The frontend application provides the user interface for applicants and risk analysts to submit financial data, view dynamic risk assessments, examine grounded AI explanations, and experiment with what-if credit scenarios.

---

## 1. Overview & Core Flows

Implemented in **Phase 6** using React, the frontend encompasses:
- **Authentication**: Registration and login screens for loan officers and applicants.
- **Application Intake**: Multi-step wizard collecting consented applicant details and alternative financial information.
- **Financial Ingestion UI**: Form input and statement file upload.
- **Risk Assessment Dashboard**:
  - Alternative Risk Score visualization (300–850 gauge)
  - Estimated Default Probability and Risk Band indicator
  - Model-derived Top Risk Drivers (positive and negative contributors)
  - Data Coverage and Completeness score
- **Explainability View**: Plain-language grounded explanations synthesized by Gemini via the backend.
- **What-if Scenario Playground**: Interactive sliders and scenario inputs to preview how financial changes (e.g. higher EMI, increased savings) impact risk without altering historical records.

---

## 2. Directory Structure (Planned)

```text
frontend/
├── public/                  # Static assets and index.html
├── src/
│   ├── assets/              # Icons, logos, styles
│   ├── components/          # Reusable UI components (buttons, score gauges, modals)
│   ├── context/             # Auth and application state providers
│   ├── hooks/               # Custom React hooks (useAuth, useAssessment)
│   ├── pages/               # Login, ApplicationForm, Dashboard, WhatIf
│   ├── services/            # API client layer communicating with Express backend
│   ├── App.jsx              # Application router
│   └── main.jsx             # React entrypoint
├── package.json
└── README.md
```
