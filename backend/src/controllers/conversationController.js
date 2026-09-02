const mongoose = require("mongoose");

const Conversation = require("../models/Converstion");
const Message = require("../models/Message");
const OrganizationMember = require("../models/OrganizationMember");
const User = require("../models/User");

// =====================================================
// HELPER
// Check active organization membership
// =====================================================

const getActiveOrganizationMembership = async (
  organizationId,
  userId
) => {
  return OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
    status: "Active",
  });
};

// =====================================================
// HELPER
// Check whether two users belong to the same
// organization
// =====================================================

const getActiveMemberInOrganization = async (
  organizationId,
  userId
) => {
  return OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
    status: "Active",
  });
};

// =====================================================
// HELPER
// Generate deterministic participant key
// =====================================================

const createParticipantKey = (
  organizationId,
  userId1,
  userId2
) => {
  const participants = [
    userId1.toString(),
    userId2.toString(),
  ].sort();

  return [
    organizationId.toString(),
    ...participants,
  ].join("_");
};

// =====================================================
// GET MY CONVERSATIONS
//
// GET
// /api/conversations?organizationId=...
// =====================================================

const getConversations = async (req, res) => {
  try {
    const { organizationId } = req.query;

    const userId = req.user._id;

    // -------------------------------------------------
    // VALIDATE ORGANIZATION ID
    // -------------------------------------------------

    if (
      !organizationId ||
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid organization ID is required",
      });
    }

    // -------------------------------------------------
    // CHECK CURRENT USER ORGANIZATION ACCESS
    // -------------------------------------------------

    const membership =
      await getActiveOrganizationMembership(
        organizationId,
        userId
      );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    // -------------------------------------------------
    // GET CONVERSATIONS
    // -------------------------------------------------

    const conversations =
      await Conversation.find({
        organization: organizationId,
        participants: userId,
      })
        .populate({
          path: "participants",
          select: "name email avatar",
        })
        .populate({
          path: "lastMessage",
          select:
            "sender receiver content createdAt isRead isDeleted",
        })
        .sort({
          lastMessageAt: -1,
          updatedAt: -1,
        });

    // -------------------------------------------------
    // RETURN CONVERSATIONS
    // Keep the response structure consistent with
    // createConversation()
    // -------------------------------------------------

    return res.status(200).json({
    success: true,
    conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch conversations",
    });
  }
};

// =====================================================
// CREATE / GET CONVERSATION
//
// POST
// /api/conversations
//
// Body:
// {
//   organizationId,
//   userId
// }
// =====================================================

const createConversation = async (
  req,
  res
) => {
  try {
    const {
      organizationId,
      userId: targetUserId,
    } = req.body;

    const currentUserId =
      req.user._id;

    // -------------------------------------------------
    // VALIDATE ORGANIZATION ID
    // -------------------------------------------------

    if (
      !organizationId ||
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid organization ID is required",
      });
    }

    // -------------------------------------------------
    // VALIDATE TARGET USER ID
    // -------------------------------------------------

    if (
      !targetUserId ||
      !mongoose.Types.ObjectId.isValid(
        targetUserId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // -------------------------------------------------
    // PREVENT SELF CHAT
    // -------------------------------------------------

    if (
      currentUserId.toString() ===
      targetUserId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot create a conversation with yourself",
      });
    }

    // -------------------------------------------------
    // CHECK CURRENT USER MEMBERSHIP
    // -------------------------------------------------

    const currentMembership =
      await getActiveOrganizationMembership(
        organizationId,
        currentUserId
      );

    if (!currentMembership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    // -------------------------------------------------
    // CHECK TARGET USER MEMBERSHIP
    // -------------------------------------------------

    const targetMembership =
      await getActiveMemberInOrganization(
        organizationId,
        targetUserId
      );

    if (!targetMembership) {
      return res.status(403).json({
        success: false,
        message:
          "The selected user is not an active member of this organization",
      });
    }

    // -------------------------------------------------
    // GENERATE PARTICIPANT KEY
    // -------------------------------------------------

    const participantKey =
      createParticipantKey(
        organizationId,
        currentUserId,
        targetUserId
      );

    // -------------------------------------------------
    // FIND EXISTING CONVERSATION
    // -------------------------------------------------

    let conversation =
      await Conversation.findOne({
        participantKey,
      })
        .populate({
          path: "participants",
          select: "name email avatar",
        })
        .populate({
          path: "lastMessage",
          select:
            "sender receiver content createdAt isRead isDeleted",
        });

    // -------------------------------------------------
    // RETURN EXISTING CONVERSATION
    // -------------------------------------------------

    if (conversation) {
      return res.status(200).json({
        success: true,
        existing: true,
        conversation,
      });
    }

    // -------------------------------------------------
    // CREATE NEW CONVERSATION
    // -------------------------------------------------

    try {
      conversation =
        await Conversation.create({
          organization:
            organizationId,

          participants: [
            currentUserId,
            targetUserId,
          ],

          participantKey,

          lastMessage: null,

          lastMessageAt: null,
        });
    } catch (error) {
      // -----------------------------------------------
      // HANDLE RACE CONDITION
      // Two users may create the same conversation
      // at exactly the same time.
      // -----------------------------------------------

      if (
        error.code === 11000
      ) {
        conversation =
          await Conversation.findOne({
            participantKey,
          })
            .populate({
              path: "participants",
              select: "name email avatar",
            })
            .populate({
              path: "lastMessage",
              select:
                "sender receiver content createdAt isRead isDeleted",
            });

        if (!conversation) {
          throw error;
        }

        return res.status(200).json({
          success: true,
          existing: true,
          conversation,
        });
      }

      throw error;
    }

    // -------------------------------------------------
    // POPULATE PARTICIPANTS
    // -------------------------------------------------

    await conversation.populate({
      path: "participants",
      select: "name email avatar",
    });

    return res.status(201).json({
      success: true,
      existing: false,
      conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create conversation",
    });
  }
};

