const express = require("express");

const {
  getGlobalFiles,
  getOrganizationFiles,
  uploadOrganizationFile,
  deleteOrganizationFile,
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


router.delete(
  "/files/organization/:fileId",
  protect,
  deleteOrganizationFile
);

module.exports = router;