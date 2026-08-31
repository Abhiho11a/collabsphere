const express = require("express");

const {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceSummary,
} = require("../controllers/workspaceController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// WORKSPACE ROUTES
// ========================================

router.post(
  "/",
  protect,
  createWorkspace
);

router.get(
  "/",
  protect,
  getMyWorkspaces
);

router.get(
  "/:workspaceId",
  protect,
  getWorkspace
);

router.patch(
  "/:workspaceId",
  protect,
  updateWorkspace
);

router.delete(
  "/:workspaceId",
  protect,
  deleteWorkspace
);

router.get(
  "/:workspaceId/summary",
  protect,
  getWorkspaceSummary
);

module.exports = router;