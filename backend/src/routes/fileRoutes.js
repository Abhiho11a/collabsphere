const express = require("express");

const {
  getGlobalFiles,
  getOrganizationFiles,
  uploadOrganizationFile,
} = require("../controllers/fileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");

const router =
  express.Router();


// ==========================================
// LEGACY / GLOBAL FILES
// ==========================================

router.get(
  "/files",
  protect,
  getGlobalFiles
);


// ==========================================
// ORGANIZATION FILES
// ==========================================

router.get(
  "/files/organization",
  protect,
  getOrganizationFiles
);


// ==========================================
// ORGANIZATION FILE UPLOAD
// ==========================================

router.post(
  "/files/organization",
  protect,
  upload.single("file"),
  uploadOrganizationFile
);


module.exports = router;