const express = require("express");

const {
  getProjectActivity,
} = require("../controllers/projectActivityController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET PROJECT ACTIVITY
// =====================================================

router.get(
  "/workspaces/:workspaceId/projects/:projectId/activity",
  protect,
  getProjectActivity
);


module.exports = router;