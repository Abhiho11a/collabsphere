const express = require("express");

const {
  superAdminLogin,
  superAdminLogout,
  getSuperAdminSession,
  getSuperAdminDashboard,

  deleteOrganization,
  deleteWorkspace,
  deleteProject,
} = require("../controllers/superAdminController");

const {
  protectSuperAdmin,
} = require("../middleware/superAdminMiddleware");

const router = express.Router();


// =====================================================
// AUTH
// =====================================================

router.post(
  "/login",
  superAdminLogin
);

router.post(
  "/logout",
  protectSuperAdmin,
  superAdminLogout
);

router.get(
  "/session",
  protectSuperAdmin,
  getSuperAdminSession
);


// =====================================================
// DASHBOARD
// =====================================================

router.get(
  "/dashboard",
  protectSuperAdmin,
  getSuperAdminDashboard
);


// =====================================================
// DELETE ORGANIZATION
// =====================================================

router.delete(
  "/organizations/:organizationId",
  protectSuperAdmin,
  deleteOrganization
);


// =====================================================
// DELETE WORKSPACE
// =====================================================

router.delete(
  "/workspaces/:workspaceId",
  protectSuperAdmin,
  deleteWorkspace
);


// =====================================================
// DELETE PROJECT
// =====================================================

router.delete(
  "/projects/:projectId",
  protectSuperAdmin,
  deleteProject
);


module.exports = router;