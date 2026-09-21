-- Migration 002: Align risk_assessments and risk_factors with OpenAPI specification and 0-100 Alternative Score

ALTER TABLE risk_assessments DROP CONSTRAINT IF EXISTS risk_assessments_score_check;
ALTER TABLE risk_assessments ADD CONSTRAINT risk_assessments_score_check CHECK (score >= 0 AND score <= 100);

ALTER TABLE risk_assessments DROP CONSTRAINT IF EXISTS risk_assessments_risk_band_check;
ALTER TABLE risk_assessments ADD CONSTRAINT risk_assessments_risk_band_check CHECK (risk_band IN ('LOW', 'MODERATE', 'HIGH'));

ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS model_name VARCHAR(128) DEFAULT 'Logistic Regression Alternative Risk Baseline';
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS feature_set_version VARCHAR(64) DEFAULT 'feature_set_v1';
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS algorithm VARCHAR(64) DEFAULT 'LOGISTIC_REGRESSION';
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS raw_factors JSONB;
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS data_coverage JSONB;
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS explanation_status VARCHAR(32) DEFAULT 'NOT_GENERATED';
