const express = require("express");

const {
  getGlobalFiles,
} = require("../controllers/fileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GLOBAL FILES
// ========================================

router.get(
  "/files",
  protect,
  getGlobalFiles
);


module.exports = router;