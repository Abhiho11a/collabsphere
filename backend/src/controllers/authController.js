const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const Session = require("../models/Session");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

const authConfig = require("../config/auth");
const { default: mongoose } = require("mongoose");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../services/emailService");
const { generateSecureToken, hashToken } = require("../utils/crypto");
const { getGoogleConfig, exchangeCodeForTokens, getAuthorizationUrl } = require("../services/googleOauth");
const { generateState, generateCodeChallenge, generateCodeVerifier, generateNonce } = require("../utils/oauth");

// ========================================
// REGISTER
// ========================================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const verificationToken =
      generateSecureToken();

    const verificationTokenHash =
      hashToken(verificationToken);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      provider: "local",

      emailVerificationTokenHash:
        verificationTokenHash,

      emailVerificationTokenExpiresAt:
        new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),
    });

    const verificationUrl =
      `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
        normalizedEmail
      )}`;

    await sendVerificationEmail(
      normalizedEmail,
      user.name,
      verificationUrl
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });

  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the account",
    });
  }
};


// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const sessionId = new mongoose.Types.ObjectId();

    const accessToken = generateAccessToken(
      user._id.toString()
    );

    const refreshToken = generateRefreshToken(
      user._id.toString(),
      sessionId
    );

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      12
    );

    await Session.create({
      _id: sessionId,
      user: user._id,
      refreshTokenHash,
      userAgent: req.get("user-agent") || "Unknown",
      ipAddress:
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "Unknown",
      lastUsedAt: new Date(),
      expiresAt: new Date(
        Date.now() + 18 * 24 * 60 * 60 * 1000
      ),
    });

    user.lastLogin = new Date();

    await user.save();

    const cookieOptions = {
      ...authConfig.cookieOptions,
      path: "/",
    };

    res.cookie(
      "accessToken",
      accessToken,
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      }
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};


// ========================================
// GET CURRENT USER
// ========================================

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch current user",
    });
  }
};


// ========================================
// REFRESH ACCESS TOKEN
// ========================================

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or expired",
      });
    }

    if (
      decoded.type !== "refresh" ||
      !decoded.sessionId
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const session = await Session.findById(
      decoded.sessionId
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session no longer exists",
      });
    }

    if (session.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session has expired",
      });
    }

    const isRefreshTokenValid =
      await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash
      );

    if (!isRefreshTokenValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = await User.findById(
      decoded.userId
    );

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

    const newAccessToken =
      generateAccessToken(
        user._id.toString()
      );

    session.lastUsedAt = new Date();

    await session.save();

    res.cookie(
      "accessToken",
      newAccessToken,
      {
        ...authConfig.cookieOptions,
        path: "/",
        maxAge: 15 * 60 * 1000,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
    });

  } catch (error) {
    console.error(
      "Refresh token error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to refresh access token",
    });
  }
};

// ========================================
// LOGOUT
// ========================================

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // If a refresh token exists, try to revoke
    // its associated session.
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);

        if (decoded.sessionId) {
          await Session.findOneAndUpdate(
            {
              _id: decoded.sessionId,
              user: decoded.userId,
              revokedAt: null,
            },
            {
              revokedAt: new Date(),
            }
          );
        }
      } catch (error) {
        // Even if the refresh token is invalid,
        // logout should still clear the cookies.
        console.log("Session revoke skipped:", error.message);
      }
    }

    // Clear authentication cookies
    res.clearCookie("accessToken", {
      ...authConfig.cookieOptions,
      path: "/",
    });

    res.clearCookie("refreshToken", {
      ...authConfig.cookieOptions,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout",
    });
  }
};

