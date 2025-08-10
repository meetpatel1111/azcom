const UserRepository = require('../UserRepository');

// Mock the base repository
jest.mock('../BaseRepository');
const BaseRepository = require('../BaseRepository');

describe('UserRepository', () => {
  let userRepository;
  let mockBaseRepository;

  beforeEach(() => {
    mockBaseRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findWhere: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn()
    };

    BaseRepository.mockImplementation(() => mockBaseRepository);
    userRepository = new UserRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email (case insensitive)', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockBaseRepository.findOne.mockResolvedValue(user);

      const result = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(user);
      expect(mockBaseRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockBaseRepository.findOne.mockResolvedValue(user);

      const result = await userRepository.emailExists('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockBaseRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.emailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should exclude specified user ID', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockBaseRepository.findOne.mockResolvedValue(user);

      const result = await userRepository.emailExists('test@example.com', '1');

      expect(result).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should create user with default role', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const createdUser = { id: '1', ...userData, role: 'customer' };

      mockBaseRepository.findOne.mockResolvedValue(null); // Email doesn't exist
      mockBaseRepository.create.mockResolvedValue(createdUser);

      const result = await userRepository.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockBaseRepository.create).toHaveBeenCalledWith({
        ...userData,
        role: 'customer'
      });
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { id: '1', email: 'test@example.com' };
      mockBaseRepository.findOne.mockResolvedValue(existingUser);

      await expect(userRepository.createUser({ email: 'test@example.com' }))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const admins = [
        { id: '1', role: 'admin' },
        { id: '2', role: 'admin' }
      ];

      mockBaseRepository.findWhere.mockImplementation((predicate) => 
        [
          { id: '1', role: 'admin' },
          { id: '2', role: 'admin' },
          { id: '3', role: 'customer' }
        ].filter(predicate)
      );

      const result = await userRepository.findByRole('admin');

      expect(result).toHaveLength(2);
      expect(result.every(user => user.role === 'admin')).toBe(true);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without password hash', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User'
      };

      mockBaseRepository.findById.mockResolvedValue(user);

      const result = await userRepository.getUserProfile('1');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      mockBaseRepository.findById.mockResolvedValue(null);

      const result = await userRepository.getUserProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserStats', () => {
    it('should calculate user statistics', async () => {
      const users = [
        { role: 'customer', createdAt: new Date().toISOString() },
        { role: 'customer', createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
        { role: 'admin', createdAt: new Date().toISOString() }
      ];

      mockBaseRepository.findAll.mockResolvedValue(users);

      const result = await userRepository.getUserStats();

      expect(result).toEqual({
        totalUsers: 3,
        customers: 2,
        admins: 1,
        recentSignups: 2
      });
    });
  });
});