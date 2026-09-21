const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const mockDb = require('./mockDb');

// Mock ML client so tests run without external service
jest.mock('../src/integrations/ml/mlClient', () => ({
  predictRisk: jest.fn().mockResolvedValue({
    riskScore: 78,
    defaultProbability: 0.12,
    riskBand: 'LOW',
    model: {
      name: 'Logistic Regression Alternative Risk Baseline',
      version: 'v1.0.0',
    },
    factors: {
      positive: [
        { featureName: 'cashFlowSurplus', contribution: 0.28, description: 'Healthy monthly cash surplus' },
      ],
      negative: [
        { featureName: 'debtToIncome', contribution: -0.15, description: 'Moderate committed debt ratio' },
      ],
    },
  }),
}));

describe('Conversational AI Credit Assistant (/api/v1/applications/:id/chat)', () => {
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
        email: 'chat.applicant@example.com',
        password: 'password12345',
        role: 'APPLICANT',
      });
    applicantToken = regRes.body.accessToken;

    // 2. Register other applicant
    const regOther = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other.chat@example.com',
        password: 'password12345',
        role: 'APPLICANT',
      });
    otherApplicantToken = regOther.body.accessToken;

    // 3. Create application
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        applicant: { fullName: 'Aarav Mehta', phone: '+919876543210', employmentType: 'GIG_WORKER' },
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

  it('rejects chat request when application is not yet assessed', async () => {
    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/chat`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ message: 'How was my score calculated?' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cannot chat regarding unassessed application');
  });

  it('answers applicant question using grounded assessment data', async () => {
    // Run assessment first
    await request(app)
      .post(`/api/v1/applications/${applicationId}/assess`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    // Send chat question
    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/chat`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        message: 'How was my score calculated and how can I improve it?',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(20);
    expect(res.body.timestamp).toBeDefined();
  });

  it('forbids unauthorized applicants from chatting on another applicant file', async () => {
    // Run assessment
    await request(app)
      .post(`/api/v1/applications/${applicationId}/assess`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/chat`)
      .set('Authorization', `Bearer ${otherApplicantToken}`)
      .send({ message: 'Tell me about this file' });

    expect(res.status).toBe(403);
  });

  it('validates that message string is provided', async () => {
    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/chat`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