//Get Sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      user: req.user._id,
      revokedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    })
      .select(
        "_id userAgent ipAddress lastUsedAt createdAt expiresAt"
      )
      .sort({
        lastUsedAt: -1,
      });

    return res.status(200).json({
      success: true,
      sessions,
    });

  } catch (error) {
    console.error(
      "Get sessions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch sessions",
    });
  }
};
//Revoke Session
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
      revokedAt: null,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    session.revokedAt = new Date();

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully",
    });

  } catch (error) {
    console.error(
      "Revoke session error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to revoke session",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
      Important security behavior:

      We return the same response whether
      the email exists or not.

      This prevents account enumeration.
    */

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
    }

    // Google-only users don't have a local password
    if (user.provider === "google" && !user.password) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
    }

    const resetToken =
      generateSecureToken();

    const resetTokenHash =
      hashToken(resetToken);

    user.passwordResetTokenHash =
      resetTokenHash;

    user.passwordResetTokenExpiresAt =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await user.save();

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
        normalizedEmail
      )}`;

    await sendPasswordResetEmail(
      normalizedEmail,
      user.name,
      resetUrl
    );

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent",
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      email: normalizedEmail,
      emailVerificationTokenHash: tokenHash,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link",
      });
    }

    if (
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired",
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    user.emailVerified = true;

    user.emailVerificationTokenHash = null;

    user.emailVerificationTokenExpiresAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify email",
    });
  }
};
const resetPassword = async (req, res) => {
  try {
    const {
      token,
      email,
      newPassword,
    } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Token, email and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const tokenHash =
      hashToken(token);

    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetTokenHash: tokenHash,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset link",
      });
    }

    if (
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset link has expired",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password = hashedPassword;

    // Invalidate reset token
    user.passwordResetTokenHash = null;

    user.passwordResetTokenExpiresAt = null;

    await user.save();

    /*
      Important:
      Password reset should invalidate
      existing login sessions.
    */

    await Session.updateMany(
      {
        user: user._id,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login again.",
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password",
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const state = generateState();

    const codeVerifier = generateCodeVerifier();
    const nonce = generateNonce();

    const authorizationUrl = await getAuthorizationUrl(
      state,
      codeVerifier,
      nonce
    );

    const oauthCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    };

    res.cookie(
      "oauthState",
      state,
      oauthCookieOptions
    );

    res.cookie(
      "oauthCodeVerifier",
      codeVerifier,
      oauthCookieOptions
    );

    res.cookie(
      "oauthNonce",
      nonce,
      oauthCookieOptions
    );

    return res.redirect(
      authorizationUrl.toString()
    );

  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to start Google login",
    });
  }
};

const googleCallback = async (req, res) => {
  try {
    const {
      state,
      code,
    } = req.query;

    const storedState =
      req.cookies.oauthState;

    const codeVerifier =
      req.cookies.oauthCodeVerifier;

    const storedNonce =
      req.cookies.oauthNonce; 

    if (
      !state ||
      !code ||
      !storedState ||
      !codeVerifier ||
      !storedNonce
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OAuth request",
      });
    }

    if (state !== storedState) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OAuth state",
      });
    }

    const currentUrl =
      new URL(
        `${process.env.GOOGLE_REDIRECT_URI}?${new URLSearchParams(
          req.query
        ).toString()}`
      );

    const tokens =
    await exchangeCodeForTokens(
      currentUrl,
      codeVerifier,
      storedState,
      storedNonce
    );

    const claims = tokens.claims();

    if (!claims || !claims.email) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to retrieve Google account information",
      });
    }

    const email =
      claims.email
        .toLowerCase()
        .trim();

    let user =
      await User.findOne({
        email,
      });

    if (!user) {
      user = await User.create({
        name:
          claims.name ||
          email.split("@")[0],

        email,

        avatar:
          claims.picture || "",

        provider: "google",

        emailVerified: true,
      });
    } else {
      if (
        user.provider === "local" &&
        !user.password
      ) {
        user.provider = "google";
      }

      user.emailVerified = true;

      if (
        claims.picture &&
        !user.avatar
      ) {
        user.avatar =
          claims.picture;
      }

      await user.save();
    }

    const sessionId =
      new mongoose.Types.ObjectId();

    const accessToken =
      generateAccessToken(
        user._id.toString()
      );

    const refreshToken =
      generateRefreshToken(
        user._id.toString(),
        sessionId
      );

    const refreshTokenHash =
      await bcrypt.hash(
        refreshToken,
        12
      );

    await Session.create({
      _id: sessionId,
      user: user._id,
      refreshTokenHash,
      userAgent:
        req.get("user-agent") ||
        "Unknown",
      ipAddress:
        req.headers[
          "x-forwarded-for"
        ]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "Unknown",
      lastUsedAt: new Date(),
      expiresAt: new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ),
    });

    user.lastLogin =
      new Date();

    await user.save();

    const cookieOptions = {
      ...authConfig.cookieOptions,
      path: "/",
    };

    res.cookie(
      "accessToken",
      accessToken,
      {
        ...cookieOptions,
        maxAge:
          15 * 60 * 1000,
      }
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      {
        ...cookieOptions,
        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );

    res.clearCookie(
      "oauthState",
      {
        ...cookieOptions,
        path: "/",
      }
    );

    res.clearCookie(
      "oauthCodeVerifier",
      {
        ...cookieOptions,
        path: "/",
      }
    );
    res.clearCookie(
      "oauthNonce",
      {
        ...cookieOptions,
        path: "/",
      }
    );

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard`
    );

  } catch (error) {
    console.error(
      "Google callback error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Google authentication failed",
    });
  }
};

// ========================================
// UPDATE CURRENT USER PROFILE
// PATCH /api/auth/profile
// ========================================

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      avatar,
    } = req.body;

    // ========================================
    // VALIDATE NAME
    // ========================================

    if (
      name !== undefined &&
      (!name || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (
      name !== undefined &&
      name.trim().length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters",
      });
    }

    if (
      name !== undefined &&
      name.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 50 characters",
      });
    }

    // ========================================
    // VALIDATE AVATAR
    // ========================================

    if (
      avatar !== undefined &&
      avatar !== null &&
      typeof avatar !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar",
      });
    }

    // ========================================
    // FIND USER
    // ========================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================
    // UPDATE NAME
    // ========================================

    if (name !== undefined) {
      user.name = name.trim();
    }

    // ========================================
    // UPDATE AVATAR
    // ========================================

    if (avatar !== undefined) {
      user.avatar = avatar || "";
    }

    // ========================================
    // SAVE
    // ========================================

    await user.save();

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message:
        "Profile updated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        emailVerified:
          user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {

    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update profile",
    });
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
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
  updateProfile
};