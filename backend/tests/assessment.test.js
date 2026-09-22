const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const mockDb = require('./mockDb');

describe('Risk Assessment Integration API (/api/v1/applications/:id/assess)', () => {
  let applicantToken = '';
  let otherApplicantToken = '';
  let analystToken = '';
  let applicationId = '';

  beforeAll(async () => {
    db.setPool(mockDb);

    // Register applicant 1
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'borrower@example.com', password: 'password12345', role: 'APPLICANT' });
    applicantToken = res1.body.accessToken;

    // Register applicant 2 (unauthorized borrower)
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password12345', role: 'APPLICANT' });
    otherApplicantToken = res2.body.accessToken;

    // Register risk analyst
    const resAnalyst = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'credit_analyst@example.com', password: 'password12345', role: 'ANALYST' });
    analystToken = resAnalyst.body.accessToken;

    // Create an application
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        applicant: {
          fullName: 'Priya Sharma',
          phone: '+919876500000',
          employmentType: 'SELF_EMPLOYED',
        },
        consent: [
          {
            purpose: 'UNDERWRITING',
            granted: true,
            version: '1.0',
            dataSources: ['MANUAL_INPUT'],
          },
        ],
      });
    applicationId = appRes.body.id;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated assess requests with 401', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${applicationId}/assess`);
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated get assessment requests with 401', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}/assessment`);
      expect(res.status).toBe(401);
    });

    it('should return 400 when attempting to assess an application without financial data', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${applicationId}/assess`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('financial profile');
    });
  });

  describe('Assessment Execution & Schema Conformance', () => {
    beforeAll(async () => {
      // Ingest financial profile
      await request(app)
        .post(`/api/v1/applications/${applicationId}/financial-profile`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          monthlyIncome: 45000,
          monthlyExpenses: 22000,
          monthlyEmi: 4000,
          averageBalance: 15000,
          savingsBalance: 20000,
          currency: 'INR',
        });
    });

    it('should run risk assessment and return OpenAPI-conformant RiskAssessmentResponse (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${applicationId}/assess`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ regenerateExplanation: false });

      expect(res.status).toBe(200);
      const data = res.body;

      // Schema checks
      expect(data).toHaveProperty('assessmentId');
      expect(data.assessmentId).toMatch(/^asm_[A-Za-z0-9_-]{8,64}$/);
      expect(data.applicationId).toBe(applicationId);

      // Numerical bounds
      expect(typeof data.riskScore).toBe('number');
      expect(data.riskScore).toBeGreaterThanOrEqual(0);
      expect(data.riskScore).toBeLessThanOrEqual(100);

      expect(typeof data.defaultProbability).toBe('number');
      expect(data.defaultProbability).toBeGreaterThanOrEqual(0.0);
      expect(data.defaultProbability).toBeLessThanOrEqual(1.0);

      expect(['LOW', 'MODERATE', 'HIGH']).toContain(data.riskBand);

      // Model metadata
      expect(data.model).toHaveProperty('name');
      expect(['logistic_regression_v2.0.0', 'logistic_regression_v1.0.0']).toContain(data.model.version);
      expect(['feature_set_v2', 'feature_set_v1']).toContain(data.model.featureSetVersion);
      expect(data.model.algorithm).toBe('LOGISTIC_REGRESSION');

      // Factors
      expect(data.factors).toHaveProperty('positive');
      expect(data.factors).toHaveProperty('negative');
      expect(Array.isArray(data.factors.positive)).toBe(true);
      expect(Array.isArray(data.factors.negative)).toBe(true);

      // Data coverage
      expect(data.dataCoverage).toHaveProperty('financialDataAvailable', true);
      expect(data.dataCoverage).toHaveProperty('bureauDataAvailable', false);
      expect(data.dataCoverage.observationMonths).toBeGreaterThanOrEqual(6);

      // Status
      expect(data.explanationStatus).toBe('NOT_GENERATED');
      expect(data).toHaveProperty('assessedAt');
    });

    it('should transition application status to ASSESSED', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ASSESSED');
    });

    it('should allow the applicant to fetch their latest assessment (GET /assessment)', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}/assessment`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.applicationId).toBe(applicationId);
      expect(res.body).toHaveProperty('riskScore');
      expect(res.body).toHaveProperty('defaultProbability');
      expect(res.body).toHaveProperty('riskBand');
      expect(res.body).toHaveProperty('factors');
    });

    it('should allow an ANALYST to fetch the assessment', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}/assessment`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.applicationId).toBe(applicationId);
    });

    it('should reject a different applicant from viewing the assessment with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}/assessment`)
        .set('Authorization', `Bearer ${otherApplicantToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject a different applicant from assessing the application with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${applicationId}/assess`)
        .set('Authorization', `Bearer ${otherApplicantToken}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });
});
