const express = require("express");

const {
  uploadProjectFile,
  getProjectFiles,
  deleteProjectFile,
} = require("../controllers/projectFileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();


// ========================================
// GET PROJECT FILES
// ========================================

router.get(
  "/workspaces/:workspaceId/projects/:projectId/files",
  protect,
  getProjectFiles
);


// ========================================
// UPLOAD PROJECT FILE
// ========================================

router.post(
  "/workspaces/:workspaceId/projects/:projectId/files",
  protect,
  upload.single("file"),
  uploadProjectFile
);


// ========================================
// DELETE PROJECT FILE
// ========================================

router.delete(
  "/workspaces/:workspaceId/projects/:projectId/files/:fileId",
  protect,
  deleteProjectFile
);


module.exports = router;