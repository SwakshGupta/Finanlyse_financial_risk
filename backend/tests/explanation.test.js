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
        { featureName: 'incomeStability', contribution: 0.22, description: 'Stable recurring income deposits' },
      ],
      negative: [
        { featureName: 'debtToIncome', contribution: -0.15, description: 'Moderate committed debt ratio' },
      ],
    },
  }),
}));

const MockProvider = require('../src/integrations/llm/providers/mock.provider');
const { generateFallbackExplanation } = require('../src/integrations/llm/fallback.generator');
const { validateExplanation, extractJsonFromText } = require('../src/integrations/llm/schemas/explanation.schema');
const { executeTool, FEATURE_DEFINITIONS, RISK_METHODOLOGY } = require('../src/integrations/llm/tools/catalog.tools');

describe('Phase 7: Explainability Orchestrator, Gemini & Tool Calling', () => {
  beforeAll(() => {
    db.setPool(mockDb);
  });

  beforeEach(() => {
    mockDb.reset();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('1. MockProvider & Schema Validation', () => {
    it('generates structured explanation conforming to schema', async () => {
      const provider = new MockProvider();
      const result = await provider.generateStructured({
        prompt: 'Generate explanation for assessment',
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const validation = validateExplanation(result.data);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      expect(typeof result.data.summary).toBe('string');
      expect(Array.isArray(result.data.positiveFactors)).toBe(true);
      expect(Array.isArray(result.data.riskFactors)).toBe(true);
      expect(Array.isArray(result.data.dataLimitations)).toBe(true);
      expect(typeof result.data.disclaimer).toBe('string');
    });

    it('rejects incomplete or invalid explanation payloads', () => {
      const invalid = {
        summary: 'Just a summary',
      };
      const validation = validateExplanation(invalid);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('extracts JSON from markdown code blocks safely', () => {
      const markdown = '```json\n{\n  "test": 123\n}\n```';
      const extracted = extractJsonFromText(markdown);
      expect(extracted).toEqual({ test: 123 });

      const raw = '{"hello": "world"}';
      expect(extractJsonFromText(raw)).toEqual({ hello: 'world' });

      expect(extractJsonFromText('invalid json')).toBeNull();
    });
  });

  describe('2. Read-Only Underwriting Tools', () => {
    it('returns feature definitions accurately', () => {
      const res = executeTool('getFeatureDefinition', { featureName: 'debtToIncome' });
      expect(res.found).toBe(true);
      expect(res.name).toBe('Debt-to-Income (DTI) Ratio');
      expect(res.category).toBe('LEVERAGE');
    });

    it('handles unknown features gracefully', () => {
      const res = executeTool('getFeatureDefinition', { featureName: 'unknownFeature' });
      expect(res.found).toBe(false);
      expect(res.availableFeatures).toBeDefined();
    });

    it('returns risk methodology and 0-100 scale information', () => {
      const res = executeTool('getRiskMethodology', {});
      expect(res.scoreScale.min).toBe(0);
      expect(res.scoreScale.max).toBe(100);
      expect(res.riskBands.LOW).toBeDefined();
      expect(res.riskBands.HIGH).toBeDefined();
      expect(res.governance.traditionalBureauDataUsed).toBe(false);
    });

    it('throws when attempting to call unauthorized tools', () => {
      expect(() => executeTool('approveLoan', {})).toThrow('Unknown or unauthorized tool');
    });
  });

  describe('3. Deterministic Fallback Generator', () => {
    it('generates high quality explanation when fallback is triggered', () => {
      const explanation = generateFallbackExplanation({
        assessment: { riskScore: 82, defaultProbability: 0.08, riskBand: 'LOW' },
        summary: { cashFlowSurplus: 18000, debtToIncome: 0.18, savingsRate: 0.25 },
        factors: {
          positive: [{ featureName: 'cashFlowSurplus', contribution: 0.25, description: 'Strong surplus' }],
          negative: [],
        },
        dataCoverage: { observationMonths: 6 },
        reason: 'Simulated API quota exceeded',
      });

      expect(explanation.fallbackUsed).toBe(true);
      expect(explanation.fallbackReason).toBe('Simulated API quota exceeded');
      expect(explanation.summary).toContain('82/100');
      expect(explanation.summary).toContain('LOW Risk');
      expect(explanation.positiveFactors.length).toBeGreaterThan(0);
      expect(explanation.riskFactors.length).toBeGreaterThan(0);
      expect(explanation.dataLimitations.length).toBeGreaterThan(0);

      const val = validateExplanation(explanation);
      expect(val.valid).toBe(true);
    });
  });

  describe('4. REST API: GET & POST /api/v1/applications/:id/explanation', () => {
    let applicantToken;
    let otherApplicantToken;
    let applicationId;

    beforeEach(async () => {
      // 1. Register main applicant
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'expl.applicant@example.com',
          password: 'password12345',
          role: 'APPLICANT',
        });
      applicantToken = regRes.body.accessToken;

      // 2. Register other applicant
      const regOther = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'other.applicant@example.com',
          password: 'password12345',
          role: 'APPLICANT',
        });
      otherApplicantToken = regOther.body.accessToken;

      // 3. Create application with valid schema
      const appRes = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicant: { fullName: 'Sunita Rao', phone: '+919876543210', employmentType: 'GIG_WORKER' },
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

    it('returns 400 when requesting explanation for unassessed application', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${applicationId}/explanation`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ forceRegenerate: true });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Cannot generate explanation for unassessed application');
    });

    it('generates and retrieves explanation for assessed application', async () => {
      // Run risk assessment
      await request(app)
        .post(`/api/v1/applications/${applicationId}/assess`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send();

      // POST to generate explanation
      const genRes = await request(app)
        .post(`/api/v1/applications/${applicationId}/explanation`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ provider: 'mock' });

      expect(genRes.status).toBe(200);
      expect(genRes.body.assessmentId).toBeDefined();
      expect(genRes.body.summary).toBeDefined();
      expect(Array.isArray(genRes.body.positiveFactors)).toBe(true);
      expect(Array.isArray(genRes.body.riskFactors)).toBe(true);
      expect(genRes.body.promptVersion).toBe('risk-explanation-v1');

      // GET explanation
      const getRes = await request(app)
        .get(`/api/v1/applications/${applicationId}/explanation`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.summary).toBe(genRes.body.summary);
      expect(getRes.body.assessmentId).toBe(genRes.body.assessmentId);
    });

    it('forbids unauthorized applicants from viewing another user explanation', async () => {
      // Run risk assessment
      await request(app)
        .post(`/api/v1/applications/${applicationId}/assess`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send();

      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}/explanation`)
        .set('Authorization', `Bearer ${otherApplicantToken}`);

      expect(res.status).toBe(403);
    });
  });
});
