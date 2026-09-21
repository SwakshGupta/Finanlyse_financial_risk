const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const mockDb = require('./mockDb');

// Mock ML client
jest.mock('../src/integrations/ml/mlClient', () => ({
  predictRisk: jest.fn().mockImplementation(({ features }) => {
    // If EMI is lower or income is higher, score increases
    const dti = features.monthlyIncome > 0 ? features.monthlyEmi / features.monthlyIncome : 0.5;
    const baseScore = dti < 0.2 ? 88 : dti < 0.4 ? 74 : 45;
    const prob = dti < 0.2 ? 0.05 : dti < 0.4 ? 0.15 : 0.35;
    const band = baseScore >= 75 ? 'LOW' : baseScore >= 50 ? 'MODERATE' : 'HIGH';

    return Promise.resolve({
      riskScore: baseScore,
      defaultProbability: prob,
      riskBand: band,
      model: {
        name: 'Logistic Regression Alternative Risk Baseline',
        version: 'v1.0.0',
      },
      factors: {
        positive: [{ featureName: 'cashFlowSurplus', contribution: 0.35, description: 'Simulated surplus' }],
        negative: [{ featureName: 'debtToIncome', contribution: -0.15, description: 'Simulated DTI' }],
      },
    });
  }),
}));

describe('Phase 8: What-if Counterfactual Scenario Analysis (/api/v1/applications/:id/what-if)', () => {
  let applicantToken;
  let otherApplicantToken;
  let applicationId;

  beforeAll(() => {
    db.setPool(mockDb);
  });

  beforeEach(async () => {
    mockDb.reset();

    // 1. Register main applicant
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'whatif.applicant@example.com',
        password: 'password12345',
        role: 'APPLICANT',
      });
    applicantToken = regRes.body.accessToken;

    // 2. Register other applicant
    const regOther = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other.whatif@example.com',
        password: 'password12345',
        role: 'APPLICANT',
      });
    otherApplicantToken = regOther.body.accessToken;

    // 3. Create application
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        applicant: { fullName: 'Kabir Das', phone: '+919876543210', employmentType: 'GIG_WORKER' },
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

    // 4. Ingest synthetic data
    await request(app)
      .post(`/api/v1/applications/${applicationId}/synthetic`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ presetName: 'THIN_FILE_GIG_WORKER' });
  });

  afterAll(async () => {
    await db.close();
  });

  it('rejects what-if request on unassessed application with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/what-if`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        overrides: { monthlyIncome: 45000 },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cannot run what-if analysis on unassessed application');
  });

  it('rejects unknown override fields with 400 validation error', async () => {
    // Assess first
    await request(app)
      .post(`/api/v1/applications/${applicationId}/assess`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/what-if`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        overrides: {
          monthlyIncome: 50000,
          illegalHackField: 99999,
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Unknown override field(s)');
  });

  it('rejects negative override values with 400 validation error', async () => {
    await request(app)
      .post(`/api/v1/applications/${applicationId}/assess`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/what-if`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        overrides: {
          monthlyIncome: -25000,
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('cannot be negative');
  });

  it('executes what-if scenario, compares with baseline, and keeps baseline intact', async () => {
    // 1. Run baseline assessment
    const baselineRes = await request(app)
      .post(`/api/v1/applications/${applicationId}/assess`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();
    const baselineScore = baselineRes.body.riskScore;

    // 2. Run what-if scenario reducing monthly EMI to ₹2,000 and raising income to ₹60,000
    const scenarioRes = await request(app)
      .post(`/api/v1/applications/${applicationId}/what-if`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        overrides: {
          monthlyIncome: 60000,
          monthlyEmi: 2000,
        },
      });

    expect(scenarioRes.status).toBe(200);
    expect(scenarioRes.body.scenarioId).toBeDefined();
    expect(scenarioRes.body.baseline.riskScore).toBe(baselineScore);
    expect(scenarioRes.body.scenario.riskScore).toBeDefined();
    expect(Array.isArray(scenarioRes.body.changedFactors)).toBe(true);
    expect(scenarioRes.body.changedFactors.length).toBeGreaterThan(0);
    expect(typeof scenarioRes.body.explanation).toBe('string');
    expect(scenarioRes.body.explanation.length).toBeGreaterThan(20);

    // 3. Confirm baseline assessment is NOT overwritten
    const getRes = await request(app)
      .get(`/api/v1/applications/${applicationId}/assessment`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.riskScore).toBe(baselineScore);
  });

  it('forbids unauthorized applicants from running what-if on another user file', async () => {
    await request(app)
      .post(`/api/v1/applications/${applicationId}/assess`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/what-if`)
      .set('Authorization', `Bearer ${otherApplicantToken}`)
      .send({
        overrides: { monthlyIncome: 50000 },
      });

    expect(res.status).toBe(403);
  });
});
