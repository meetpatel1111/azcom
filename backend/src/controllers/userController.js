const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const { 
  validateUpdateProfile, 
  validateChangePassword,
  sanitizeUser 
} = require('../models/User');

const userRepository = new UserRepository();

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    user: sanitizeUser(user)
  });
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Validate request data
  const { error, value } = validateUpdateProfile(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Profile validation failed', details);
  }

  // Update user profile
  const updatedUser = await userRepository.updateProfile(req.user.id, value);
  
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }

  res.json({
    message: 'Profile updated successfully',
    user: sanitizeUser(updatedUser)
  });
});

/**
 * Change user password
 * PUT /api/users/password
 */
const changePassword = asyncHandler(async (req, res) => {
  // Validate request data
  const { error, value } = validateChangePassword(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Password validation failed', details);
  }

  const { currentPassword, newPassword } = value;

  // Get current user with password hash
  const user = await userRepository.findById(req.user.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  const success = await userRepository.changePassword(req.user.id, newPasswordHash);
  if (!success) {
    throw new NotFoundError('User not found');
  }

  res.json({
    message: 'Password changed successfully'
  });
});

/**
 * Delete user account
 * DELETE /api/users/profile
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to delete account');
  }

  // Get current user with password hash
  const user = await userRepository.findById(req.user.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Password is incorrect');
  }

  // Delete user account
  const success = await userRepository.delete(req.user.id);
  if (!success) {
    throw new NotFoundError('User not found');
  }

  res.json({
    message: 'Account deleted successfully'
  });
});

/**
 * Get user statistics (admin only)
 * GET /api/users/stats
 */
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userRepository.getUserStats();
  
  res.json({
    stats
  });
});

/**
 * Search users (admin only)
 * GET /api/users/search
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters long');
  }

  const users = await userRepository.searchUsers(query.trim());
  
  // Apply pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  const paginatedUsers = users.slice(offset, offset + limitNum);
  const sanitizedUsers = paginatedUsers.map(user => sanitizeUser(user));

  res.json({
    users: sanitizedUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: users.length,
      totalPages: Math.ceil(users.length / limitNum),
      hasNext: offset + limitNum < users.length,
      hasPrev: pageNum > 1
    }
  });
});

/**
 * Get all users (admin only)
 * GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role } = req.query;

  let users;
  if (role) {
    users = await userRepository.findByRole(role);
  } else {
    users = await userRepository.findAll();
  }

  // Apply pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  const paginatedUsers = users.slice(offset, offset + limitNum);
  const sanitizedUsers = paginatedUsers.map(user => sanitizeUser(user));

  res.json({
    users: sanitizedUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: users.length,
      totalPages: Math.ceil(users.length / limitNum),
      hasNext: offset + limitNum < users.length,
      hasPrev: pageNum > 1
    }
  });
});

/**
 * Get user by ID (admin only)
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    user: sanitizeUser(user)
  });
});

/**
 * Update user by ID (admin only)
 * PUT /api/users/:id
 */
const updateUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate request data
  const { error, value } = validateUpdateProfile(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Profile validation failed', details);
  }

  // Update user
  const updatedUser = await userRepository.updateUser(id, value);
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }

  res.json({
    message: 'User updated successfully',
    user: sanitizeUser(updatedUser)
  });
});

/**
 * Delete user by ID (admin only)
 * DELETE /api/users/:id
 */
const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Prevent admin from deleting themselves
  if (id === req.user.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  const success = await userRepository.delete(id);
  if (!success) {
    throw new NotFoundError('User not found');
  }

  res.json({
    message: 'User deleted successfully'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserStats,
  searchUsers,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById
};