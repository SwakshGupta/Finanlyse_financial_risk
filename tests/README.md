# Tests — AI-Powered Financial Inclusion Platform

This directory contains end-to-end (E2E) integration tests and cross-service verification suites.

---

## 1. Test Architecture

The platform enforces testing across multiple layers:
- **Backend Unit & Integration Tests**: Located in `backend/tests/` (Jest & Supertest). Tests endpoints, business logic, PostgreSQL repository queries, and auth flow.
- **ML Service Tests**: Located in `ml-service/tests/` (Pytest). Tests Pydantic schemas, feature scaling, model loading, and probability bounds [0, 1].
- **End-to-End System Tests**: Located in this directory (`tests/`). Validates the complete pipeline from applicant onboarding to ML inference and grounded LLM explanation.

---

## 2. Running Tests

```bash
# Run backend tests
npm --prefix backend test

# Run ML service tests
pytest ml-service/tests

# Run root verification suite
npm test
```
