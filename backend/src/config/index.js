require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  dataPath: process.env.DATA_PATH || '../data',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};