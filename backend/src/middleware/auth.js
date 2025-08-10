const jwt = require('jsonwebtoken');
const config = require('../config');
const UserRepository = require('../repositories/UserRepository');

const userRepository = new UserRepository();

/**
 * JWT Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Get user from database to ensure they still exist
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User no longer exists'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The provided token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(decoded.userId);
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    req.user = null;
    next();
  }
};

/**
 * Admin role authorization middleware
 * Requires user to be authenticated and have admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'You do not have permission to access this resource'
    });
  }

  next();
};

/**
 * User ownership authorization middleware
 * Ensures user can only access their own resources
 */
const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '24h',
    issuer: 'online-shopping-platform'
  });
};

/**
 * Generate refresh token for user
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
    issuer: 'online-shopping-platform'
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireOwnership,
  generateToken,
  generateRefreshToken
};