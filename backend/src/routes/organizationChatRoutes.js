const express = require("express");
const multer = require("multer");

const {
  getOrganizationConversation,
  getOrganizationMessages,
  sendOrganizationMessage,
} = require("../controllers/organizationChatController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },
  });

router.get(
  "/:organizationId",
  protect,
  getOrganizationConversation
);

router.get(
  "/:organizationId/messages",
  protect,
  getOrganizationMessages
);

router.post(
  "/:organizationId/messages",
  protect,
  upload.single("file"),
  sendOrganizationMessage
);

module.exports = router;