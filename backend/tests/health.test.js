const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const mockDb = require('./mockDb');

describe('Health and Readiness Endpoints', () => {
  beforeAll(() => {
    db.setPool(mockDb);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('GET /health', () => {
    it('should return 200 with service status and X-Request-Id header', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
      expect(response.body).toHaveProperty('service', 'risk-assessment-api');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.headers).toHaveProperty('x-request-id');
    });

    it('should respect incoming X-Request-Id header', async () => {
      const customId = 'req_test_custom_12345';
      const response = await request(app)
        .get('/health')
        .set('X-Request-Id', customId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  describe('GET /ready', () => {
    it('should return 200 READY when database pool is healthy', async () => {
      const response = await request(app).get('/ready');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'READY');
      expect(response.body.checks).toEqual({ database: 'UP' });
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 503 NOT_READY when database query fails', async () => {
      // Temporarily mock failing query
      const failingPool = {
        async query() {
          throw new Error('Connection refused');
        }
      };
      db.setPool(failingPool);

      const response = await request(app).get('/ready');
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('status', 'NOT_READY');
      expect(response.body.checks).toEqual({ database: 'DOWN' });

      // Restore mockDb
      db.setPool(mockDb);
    });
  });

  describe('Undefined Route Handling', () => {
    it('should return 404 with standardized ErrorResponse structure', async () => {
      const response = await request(app).get('/api/v1/non-existent-endpoint');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('requestId');
    });
  });
});
