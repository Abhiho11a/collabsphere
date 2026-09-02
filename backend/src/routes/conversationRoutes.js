const express = require("express");

const {
  getConversations,
  createConversation,
  getConversationMessages,
  sendConversationMessage,
  clearConversation,
} = require("../controllers/conversationController");

// IMPORTANT:
// Use the SAME protect middleware import/path
// that your existing organizationRoutes.js uses.
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET ALL CONVERSATIONS
// GET /api/conversations?organizationId=...
// =====================================================

router.get(
  "/",
  protect,
  getConversations
);

// =====================================================
// CREATE / GET ONE-TO-ONE CONVERSATION
// POST /api/conversations
// =====================================================

router.post(
  "/",
  protect,
  createConversation
);

// =====================================================
// GET CONVERSATION MESSAGES
// GET /api/conversations/:conversationId/messages
// =====================================================

router.get(
  "/:conversationId/messages",
  protect,
  getConversationMessages
);

// =====================================================
// SEND CONVERSATION MESSAGE
// POST /api/conversations/:conversationId/messages
// =====================================================

router.post(
  "/:conversationId/messages",
  protect,
  sendConversationMessage
);

router.delete(
  "/:conversationId/messages",
  protect,
  clearConversation
);

module.exports = router;