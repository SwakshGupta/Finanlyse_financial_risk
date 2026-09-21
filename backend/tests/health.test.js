const request = require('supertest');
const app = require('../src/app');

describe('Backend Base Endpoints', () => {
  it('GET /health should return 200 with service status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('service', 'risk-assessment-api');
    expect(response.body).toHaveProperty('timestamp');
  });
});
