const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const mockDb = require('./mockDb');

describe('Authentication & Security API (/api/v1/auth)', () => {
  beforeAll(() => {
    db.setPool(mockDb);
  });

  beforeEach(() => {
    mockDb.reset();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new applicant user successfully (201 Created)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'applicant@example.com',
          password: 'securePassword123!',
          role: 'APPLICANT'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual({
        id: expect.stringMatching(/^usr_/),
        email: 'applicant@example.com',
        role: 'APPLICANT'
      });
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.tokenType).toBe('Bearer');
      expect(response.body.expiresIn).toBe(86400);
    });

    it('should reject registration if email is invalid (400 ValidationError)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'securePassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' })
        ])
      );
    });

    it('should reject registration if password is shorter than 8 characters (400)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' })
        ])
      );
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password12345'
        });

      // Second registration with identical email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'differentPassword123'
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register test user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'correctPassword123',
          role: 'APPLICANT'
        });
    });

    it('should successfully log in with valid credentials (200 OK)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'correctPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('login-test@example.com');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.tokenType).toBe('Bearer');
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'wrongPassword!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should reject login for non-existent email (401 Unauthorized)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anyPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should successfully refresh access token using valid refreshToken', async () => {
      const regResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh-test@example.com',
          password: 'password12345'
        });

      const { refreshToken } = regResponse.body;

      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokenType).toBe('Bearer');
      expect(refreshResponse.body.expiresIn).toBe(86400);
    });

    it('should reject refresh with invalid token string (401)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.signature.value.here.12345' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Protected Route: GET /api/v1/auth/me', () => {
    let applicantToken = '';

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'me-test@example.com',
          password: 'password12345',
          role: 'APPLICANT'
        });
      applicantToken = res.body.accessToken;
    });

    it('should return user profile when accessed with valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('me-test@example.com');
      expect(response.body.user.role).toBe('APPLICANT');
    });

    it('should return 401 Unauthorized when Authorization header is missing', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 Unauthorized when Bearer token is tampered with', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_tampered_token_string');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Role-Based Authorization (RBAC)', () => {
    it('should deny APPLICANT user access to an ANALYST-only endpoint (403 Forbidden)', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'applicant-role@example.com',
          password: 'password12345',
          role: 'APPLICANT'
        });

      const response = await request(app)
        .get('/api/v1/auth/analyst-only')
        .set('Authorization', `Bearer ${reg.body.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should permit ANALYST user access to the ANALYST endpoint (200 OK)', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'analyst-role@example.com',
          password: 'password12345',
          role: 'ANALYST'
        });

      const response = await request(app)
        .get('/api/v1/auth/analyst-only')
        .set('Authorization', `Bearer ${reg.body.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ANALYST_ACCESS_GRANTED');
      expect(response.body.user.role).toBe('ANALYST');
    });
  });
});
