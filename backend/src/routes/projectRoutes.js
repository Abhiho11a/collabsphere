const express = require("express");

const {
  createProject,
  getWorkspaceProjects,
  getProject,
  getMyProjects,
} = require("../controllers/projectController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// MY PROJECTS
// =====================================================

// Projects where current user is a member
router.get(
  "/projects/my",
  protect,
  getMyProjects
);

// =====================================================
// WORKSPACE PROJECTS
// =====================================================

// Create project inside workspace
router.post(
  "/workspaces/:workspaceId/projects",
  protect,
  createProject
);

// Get projects inside workspace
router.get(
  "/workspaces/:workspaceId/projects",
  protect,
  getWorkspaceProjects
);

// Get single project
router.get(
  "/workspaces/:workspaceId/projects/:projectId",
  protect,
  getProject
);

module.exports = router;