const jwt = require('jsonwebtoken');
const { authenticateToken, generateToken, requireAdmin } = require('../auth');
const UserRepository = require('../../repositories/UserRepository');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../repositories/UserRepository');

describe('Auth Middleware', () => {
  let req, res, next;
  let mockUserRepository;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    mockUserRepository = {
      findById: jest.fn()
    };
    UserRepository.mockImplementation(() => mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const user = { id: '123', email: 'test@example.com', role: 'customer' };
      const token = 'valid-token';
      
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue({ userId: '123' });
      mockUserRepository.findById.mockResolvedValue(user);

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(req.user).toEqual({
        id: '123',
        email: 'test@example.com',
        role: 'customer',
        firstName: undefined,
        lastName: undefined
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: '123' });
      mockUserRepository.findById.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'User no longer exists'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token for user', () => {
      const user = { id: '123', email: 'test@example.com', role: 'customer' };
      jwt.sign.mockReturnValue('generated-token');

      const token = generateToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: '123',
          email: 'test@example.com',
          role: 'customer'
        },
        expect.any(String),
        {
          expiresIn: '24h',
          issuer: 'online-shopping-platform'
        }
      );
      expect(token).toBe('generated-token');
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      req.user = { role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', () => {
      req.user = { role: 'customer' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      req.user = null;

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});