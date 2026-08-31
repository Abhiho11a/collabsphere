const express = require("express");

const {
  uploadWorkspaceFile,
  getWorkspaceFiles,
  deleteWorkspaceFile,
} = require("../controllers/workspaceFileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");

const router = express.Router();


// ========================================
// GET WORKSPACE FILES
// ========================================

router.get(
  "/workspaces/:workspaceId/files",
  protect,
  getWorkspaceFiles
);


// ========================================
// UPLOAD WORKSPACE FILE
// ========================================

router.post(
  "/workspaces/:workspaceId/files",
  protect,
  upload.single("file"),
  uploadWorkspaceFile
);


// ========================================
// DELETE WORKSPACE FILE
// ========================================

router.delete(
  "/workspaces/:workspaceId/files/:fileId",
  protect,
  deleteWorkspaceFile
);


module.exports = router;