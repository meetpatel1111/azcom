const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const CartRepository = require('../repositories/CartRepository');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { ConflictError, UnauthorizedError, ValidationError } = require('../middleware/errorHandler');
const { 
  validateRegisterUser, 
  validateLoginUser, 
  createUser, 
  sanitizeUser 
} = require('../models/User');

const userRepository = new UserRepository();
const cartRepository = new CartRepository();

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  // Validate request data
  const { error, value } = validateRegisterUser(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Registration validation failed', details);
  }

  const { email, password, firstName, lastName, address, role } = value;

  // Check if user already exists
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const userData = createUser({
    email,
    passwordHash,
    firstName,
    lastName,
    address,
    role
  });

  const user = await userRepository.createUser(userData);

  // Create empty cart for the user
  await cartRepository.getOrCreateCart(user.id);

  // Generate tokens
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update last login
  await userRepository.updateLastLogin(user.id);

  res.status(201).json({
    message: 'User registered successfully',
    user: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: '24h'
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  // Validate request data
  const { error, value } = validateLoginUser(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Login validation failed', details);
  }

  const { email, password } = value;

  // Find user by email
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update last login
  await userRepository.updateLastLogin(user.id);

  res.json({
    message: 'Login successful',
    user: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: '24h'
    }
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just return a success message
  // The client should remove the token from storage
  
  res.json({
    message: 'Logout successful'
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  try {
    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const decoded = jwt.verify(refreshToken, config.jwtSecret);

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new access token
    const accessToken = generateToken(user);

    res.json({
      message: 'Token refreshed successfully',
      tokens: {
        accessToken,
        expiresIn: '24h'
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User is already attached to req by auth middleware
  const user = await userRepository.findById(req.user.id);
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({
    user: sanitizeUser(user)
  });
});

/**
 * Verify email (placeholder for future implementation)
 * POST /api/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  // Placeholder for email verification functionality
  res.json({
    message: 'Email verification not implemented yet'
  });
});

/**
 * Request password reset (placeholder for future implementation)
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  // Placeholder for password reset functionality
  res.json({
    message: 'Password reset not implemented yet'
  });
});

/**
 * Reset password (placeholder for future implementation)
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  // Placeholder for password reset functionality
  res.json({
    message: 'Password reset not implemented yet'
  });
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword
};