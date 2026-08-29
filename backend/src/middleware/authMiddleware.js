const User = require("../models/User");

const { verifyAccessToken } = require("../utils/token");

const protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = verifyAccessToken(accessToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Access token is invalid or expired",
      });
    }

    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = {
  protect,
};