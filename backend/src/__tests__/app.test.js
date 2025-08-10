const request = require('supertest');
const app = require('../app');

describe('Express App', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Online Shopping Platform API',
        version: '1.0.0',
        documentation: '/api/status',
        health: '/api/health'
      });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(String),
        environment: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('GET /api/status', () => {
    it('should return API status and endpoints', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toEqual({
        api: 'Online Shopping Platform API',
        version: '1.0.0',
        status: 'operational',
        timestamp: expect.any(String),
        endpoints: {
          auth: '/api/auth',
          products: '/api/products',
          cart: '/api/cart',
          orders: '/api/orders',
          users: '/api/users'
        }
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'Route GET /non-existent-route not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      await request(app)
        .options('/api/status')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('JSON Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      // This will be more relevant when we have POST endpoints
      // For now, just test that the middleware is loaded
      const response = await request(app)
        .post('/api/non-existent')
        .send({ test: 'data' })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });
});