const express = require("express");

const {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} = require("../controllers/workspaceMemberController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// WORKSPACE MEMBER ROUTES
// ========================================

// Get members
router.get(
  "/:workspaceId/members",
  protect,
  getWorkspaceMembers
);


// Add member
router.post(
  "/:workspaceId/members",
  protect,
  addWorkspaceMember
);


// Change role
router.patch(
  "/:workspaceId/members/:memberId",
  protect,
  updateWorkspaceMemberRole
);


// Remove member
router.delete(
  "/:workspaceId/members/:memberId",
  protect,
  removeWorkspaceMember
);


module.exports = router;