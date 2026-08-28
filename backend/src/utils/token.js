const jwt = require("jsonwebtoken");

const authConfig = require("../config/auth");

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

const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: "refresh",
    },
    authConfig.refreshTokenSecret,
    {
      expiresIn: authConfig.refreshTokenExpiry,
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, authConfig.accessTokenSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, authConfig.refreshTokenSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};