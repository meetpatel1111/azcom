const Joi = require('joi');

/**
 * User data model interface (TypeScript-style documentation)
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} email - User email address
 * @property {string} passwordHash - Hashed password
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {Object} address - User's address
 * @property {string} address.street - Street address
 * @property {string} address.city - City
 * @property {string} address.state - State/Province
 * @property {string} address.zipCode - ZIP/Postal code
 * @property {string} role - User role (customer|admin)
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 * @property {string} lastLoginAt - ISO timestamp of last login
 */

/**
 * Address validation schema
 */
const addressSchema = Joi.object({
  street: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Street address is required',
      'string.max': 'Street address cannot exceed 200 characters'
    }),

  city: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'City is required',
      'string.max': 'City cannot exceed 100 characters'
    }),

  state: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'State/Province is required',
      'string.max': 'State/Province cannot exceed 100 characters'
    }),

  zipCode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9\s-]{3,20}$/)
    .required()
    .messages({
      'string.empty': 'ZIP/Postal code is required',
      'string.pattern.base': 'ZIP/Postal code format is invalid'
    })
});

/**
 * Joi validation schema for User registration
 */
const registerUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'string.empty': 'Password is required'
    }),

  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name cannot exceed 50 characters'
    }),

  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name cannot exceed 50 characters'
    }),

  address: addressSchema.optional(),

  role: Joi.string()
    .valid('customer', 'admin')
    .default('customer')
    .messages({
      'any.only': 'Role must be either customer or admin'
    })
});

/**
 * Joi validation schema for User login
 */
const loginUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

/**
 * Joi validation schema for User profile updates
 */
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'First name cannot be empty',
      'string.max': 'First name cannot exceed 50 characters'
    }),

  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'Last name cannot be empty',
      'string.max': 'Last name cannot exceed 50 characters'
    }),

  address: addressSchema.optional()
});

/**
 * Joi validation schema for password change
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
      'string.empty': 'New password is required'
    })
});

/**
 * Validate user registration data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
function validateRegisterUser(userData) {
  return registerUserSchema.validate(userData, { abortEarly: false });
}

/**
 * Validate user login data
 * @param {Object} loginData - Login data to validate
 * @returns {Object} Validation result
 */
function validateLoginUser(loginData) {
  return loginUserSchema.validate(loginData, { abortEarly: false });
}

/**
 * Validate user profile update data
 * @param {Object} profileData - Profile data to validate
 * @returns {Object} Validation result
 */
function validateUpdateProfile(profileData) {
  return updateProfileSchema.validate(profileData, { abortEarly: false });
}

/**
 * Validate password change data
 * @param {Object} passwordData - Password change data to validate
 * @returns {Object} Validation result
 */
function validateChangePassword(passwordData) {
  return changePasswordSchema.validate(passwordData, { abortEarly: false });
}

/**
 * Create a new user object with defaults
 * @param {Object} userData - User data
 * @returns {Object} User object
 */
function createUser(userData) {
  return {
    email: userData.email.toLowerCase(),
    passwordHash: userData.passwordHash,
    firstName: userData.firstName,
    lastName: userData.lastName,
    address: userData.address || null,
    role: userData.role || 'customer'
  };
}

/**
 * Sanitize user data for API responses (remove sensitive data)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user
 */
function sanitizeUser(user) {
  const { passwordHash, ...sanitizedUser } = user;
  return sanitizedUser;
}

/**
 * Get user's full name
 * @param {Object} user - User object
 * @returns {string} Full name
 */
function getUserFullName(user) {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
function isAdmin(user) {
  return user.role === 'admin';
}

module.exports = {
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
  validateRegisterUser,
  validateLoginUser,
  validateUpdateProfile,
  validateChangePassword,
  createUser,
  sanitizeUser,
  getUserFullName,
  isAdmin
};