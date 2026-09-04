const express = require("express");

const {
  register,
  login,
  getCurrentUser,
  refreshAccessToken,
  logout,
  getSessions,
  revokeSession,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleCallback,
  updateProfile,
  getCollaborationToken,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// PUBLIC ROUTES
// ========================================

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/refresh",
  refreshAccessToken
);


// ========================================
// PROTECTED ROUTES
// ========================================

router.get(
  "/me",
  protect,
  getCurrentUser
);

router.post(
  "/logout",
  logout
);

router.get(
  "/sessions",
  protect,
  getSessions
);

router.delete(
  "/sessions/:sessionId",
  protect,
  revokeSession
);



router.get(
  "/verify-email",
  verifyEmail
);
router.post(
  "/forgot-password",
  forgotPassword
);
router.post(
  "/reset-password",
  resetPassword
);
router.get(
  "/google",
  googleLogin
);

router.get(
  "/google/callback",
  googleCallback
);

router.patch(
  "/profile",
  protect,
  updateProfile
);

router.get(
  "/collaboration-token",
  protect,
  getCollaborationToken
);

module.exports = router;