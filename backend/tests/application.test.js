const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const mockDb = require('./mockDb');

describe('Financial Data Ingestion & Applications API (/api/v1/applications)', () => {
  let applicantToken1 = '';
  let applicantToken2 = '';
  let analystToken = '';

  beforeAll(async () => {
    db.setPool(mockDb);

    // Register applicant 1
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'app1@example.com', password: 'password12345', role: 'APPLICANT' });
    applicantToken1 = res1.body.accessToken;

    // Register applicant 2
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'app2@example.com', password: 'password12345', role: 'APPLICANT' });
    applicantToken2 = res2.body.accessToken;

    // Register analyst
    const resAnalyst = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'analyst@example.com', password: 'password12345', role: 'ANALYST' });
    analystToken = resAnalyst.body.accessToken;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/applications (Create Application)', () => {
    it('should create an application with valid applicant and consent (201 Created)', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          applicant: {
            fullName: 'Rajesh Kumar',
            email: 'rajesh@example.com',
            phone: '+919876543210',
            employmentType: 'CONTRACT',
            employmentTenureMonths: 14
          },
          consent: [
            {
              purpose: 'UNDERWRITING',
              granted: true,
              version: '1.0',
              dataSources: ['MANUAL_INPUT']
            }
          ],
          dataSource: 'MANUAL_INPUT'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(/^app_[A-Za-z0-9_-]{8,64}$/);
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.applicant.fullName).toBe('Rajesh Kumar');
      expect(response.body.dataSources).toContain('MANUAL_INPUT');
    });

    it('should reject application creation when consent is missing (400)', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          applicant: {
            fullName: 'Rajesh Kumar'
          },
          consent: [] // Empty consent array
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject application creation when fullName is missing (400)', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          applicant: {},
          consent: [{ purpose: 'UNDERWRITING', granted: true, version: '1.0' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/applications/:applicationId (Access Control)', () => {
    let testAppId = '';

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          applicant: { fullName: 'Owner Applicant' },
          consent: [{ purpose: 'UNDERWRITING', granted: true, version: '1.0' }]
        });
      testAppId = res.body.id;
    });

    it('should allow the owner applicant to view their own application (200 OK)', async () => {
      const response = await request(app)
        .get(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${applicantToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAppId);
      expect(response.body.applicant.fullName).toBe('Owner Applicant');
    });

    it('should deny another applicant from viewing someone else application (403 Forbidden)', async () => {
      const response = await request(app)
        .get(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${applicantToken2}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow an ANALYST to view any application (200 OK)', async () => {
      const response = await request(app)
        .get(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAppId);
    });

    it('should return 404 for non-existent application', async () => {
      const response = await request(app)
        .get('/api/v1/applications/app_0000000000000000')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Financial Data Ingestion & Summary Pipeline', () => {
    let targetAppId = '';

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          applicant: { fullName: 'Finance Applicant' },
          consent: [{ purpose: 'UNDERWRITING', granted: true, version: '1.0' }]
        });
      targetAppId = res.body.id;
    });

    it('should ingest a normalized financial profile and update status to READY_FOR_ASSESSMENT', async () => {
      const response = await request(app)
        .post(`/api/v1/applications/${targetAppId}/financial-profile`)
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          currency: 'INR',
          monthlyIncome: 45000,
          monthlyExpenses: 28000,
          monthlyEmi: 4000,
          averageBalance: 15000,
          incomeVolatility: 0.15,
          expenseVolatility: 0.12,
          transactionRegularity: 0.90,
          observationMonths: 12
        });

      expect(response.status).toBe(200);
      expect(response.body.applicationId).toBe(targetAppId);
      expect(response.body.profile.monthlyIncome).toBe(45000);
      expect(response.body.profile.monthlyExpenses).toBe(28000);
      expect(response.body.profile.monthlyEmi).toBe(4000);

      // Verify application status updated to READY_FOR_ASSESSMENT
      const appRes = await request(app)
        .get(`/api/v1/applications/${targetAppId}`)
        .set('Authorization', `Bearer ${applicantToken1}`);
      expect(appRes.body.status).toBe('READY_FOR_ASSESSMENT');
    });

    it('should ingest a batch of transactions successfully (201 Created)', async () => {
      const response = await request(app)
        .post(`/api/v1/applications/${targetAppId}/transactions`)
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          source: 'MANUAL_INPUT',
          transactions: [
            {
              transactionDate: '2026-08-01',
              amount: 45000,
              direction: 'CREDIT',
              category: 'SALARY',
              channel: 'NETBANKING',
              merchant: 'Employer Corp'
            },
            {
              transactionDate: '2026-08-05',
              amount: 12000,
              direction: 'DEBIT',
              category: 'RENT',
              channel: 'UPI',
              merchant: 'Apartment Owner'
            },
            {
              transactionDate: '2026-08-10',
              amount: 4000,
              direction: 'DEBIT',
              category: 'EMI',
              channel: 'AUTO_DEBIT',
              merchant: 'Bike Loan EMI'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.acceptedCount).toBe(3);
      expect(response.body.rejectedCount).toBe(0);
    });

    it('should derive accurate financial summary metrics (cashFlowSurplus & debtToIncome)', async () => {
      // Setup profile: income 50,000, expenses 30,000, EMI 5,000
      await request(app)
        .post(`/api/v1/applications/${targetAppId}/financial-profile`)
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({
          monthlyIncome: 50000,
          monthlyExpenses: 30000,
          monthlyEmi: 5000,
          averageBalance: 20000
        });

      const response = await request(app)
        .get(`/api/v1/applications/${targetAppId}/financial-summary`)
        .set('Authorization', `Bearer ${applicantToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.applicationId).toBe(targetAppId);
      const { summary } = response.body;

      expect(summary.monthlyIncome).toBe(50000);
      expect(summary.monthlyExpenses).toBe(30000);
      expect(summary.monthlyEmi).toBe(5000);
      // Surplus = 50000 - 30000 - 5000 = 15000
      expect(summary.cashFlowSurplus).toBe(15000);
      // DTI = 5000 / 50000 = 0.1 (10%)
      expect(summary.debtToIncome).toBe(0.1);
      expect(summary).toHaveProperty('transactionRegularity');
    });

    it('should ingest calibrated synthetic applicant data preset (200 OK)', async () => {
      const response = await request(app)
        .post(`/api/v1/applications/${targetAppId}/synthetic`)
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({ presetName: 'THIN_FILE_GIG_WORKER' });

      expect(response.status).toBe(200);
      expect(response.body.preset).toBe('THIN_FILE_GIG_WORKER');
      expect(response.body.profile.monthlyIncome).toBe(42000);
      expect(response.body.transactionsCount).toBeGreaterThan(0);
    });

    it('should parse and ingest CSV transactions via CsvTransactionAdapter (201 Created)', async () => {
      const csvData = `Date,Amount,Type,Category,Merchant
2026-08-01,35000,CREDIT,SALARY,Acme Corp
2026-08-03,8000,DEBIT,RENT,Landlord
2026-08-05,2500,DEBIT,UTILITIES,Electricity Board
2026-08-10,3200,DEBIT,EMI,Consumer Loan`;

      const response = await request(app)
        .post(`/api/v1/applications/${targetAppId}/csv-transactions`)
        .set('Authorization', `Bearer ${applicantToken1}`)
        .send({ csvContent: csvData });

      expect(response.status).toBe(201);
      expect(response.body.acceptedCount).toBe(4);
      expect(response.body.rejectedCount).toBe(0);
    });
  });
});