// =====================================================
// GET CONVERSATION MESSAGES
//
// GET
// /api/conversations/:conversationId/messages
// =====================================================

const getConversationMessages =
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const userId =
        req.user._id;

      // -------------------------------------------------
      // VALIDATE CONVERSATION ID
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid conversation ID",
        });
      }

      // -------------------------------------------------
      // FIND CONVERSATION
      // -------------------------------------------------

      const conversation =
        await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this conversation",
        });
      }

      // -------------------------------------------------
      // PAGINATION
      // -------------------------------------------------

      const limit = Math.min(
        Number(req.query.limit) || 50,
        100
      );

      // -------------------------------------------------
      // FETCH MESSAGES
      // -------------------------------------------------

      const messages =
        await Message.find({
          conversation: conversationId,
        })
          .populate(
            "sender",
            "name email avatar"
          )
          .populate(
            "receiver",
            "name email avatar"
          )
          .populate(
            "replyTo",
            "content sender createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .limit(limit);

      // -------------------------------------------------
      // OLDEST → NEWEST
      // -------------------------------------------------

      messages.reverse();

      return res.status(200).json({
        success: true,
        count: messages.length,
        messages,
      });
    } catch (error) {
      console.error(
        "Get conversation messages error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch conversation messages",
      });
    }
  };

// =====================================================
// SEND INDIVIDUAL MESSAGE
//
// POST
// /api/conversations/:conversationId/messages
//
// Body:
// {
//   content
// }
// =====================================================

const sendConversationMessage =
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const userId =
        req.user._id;

      const content =
        req.body?.content;

      // -------------------------------------------------
      // VALIDATE CONVERSATION ID
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid conversation ID",
        });
      }

      // -------------------------------------------------
      // VALIDATE CONTENT
      // -------------------------------------------------

      if (
        !content ||
        !content.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message content is required",
        });
      }

      if (
        content.trim().length > 5000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message cannot exceed 5000 characters",
        });
      }

      // -------------------------------------------------
      // FIND CONVERSATION
      // -------------------------------------------------

      const conversation =
        await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this conversation",
        });
      }

      // -------------------------------------------------
      // FIND OTHER PARTICIPANT
      // -------------------------------------------------

      const receiver =
        conversation.participants.find(
          (participant) =>
            participant.toString() !==
            userId.toString()
        );

      if (!receiver) {
        return res.status(400).json({
          success: false,
          message:
            "Conversation receiver not found",
        });
      }

      // -------------------------------------------------
      // VERIFY RECEIVER IS STILL ACTIVE
      // -------------------------------------------------

      const receiverMembership =
        await getActiveMemberInOrganization(
          conversation.organization,
          receiver
        );

      if (!receiverMembership) {
        return res.status(403).json({
          success: false,
          message:
            "The other participant is no longer an active member of this organization",
        });
      }

      // -------------------------------------------------
      // CREATE MESSAGE
      // -------------------------------------------------

      const message =
        await Message.create({
          conversation:
            conversationId,

          sender:
            userId,

          receiver,

          content:
            content.trim(),

          isRead: false,

          readAt: null,

          replyTo: null,
        });

      // -------------------------------------------------
      // POPULATE MESSAGE
      // -------------------------------------------------

      await message.populate(
        "sender",
        "name email avatar"
      );

      await message.populate(
        "receiver",
        "name email avatar"
      );

      // -------------------------------------------------
      // UPDATE CONVERSATION
      // -------------------------------------------------

      conversation.lastMessage =
        message._id;

      conversation.lastMessageAt =
        message.createdAt;

      await conversation.save();

      // -------------------------------------------------
      // GET SOCKET.IO INSTANCE
      // -------------------------------------------------

      const io =
        req.app.get("io");

      // -------------------------------------------------
      // REAL-TIME MESSAGE
      // -------------------------------------------------

      if (io) {
        io.to(
          `conversation:${conversationId}`
        ).emit(
          "private-message",
          message
        );
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(201).json({
        success: true,
        message:
          "Message sent successfully",
        data: message,
      });
    } catch (error) {
      console.error(
        "Send conversation message error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send message",
      });
    }
  };

  // =====================================================
// CLEAR CONVERSATION
//
// DELETE
// /api/conversations/:conversationId/messages
// =====================================================

const clearConversation = async (
  req,
  res
) => {

  try {

    const {
      conversationId,
    } = req.params;

    const userId =
      req.user._id;

    // ------------------------------------------
    // Validate ID
    // ------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid conversation ID",
      });

    }

    // ------------------------------------------
    // Verify participant
    // ------------------------------------------

    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

    if (!conversation) {

      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this conversation",
      });

    }

    // ------------------------------------------
    // Delete all messages
    // ------------------------------------------

    await Message.deleteMany({
      conversation: conversationId,
    });

    // ------------------------------------------
    // Reset conversation
    // ------------------------------------------

    conversation.lastMessage = null;
    conversation.lastMessageAt = null;

    await conversation.save();

    // ------------------------------------------
    // Socket.IO
    // ------------------------------------------

    const io =
      req.app.get("io");

    if (io) {

      io.to(
        `conversation:${conversationId}`
      ).emit(
        "conversation-cleared",
        {
          conversationId,
        }
      );

    }

    return res.status(200).json({
      success: true,
      message:
        "Conversation cleared successfully",
    });

  } catch (error) {

    console.error(
      "Clear conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to clear conversation",
    });

  }

};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getConversations,
  createConversation,
  getConversationMessages,
  sendConversationMessage,
  clearConversation,
};