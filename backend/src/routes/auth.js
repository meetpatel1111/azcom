const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { 
  registerUserSchema, 
  loginUserSchema 
} = require('../models/User');
const {
  register,
  login,
  logout,
  refresh,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

/**
 * Authentication Routes
 * All routes are prefixed with /api/auth
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateBody(registerUserSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateBody(loginUserSchema), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refresh);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 */
router.post('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password', resetPassword);

module.exports = router;