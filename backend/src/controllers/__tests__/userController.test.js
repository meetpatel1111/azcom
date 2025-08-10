const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const UserRepository = require('../../repositories/UserRepository');

// Mock repositories
jest.mock('../../repositories/UserRepository');
jest.mock('bcryptjs');

describe('User Controller', () => {
  let mockUserRepository;
  let authToken;
  let adminToken;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      delete: jest.fn(),
      getUserStats: jest.fn(),
      searchUsers: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      updateUser: jest.fn(),
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn()
    };

    UserRepository.mockImplementation(() => mockUserRepository);

    // Mock tokens for testing
    authToken = 'valid-user-token';
    adminToken = 'valid-admin-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to mock authentication
  const mockAuth = (user) => {
    mockUserRepository.findById.mockResolvedValue(user);
  };

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      mockAuth(user);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
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
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should handle user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const user = { id: '123', role: 'customer' };
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };
      const updatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer'
      };

      mockAuth(user);
      mockUserRepository.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Profile updated successfully',
        user: updatedUser
      });

      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith('123', updateData);
    });

    it('should validate profile data', async () => {
      const user = { id: '123', role: 'customer' };
      const invalidData = {
        firstName: 'a'.repeat(51) // Too long
      };

      mockAuth(user);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ firstName: 'Jane' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change password successfully', async () => {
      const user = {
        id: '123',
        passwordHash: 'old-hashed-password',
        role: 'customer'
      };
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456'
      };

      mockAuth(user);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new-hashed-password');
      mockUserRepository.changePassword.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Password changed successfully'
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'old-hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 12);
      expect(mockUserRepository.changePassword).toHaveBeenCalledWith('123', 'new-hashed-password');
    });

    it('should reject incorrect current password', async () => {
      const user = {
        id: '123',
        passwordHash: 'old-hashed-password',
        role: 'customer'
      };
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456'
      };

      mockAuth(user);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should validate password data', async () => {
      const user = { id: '123', role: 'customer' };
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: 'weak' // Too weak
      };

      mockAuth(user);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('DELETE /api/users/profile', () => {
    it('should delete account successfully', async () => {
      const user = {
        id: '123',
        passwordHash: 'hashed-password',
        role: 'customer'
      };

      mockAuth(user);
      bcrypt.compare.mockResolvedValue(true);
      mockUserRepository.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'correctPassword123' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Account deleted successfully'
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword123', 'hashed-password');
      expect(mockUserRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should reject incorrect password', async () => {
      const user = {
        id: '123',
        passwordHash: 'hashed-password',
        role: 'customer'
      };

      mockAuth(user);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'wrongPassword' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Password is incorrect');
    });

    it('should require password', async () => {
      const user = { id: '123', role: 'customer' };
      mockAuth(user);

      const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Admin endpoints', () => {
    beforeEach(() => {
      // Mock admin user
      const adminUser = { id: 'admin123', role: 'admin' };
      mockAuth(adminUser);
    });

    describe('GET /api/users/stats', () => {
      it('should get user statistics', async () => {
        const stats = {
          totalUsers: 100,
          customers: 95,
          admins: 5,
          recentSignups: 10
        };

        mockUserRepository.getUserStats.mockResolvedValue(stats);

        const response = await request(app)
          .get('/api/users/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({ stats });
      });

      it('should require admin role', async () => {
        const customerUser = { id: '123', role: 'customer' };
        mockAuth(customerUser);

        const response = await request(app)
          .get('/api/users/stats')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.error).toBe('Admin access required');
      });
    });

    describe('GET /api/users/search', () => {
      it('should search users successfully', async () => {
        const users = [
          { id: '1', email: 'john@example.com', firstName: 'John' },
          { id: '2', email: 'jane@example.com', firstName: 'Jane' }
        ];

        mockUserRepository.searchUsers.mockResolvedValue(users);

        const response = await request(app)
          .get('/api/users/search?q=john')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          users: [{ id: '1', email: 'john@example.com', firstName: 'John' }],
          pagination: expect.any(Object)
        });

        expect(mockUserRepository.searchUsers).toHaveBeenCalledWith('john');
      });

      it('should validate search query', async () => {
        const response = await request(app)
          .get('/api/users/search?q=a') // Too short
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.error).toBe('Validation Error');
      });
    });

    describe('GET /api/users', () => {
      it('should get all users with pagination', async () => {
        const users = [
          { id: '1', email: 'user1@example.com' },
          { id: '2', email: 'user2@example.com' }
        ];

        mockUserRepository.findAll.mockResolvedValue(users);

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          users,
          pagination: expect.any(Object)
        });
      });

      it('should filter by role', async () => {
        const customers = [
          { id: '1', email: 'customer@example.com', role: 'customer' }
        ];

        mockUserRepository.findByRole.mockResolvedValue(customers);

        const response = await request(app)
          .get('/api/users?role=customer')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockUserRepository.findByRole).toHaveBeenCalledWith('customer');
      });
    });
  });
});