const request = require('supertest');
const app = require('../../app');

describe('Product Routes', () => {
  describe('Route availability', () => {
    it('should have GET /api/products route', async () => {
      const response = await request(app)
        .get('/api/products');

      // Should not return 404
      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/:id route', async () => {
      const response = await request(app)
        .get('/api/products/123');

      // Should not return 404, but might return other errors
      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/categories route', async () => {
      const response = await request(app)
        .get('/api/products/categories');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/featured route', async () => {
      const response = await request(app)
        .get('/api/products/featured');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/stats route', async () => {
      const response = await request(app)
        .get('/api/products/stats');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/low-inventory route', async () => {
      const response = await request(app)
        .get('/api/products/low-inventory');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/search/:query route', async () => {
      const response = await request(app)
        .get('/api/products/search/test');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/category/:category route', async () => {
      const response = await request(app)
        .get('/api/products/category/Electronics');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/products/:id/availability route', async () => {
      const response = await request(app)
        .get('/api/products/123/availability');

      expect(response.status).not.toBe(404);
    });
  });

  describe('Query parameter validation', () => {
    it('should validate product list query parameters', async () => {
      const response = await request(app)
        .get('/api/products?page=0') // Invalid page
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate search query length', async () => {
      const response = await request(app)
        .get('/api/products?search=a') // Too short
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=-10') // Negative price
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate sort parameters', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=invalid') // Invalid sort field
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/products?limit=1000') // Too high limit
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Search route validation', () => {
    it('should validate search query in URL parameter', async () => {
      const response = await request(app)
        .get('/api/products/search/a') // Too short
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate pagination in search', async () => {
      const response = await request(app)
        .get('/api/products/search/test?page=0') // Invalid page
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Category route validation', () => {
    it('should validate pagination in category route', async () => {
      const response = await request(app)
        .get('/api/products/category/Electronics?limit=1000') // Too high limit
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Availability route validation', () => {
    it('should validate quantity parameter', async () => {
      const response = await request(app)
        .get('/api/products/123/availability?quantity=0') // Invalid quantity
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Low inventory route validation', () => {
    it('should validate threshold parameter', async () => {
      const response = await request(app)
        .get('/api/products/low-inventory?threshold=0') // Invalid threshold
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate threshold maximum', async () => {
      const response = await request(app)
        .get('/api/products/low-inventory?threshold=2000') // Too high threshold
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Featured products validation', () => {
    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/products/featured?limit=100') // Too high limit
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate minimum limit', async () => {
      const response = await request(app)
        .get('/api/products/featured?limit=0') // Too low limit
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Default parameter handling', () => {
    it('should use default values for missing parameters', async () => {
      // This test verifies that the validation middleware sets defaults
      // The actual response will depend on the mocked repository
      const response = await request(app)
        .get('/api/products');

      // Should not fail validation
      expect(response.status).not.toBe(400);
    });

    it('should use default pagination values', async () => {
      const response = await request(app)
        .get('/api/products/search/test');

      // Should not fail validation
      expect(response.status).not.toBe(400);
    });
  });
});