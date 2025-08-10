const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const UserRepository = require('../../repositories/UserRepository');
const CartRepository = require('../../repositories/CartRepository');

// Mock repositories
jest.mock('../../repositories/UserRepository');
jest.mock('../../repositories/CartRepository');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  let mockUserRepository;
  let mockCartRepository;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      updateLastLogin: jest.fn(),
      findById: jest.fn()
    };
    
    mockCartRepository = {
      getOrCreateCart: jest.fn()
    };

    UserRepository.mockImplementation(() => mockUserRepository);
    CartRepository.mockImplementation(() => mockCartRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashed-password';
      const createdUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.createUser.mockResolvedValue(createdUser);
      mockCartRepository.getOrCreateCart.mockResolvedValue({});
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer'
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: '24h'
        }
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
      expect(mockUserRepository.createUser).toHaveBeenCalled();
      expect(mockCartRepository.getOrCreateCart).toHaveBeenCalledWith('123');
    });

    it('should reject registration with existing email', async () => {
      const existingUser = { id: '456', email: 'test@example.com' };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    });

    it('should validate registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should require all mandatory fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
          expect.objectContaining({ field: 'firstName' }),
          expect.objectContaining({ field: 'lastName' })
        ])
      );
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123'
    };

    it('should login user successfully', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer'
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: '24h'
        }
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123', 'hashed-password');
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith('123');
    });

    it('should reject login with non-existent email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    });

    it('should reject login with wrong password', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed-password'
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    });

    it('should validate login data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const user = { id: '123', role: 'customer' };
      mockUserRepository.findById.mockResolvedValue(user);

      // First login to get a token
      const loginUser = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'customer'
      };
      mockUserRepository.findByEmail.mockResolvedValue(loginUser);
      bcrypt.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      const token = loginResponse.body.tokens.accessToken;

      // Now logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Logout successful'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      mockUserRepository.findById.mockResolvedValue(user);

      // Mock authentication
      const loginUser = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'customer'
      };
      mockUserRepository.findByEmail.mockResolvedValue(loginUser);
      bcrypt.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      const token = loginResponse.body.tokens.accessToken;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer'
        }
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access token required'
      });
    });
  });
});