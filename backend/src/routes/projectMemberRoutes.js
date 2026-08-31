const express = require("express");

const {
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} = require("../controllers/projectMemberController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// PROJECT MEMBER ROUTES
// =====================================================

// Get project members
router.get(
  "/:workspaceId/projects/:projectId/members",
  protect,
  getProjectMembers
);

// Add project member
router.post(
  "/:workspaceId/projects/:projectId/members",
  protect,
  addProjectMember
);

// Change project member role
router.patch(
  "/:workspaceId/projects/:projectId/members/:memberId",
  protect,
  updateProjectMemberRole
);

// Remove project member
router.delete(
  "/:workspaceId/projects/:projectId/members/:memberId",
  protect,
  removeProjectMember
);

module.exports = router;