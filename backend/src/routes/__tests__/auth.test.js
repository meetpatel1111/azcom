const request = require('supertest');
const app = require('../../app');

describe('Auth Routes', () => {
  describe('Route availability', () => {
    it('should have POST /api/auth/register route', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should not return 404, but validation error instead
      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/auth/login route', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      // Should not return 404, but validation error instead
      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/auth/logout route', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      // Should not return 404, but auth error instead
      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/auth/refresh route', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      // Should not return 404
      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/auth/me route', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      // Should not return 404, but auth error instead
      expect(response.status).not.toBe(404);
    });

    it('should have placeholder routes', async () => {
      const routes = [
        '/api/auth/verify-email',
        '/api/auth/forgot-password',
        '/api/auth/reset-password'
      ];

      for (const route of routes) {
        const response = await request(app).post(route);
        expect(response.status).not.toBe(404);
      }
    });
  });

  describe('Route validation', () => {
    it('should validate registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should validate login data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
    });
  });

  describe('Authentication requirements', () => {
    it('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for /me endpoint', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});