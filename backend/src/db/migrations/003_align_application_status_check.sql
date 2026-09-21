-- Migration 003: Align applications.status check constraint with OpenAPI specification
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('DRAFT', 'READY_FOR_ASSESSMENT', 'ASSESSING', 'ASSESSED', 'REVIEWED', 'FAILED', 'SUBMITTED'));
