const jwt = require("jsonwebtoken");

const SUPERADMIN_COOKIE_NAME = "superAdminToken";

const protectSuperAdmin = (req, res, next) => {
  try {
    const token =
      req.cookies?.[SUPERADMIN_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Super Admin authentication required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.SUPERADMIN_JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Super Admin session is invalid or expired",
      });
    }

    if (
      !decoded ||
      decoded.type !== "superadmin"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid Super Admin session",
      });
    }

    req.superAdmin = {
      role: "superadmin",
    };

    next();
  } catch (error) {
    console.error(
      "Super Admin middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Super Admin authentication failed",
    });
  }
};

module.exports = {
  protectSuperAdmin,
};