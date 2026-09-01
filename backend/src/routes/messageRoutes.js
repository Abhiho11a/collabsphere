const express = require("express");

const router = express.Router();

const {
  getProjectMessages,
  sendProjectMessage,
  editMessage,
  deleteMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// IMPORTANT:
// Use the SAME authentication middleware
// that your existing project/task routes use.
//
// Example:
// const protect = require("../middleware/authMiddleware");


// Project messages
router.get(
  "/workspaces/:workspaceId/projects/:projectId/messages",
  protect,
  getProjectMessages
);

router.post(
  "/workspaces/:workspaceId/projects/:projectId/messages",
  protect,
  sendProjectMessage
);


// Individual message
router.patch(
  "/messages/:messageId",
  protect,
  editMessage
);

router.delete(
  "/messages/:messageId",
  protect,
  deleteMessage
);

module.exports = router;