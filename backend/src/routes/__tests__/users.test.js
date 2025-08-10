const request = require('supertest');
const app = require('../../app');

describe('User Routes', () => {
  describe('Route availability', () => {
    it('should have GET /api/users/profile route', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      // Should not return 404, but auth error instead
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401);
    });

    it('should have PUT /api/users/profile route', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({});

      // Should not return 404, but auth error instead
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401);
    });

    it('should have PUT /api/users/password route', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .send({});

      // Should not return 404, but auth error instead
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401);
    });

    it('should have DELETE /api/users/profile route', async () => {
      const response = await request(app)
        .delete('/api/users/profile')
        .send({});

      // Should not return 404, but auth error instead
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401);
    });

    it('should have admin routes', async () => {
      const adminRoutes = [
        '/api/users/stats',
        '/api/users/search?q=test',
        '/api/users'
      ];

      for (const route of adminRoutes) {
        const response = await request(app).get(route);
        expect(response.status).not.toBe(404);
        expect(response.status).toBe(401); // Should require auth
      }
    });
  });

  describe('Authentication requirements', () => {
    it('should require authentication for profile routes', async () => {
      const profileRoutes = [
        { method: 'get', path: '/api/users/profile' },
        { method: 'put', path: '/api/users/profile' },
        { method: 'put', path: '/api/users/password' },
        { method: 'delete', path: '/api/users/profile' }
      ];

      for (const route of profileRoutes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      }
    });

    it('should require authentication for admin routes', async () => {
      const adminRoutes = [
        { method: 'get', path: '/api/users/stats' },
        { method: 'get', path: '/api/users/search?q=test' },
        { method: 'get', path: '/api/users' }
      ];

      for (const route of adminRoutes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      }
    });
  });

  describe('Validation', () => {
    it('should validate search query parameters', async () => {
      const response = await request(app)
        .get('/api/users/search?q=a') // Too short
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=0') // Invalid page
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate role filter', async () => {
      const response = await request(app)
        .get('/api/users?role=invalid') // Invalid role
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Request body validation', () => {
    it('should validate profile update data', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({
          firstName: 'a'.repeat(51) // Too long
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate password change data', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'old',
          newPassword: 'weak' // Too weak
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate account deletion data', async () => {
      const response = await request(app)
        .delete('/api/users/profile')
        .send({}) // Missing password
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});