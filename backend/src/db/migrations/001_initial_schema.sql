-- -----------------------------------------------------------------------------
-- Migration: 001_initial_schema.sql
-- Purpose: Create initial relational tables for the Financial Inclusion Platform
-- Conforms to: Dynamic Risk Assessment Master Architecture (Section 12)
-- -----------------------------------------------------------------------------

-- 0. Schema Migrations Tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'APPLICANT' CHECK (role IN ('APPLICANT', 'ANALYST', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Applications
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'ASSESSED', 'REVIEWED')),
    requested_amount NUMERIC(14, 2),
    loan_purpose VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- 3. Applicant Profiles
CREATE TABLE IF NOT EXISTS applicant_profiles (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(32),
    address_city VARCHAR(128),
    employment_type VARCHAR(64),
    employer_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Consents
CREATE TABLE IF NOT EXISTS consents (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    purpose VARCHAR(128) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    version VARCHAR(32) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_app_id ON consents(application_id);

-- 5. Data Sources
CREATE TABLE IF NOT EXISTS data_sources (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    source_type VARCHAR(64) NOT NULL,
    source_identifier VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'CONNECTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Financial Profiles
CREATE TABLE IF NOT EXISTS financial_profiles (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    monthly_income NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monthly_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0,
    average_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    savings_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    existing_emi NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    type VARCHAR(16) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    category VARCHAR(64) NOT NULL,
    description TEXT,
    balance_after NUMERIC(14, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_app_id ON transactions(application_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- 8. Engineered Features
CREATE TABLE IF NOT EXISTS engineered_features (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    feature_set_version VARCHAR(32) NOT NULL,
    features JSONB NOT NULL,
    data_coverage NUMERIC(5, 4) DEFAULT 1.0,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_features_app_id ON engineered_features(application_id);

-- 9. Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 300 AND score <= 850),
    default_probability NUMERIC(6, 4) NOT NULL CHECK (default_probability >= 0.0 AND default_probability <= 1.0),
    risk_band VARCHAR(32) NOT NULL CHECK (risk_band IN ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
    model_version VARCHAR(64) NOT NULL,
    assessment_type VARCHAR(32) NOT NULL DEFAULT 'BASELINE' CHECK (assessment_type IN ('BASELINE', 'SCENARIO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_app_id ON risk_assessments(application_id);

-- 10. Risk Factors
CREATE TABLE IF NOT EXISTS risk_factors (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    feature_name VARCHAR(64) NOT NULL,
    impact VARCHAR(16) NOT NULL CHECK (impact IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL')),
    contribution NUMERIC(8, 4) NOT NULL,
    description TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_factors_assessment_id ON risk_factors(assessment_id);

-- 11. LLM Explanations
CREATE TABLE IF NOT EXISTS llm_explanations (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    model VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    summary TEXT NOT NULL,
    full_explanation JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_explanations_assessment_id ON llm_explanations(assessment_id);

-- 12. Uploaded Documents
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_size INT NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_docs_app_id ON uploaded_documents(application_id);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
