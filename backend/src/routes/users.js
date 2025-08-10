const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validation');
const Joi = require('joi');
const { 
  updateProfileSchema, 
  changePasswordSchema 
} = require('../models/User');
const {
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
} = require('../controllers/userController');

const router = express.Router();

/**
 * User Profile Routes
 * All routes are prefixed with /api/users
 */

// Validation schemas for query parameters
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const searchSchema = Joi.object({
  q: Joi.string().min(2).max(100).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const userListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid('customer', 'admin').optional()
});

const deleteAccountSchema = Joi.object({
  password: Joi.string().required().messages({
    'string.empty': 'Password is required to delete account'
  })
});

const userIdSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'User ID must be a valid UUID'
  })
});

/**
 * User Profile Routes (authenticated user's own profile)
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);

/**
 * @route   PUT /api/users/password
 * @desc    Change current user's password
 * @access  Private
 */
router.put('/password', authenticateToken, validateBody(changePasswordSchema), changePassword);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete current user's account
 * @access  Private
 */
router.delete('/profile', authenticateToken, validateBody(deleteAccountSchema), deleteAccount);

/**
 * Admin Routes (require admin role)
 */

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticateToken, requireAdmin, getUserStats);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private (Admin only)
 */
router.get('/search', authenticateToken, requireAdmin, validateQuery(searchSchema), searchUsers);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination
 * @access  Private (Admin only)
 */
router.get('/', authenticateToken, requireAdmin, validateQuery(userListSchema), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticateToken, requireAdmin, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, validateBody(updateProfileSchema), updateUserById);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

module.exports = router;