const {
  validateRegisterUser,
  validateLoginUser,
  validateUpdateProfile,
  validateChangePassword,
  createUser,
  sanitizeUser,
  getUserFullName,
  isAdmin
} = require('../User');

describe('User Model', () => {
  describe('validateRegisterUser', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      }
    };

    it('should validate valid user registration data', () => {
      const { error, value } = validateRegisterUser(validUserData);
      
      expect(error).toBeUndefined();
      expect(value.email).toBe('test@example.com');
      expect(value.role).toBe('customer'); // default role
    });

    it('should require valid email', () => {
      const { error } = validateRegisterUser({ ...validUserData, email: 'invalid-email' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Please provide a valid email address');
    });

    it('should require strong password', () => {
      const { error } = validateRegisterUser({ ...validUserData, password: 'weak' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Password must contain at least one lowercase letter');
    });

    it('should require minimum password length', () => {
      const { error } = validateRegisterUser({ ...validUserData, password: 'Pass1' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Password must be at least 8 characters long');
    });

    it('should require first name', () => {
      const { error } = validateRegisterUser({ ...validUserData, firstName: '' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('First name is required');
    });

    it('should require last name', () => {
      const { error } = validateRegisterUser({ ...validUserData, lastName: '' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Last name is required');
    });

    it('should validate address if provided', () => {
      const invalidAddress = { ...validUserData, address: { street: '' } };
      const { error } = validateRegisterUser(invalidAddress);
      
      expect(error).toBeDefined();
      expect(error.details.some(detail => detail.message.includes('Street address is required'))).toBe(true);
    });

    it('should allow valid roles', () => {
      const adminUser = { ...validUserData, role: 'admin' };
      const { error } = validateRegisterUser(adminUser);
      
      expect(error).toBeUndefined();
    });

    it('should reject invalid roles', () => {
      const invalidRole = { ...validUserData, role: 'invalid' };
      const { error } = validateRegisterUser(invalidRole);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Role must be either customer or admin');
    });
  });

  describe('validateLoginUser', () => {
    it('should validate valid login data', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error, value } = validateLoginUser(loginData);
      
      expect(error).toBeUndefined();
      expect(value.email).toBe('test@example.com');
    });

    it('should require email', () => {
      const { error } = validateLoginUser({ password: 'password123' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Email is required');
    });

    it('should require password', () => {
      const { error } = validateLoginUser({ email: 'test@example.com' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Password is required');
    });
  });

  describe('validateUpdateProfile', () => {
    it('should validate profile update data', () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        address: {
          street: '456 Oak Ave',
          city: 'Newtown',
          state: 'NY',
          zipCode: '67890'
        }
      };

      const { error } = validateUpdateProfile(updateData);
      
      expect(error).toBeUndefined();
    });

    it('should allow partial updates', () => {
      const { error } = validateUpdateProfile({ firstName: 'Jane' });
      
      expect(error).toBeUndefined();
    });

    it('should validate name lengths', () => {
      const longName = 'a'.repeat(51);
      const { error } = validateUpdateProfile({ firstName: longName });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('First name cannot exceed 50 characters');
    });
  });

  describe('validateChangePassword', () => {
    it('should validate password change data', () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'NewPassword456'
      };

      const { error } = validateChangePassword(passwordData);
      
      expect(error).toBeUndefined();
    });

    it('should require current password', () => {
      const { error } = validateChangePassword({ newPassword: 'NewPassword456' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Current password is required');
    });

    it('should validate new password strength', () => {
      const { error } = validateChangePassword({
        currentPassword: 'oldPassword123',
        newPassword: 'weak'
      });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('New password must contain');
    });
  });

  describe('createUser', () => {
    it('should create user with all fields', () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        address: { street: '123 Main St' },
        role: 'admin'
      };

      const user = createUser(userData);

      expect(user).toEqual({
        email: 'test@example.com', // should be lowercase
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        address: { street: '123 Main St' },
        role: 'admin'
      });
    });

    it('should set default role and null address', () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = createUser(userData);

      expect(user.role).toBe('customer');
      expect(user.address).toBeNull();
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password hash', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'secret-hash',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized.passwordHash).toBeUndefined();
      expect(sanitized).toEqual({
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      });
    });
  });

  describe('getUserFullName', () => {
    it('should return full name', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      
      expect(getUserFullName(user)).toBe('John Doe');
    });

    it('should handle missing names', () => {
      const user = { firstName: 'John', lastName: '' };
      
      expect(getUserFullName(user)).toBe('John');
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', () => {
      const user = { role: 'admin' };
      
      expect(isAdmin(user)).toBe(true);
    });

    it('should return false for customer users', () => {
      const user = { role: 'customer' };
      
      expect(isAdmin(user)).toBe(false);
    });
  });
});