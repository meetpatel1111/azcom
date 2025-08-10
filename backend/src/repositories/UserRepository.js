const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor(fileManager = null) {
    super('users.json', fileManager);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    return this.findOne(user => 
      user.email && user.email.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Check if email already exists
   * @param {string} email - Email to check
   * @param {string} excludeId - User ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email, excludeId = null) {
    const user = await this.findByEmail(email);
    return user !== null && user.id !== excludeId;
  }

  /**
   * Create user with email uniqueness check
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    if (await this.emailExists(userData.email)) {
      throw new Error('Email already exists');
    }

    // Ensure role is set
    const userWithRole = {
      ...userData,
      role: userData.role || 'customer'
    };

    return this.create(userWithRole);
  }

  /**
   * Update user with email uniqueness check
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateUser(id, updateData) {
    if (updateData.email && await this.emailExists(updateData.email, id)) {
      throw new Error('Email already exists');
    }

    return this.update(id, updateData);
  }

  /**
   * Find users by role
   * @param {string} role - User role (customer, admin)
   * @returns {Promise<Array>} Users with specified role
   */
  async findByRole(role) {
    return this.findWhere(user => user.role === role);
  }

  /**
   * Get all admin users
   * @returns {Promise<Array>} Admin users
   */
  async findAdmins() {
    return this.findByRole('admin');
  }

  /**
   * Get all customer users
   * @returns {Promise<Array>} Customer users
   */
  async findCustomers() {
    return this.findByRole('customer');
  }

  /**
   * Update user's last login timestamp
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateLastLogin(userId) {
    return this.update(userId, { 
      lastLoginAt: new Date().toISOString() 
    });
  }

  /**
   * Search users by name or email
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching users
   */
  async searchUsers(query) {
    const searchTerm = query.toLowerCase();
    return this.findWhere(user => 
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get user profile (without sensitive data)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User profile or null
   */
  async getUserProfile(userId) {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    // Remove sensitive data
    const { passwordHash, ...profile } = user;
    return profile;
  }

  /**
   * Update user profile (excluding sensitive fields)
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object|null>} Updated profile or null
   */
  async updateProfile(userId, profileData) {
    // Remove sensitive fields that shouldn't be updated via profile
    const { passwordHash, role, id, createdAt, ...safeData } = profileData;
    
    const updatedUser = await this.updateUser(userId, safeData);
    if (!updatedUser) {
      return null;
    }

    // Return profile without sensitive data
    const { passwordHash: _, ...profile } = updatedUser;
    return profile;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} newPasswordHash - New password hash
   * @returns {Promise<boolean>} True if successful
   */
  async changePassword(userId, newPasswordHash) {
    const updatedUser = await this.update(userId, { 
      passwordHash: newPasswordHash 
    });
    return updatedUser !== null;
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    const users = await this.findAll();
    
    const stats = {
      totalUsers: users.length,
      customers: users.filter(u => u.role === 'customer').length,
      admins: users.filter(u => u.role === 'admin').length,
      recentSignups: 0
    };

    // Count users who signed up in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recentSignups = users.filter(user => 
      new Date(user.createdAt) > thirtyDaysAgo
    ).length;

    return stats;
  }
}

module.exports = UserRepository;