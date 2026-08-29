const jwt = require("jsonwebtoken");

const authConfig = require("../config/auth");


// ========================================
// Generate Access Token
// ========================================

const generateAccessToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: "access",
    },
    authConfig.accessTokenSecret,
    {
      expiresIn: authConfig.accessTokenExpiry,
    }
  );
};


// ========================================
// Generate Refresh Token
// ========================================

const generateRefreshToken = (userId, sessionId) => { 
  return jwt.sign(
    {
      userId,
      sessionId,
      type: "refresh",
    },
    authConfig.refreshTokenSecret,
    {
      expiresIn: authConfig.refreshTokenExpiry,
    }
  );
};


// ========================================
// Verify Access Token
// ========================================

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    authConfig.accessTokenSecret
  );
};


// ========================================
// Verify Refresh Token
// ========================================

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    authConfig.refreshTokenSecret
  );
};


module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};