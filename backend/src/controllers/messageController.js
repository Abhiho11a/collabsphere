const mongoose = require("mongoose");

const Message = require("../models/Message");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const WorkspaceMember = require("../models/WorkspaceMember");

const OrganizationMember =
  require("../models/OrganizationMember");

  
// =====================================================
// HELPER
// Check whether user is an ACTIVE project member
// =====================================================

const getActiveProjectMember = async (
  projectId,
  userId
) => {
  return await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: "Active",
  });
};


// =====================================================
// GET PROJECT MESSAGES
//
// GET
// /api/workspaces/:workspaceId/projects/:projectId/messages
// =====================================================

const getProjectMessages = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    const userId = req.user._id;

    // -------------------------------------------------
    // Validate IDs
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // -------------------------------------------------
    // Check workspace membership
    // -------------------------------------------------

    const workspaceMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        status: "Active",
      });

    if (!workspaceMember) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this workspace",
      });
    }

    // -------------------------------------------------
    // Find project
    // -------------------------------------------------

    const project =
      await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
        isActive: true,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // IMPORTANT
    // User must be an ACTIVE project member
    // -------------------------------------------------

    const projectMember =
      await getActiveProjectMember(
        projectId,
        userId
      );

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message:
          "You are not an active member of this project",
      });
    }

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const limit = Math.min(
      Number(req.query.limit) || 50,
      100
    );

    const messages =
      await Message.find({
        project: projectId,
        workspace: workspaceId,
      })
        .populate(
          "sender",
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
    // Return oldest → newest
    // -------------------------------------------------

    messages.reverse();

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });

  } catch (error) {
    console.error(
      "Get project messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch project messages",
    });
  }
};


// =====================================================
// SEND PROJECT MESSAGE
//
// POST
// /api/workspaces/:workspaceId/projects/:projectId/messages
// =====================================================

const sendProjectMessage = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    const userId = req.user._id;

    const {
      content,
      replyTo = null,
    } = req.body;

    // -------------------------------------------------
    // Validate IDs
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // -------------------------------------------------
    // Validate content
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

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message:
          "Message cannot exceed 5000 characters",
      });
    }

    // -------------------------------------------------
    // Check workspace membership
    // -------------------------------------------------

    const workspaceMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        status: "Active",
      });

    if (!workspaceMember) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this workspace",
      });
    }

    // -------------------------------------------------
    // Check project
    // -------------------------------------------------

    const project =
      await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
        isActive: true,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // Check ACTIVE project membership
    // -------------------------------------------------

    const projectMember =
      await getActiveProjectMember(
        projectId,
        userId
      );

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message:
          "You are not an active member of this project",
      });
    }

    // -------------------------------------------------
    // Validate reply message
    // -------------------------------------------------

    let replyMessage = null;

    if (replyTo) {
      if (
        !mongoose.Types.ObjectId.isValid(
          replyTo
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid reply message ID",
        });
      }

      replyMessage =
        await Message.findOne({
          _id: replyTo,
          project: projectId,
          workspace: workspaceId,
          isDeleted: false,
        });

      if (!replyMessage) {
        return res.status(404).json({
          success: false,
          message:
            "Reply message not found",
        });
      }
    }

    // -------------------------------------------------
    // CREATE MESSAGE
    // -------------------------------------------------

    const message =
      await Message.create({
        project: projectId,
        workspace: workspaceId,
        sender: userId,
        content: content.trim(),
        replyTo: replyMessage
          ? replyMessage._id
          : null,
      });

    // -------------------------------------------------
    // Populate sender
    // -------------------------------------------------

    await message.populate(
      "sender",
      "name email avatar"
    );

    // -------------------------------------------------
    // Populate reply message if applicable
    // -------------------------------------------------

    if (message.replyTo) {
      await message.populate(
        "replyTo",
        "content sender createdAt"
      );
    }

    // -------------------------------------------------
    // GET SOCKET.IO INSTANCE
    // -------------------------------------------------

    const io =
      req.app.get("io");

    // -------------------------------------------------
    // EMIT REAL-TIME MESSAGE
    // -------------------------------------------------

    if (io) {
      io.to(
        `project:${projectId}`
      ).emit(
        "new-message",
        message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });

  } catch (error) {
    console.error(
      "Send project message error:",
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
// EDIT MESSAGE
//
// PATCH
// /api/messages/:messageId
// =====================================================

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const userId = req.user._id;

    const { content } = req.body;

    // -------------------------------------------------
    // Validate ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    // -------------------------------------------------
    // Validate content
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

    // -------------------------------------------------
    // Find message
    // -------------------------------------------------

    const message =
      await Message.findOne({
        _id: messageId,
        isDeleted: false,
      });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // -------------------------------------------------
    // ONLY MESSAGE CREATOR CAN EDIT
    // -------------------------------------------------

    if (
      message.sender.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own messages",
      });
    }

    // -------------------------------------------------
    // UPDATE MESSAGE
    // -------------------------------------------------

    message.content = content.trim();

    message.isEdited = true;

    await message.save();

    // -------------------------------------------------
    // POPULATE SENDER
    // -------------------------------------------------

    await message.populate(
      "sender",
      "name email avatar"
    );

    // -------------------------------------------------
    // GET SOCKET.IO INSTANCE
    // -------------------------------------------------

    const io = req.app.get("io");

    // -------------------------------------------------
    // EMIT REAL-TIME UPDATE
    // -------------------------------------------------

    if (io) {
      io.to(
        `project:${message.project}`
      ).emit(
        "message-updated",
        message
      );
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Message updated successfully",

      data: message,
    });

  } catch (error) {

    console.error(
      "Edit message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to edit message",
    });
  }
};

// =====================================================
// DELETE MESSAGE
//
// DELETE
// /api/messages/:messageId
// =====================================================

const deleteMessage = async (
  req,
  res
) => {
  try {
    const { messageId } =
      req.params;

    const userId =
      req.user._id;

    // -------------------------------------------------
    // Validate ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        messageId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    // -------------------------------------------------
    // Find message
    // -------------------------------------------------

    const message =
      await Message.findOne({
        _id: messageId,
        isDeleted: false,
      });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // -------------------------------------------------
    // ONLY MESSAGE CREATOR CAN DELETE
    // -------------------------------------------------

    if (
      message.sender.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own messages",
      });
    }

    // -------------------------------------------------
    // SOFT DELETE
    // -------------------------------------------------

    message.isDeleted = true;
    message.content = "";

    await message.save();

    // -------------------------------------------------
    // GET SOCKET.IO INSTANCE
    // -------------------------------------------------

    const io =
      req.app.get("io");

    // -------------------------------------------------
    // EMIT REAL-TIME DELETE EVENT
    // -------------------------------------------------

    if (io) {

      // ==========================================
      // PRIVATE CHAT
      // ==========================================

      if (message.conversation) {

        io.to(
          `conversation:${message.conversation}`
        ).emit(
          "private-message-deleted",
          {
            messageId: message._id,
            conversationId:
              message.conversation,
          }
        );

      }

      // ==========================================
      // PROJECT CHAT
      // ==========================================

      if (message.project) {

        io.to(
          `project:${message.project}`
        ).emit(
          "message-deleted",
          {
            messageId: message._id,
          }
        );

      }

    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Message deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete message",
    });
  }
};

// =====================================================
// TOGGLE MESSAGE REACTION
//
// POST
// /api/messages/:messageId/reaction
// =====================================================

const toggleReaction = async (
  req,
  res
) => {
  try {
    const {
      messageId,
    } = req.params;

    const {
      emoji,
    } = req.body || {};

    const userId =
      req.user._id;

    // -------------------------------------------------
    // VALIDATE MESSAGE ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        messageId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid message ID",
      });
    }

    // -------------------------------------------------
    // VALIDATE EMOJI
    // -------------------------------------------------

    if (
      !emoji ||
      typeof emoji !==
        "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Emoji is required",
      });
    }

    // -------------------------------------------------
    // FIND MESSAGE
    // -------------------------------------------------

    const message =
      await Message.findById(
        messageId
      );

    if (!message) {
      return res.status(404).json({
        success: false,
        message:
          "Message not found",
      });
    }

    // -------------------------------------------------
    // BLOCK REACTION ON DELETED MESSAGE
    // -------------------------------------------------

    if (
      message.isDeleted
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot react to a deleted message",
      });
    }

    // -------------------------------------------------
    // ORGANIZATION ACCESS
    // -------------------------------------------------

    if (
      message.organization
    ) {
      const membership =
        await OrganizationMember.findOne(
          {
            organization:
              message.organization,

            user: userId,

            status:
              "Active",
          }
        );

      if (!membership) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this organization",
        });
      }
    }

    // -------------------------------------------------
    // INITIALIZE REACTIONS
    // -------------------------------------------------

    if (
      !Array.isArray(
        message.reactions
      )
    ) {
      message.reactions = [];
    }

    // -------------------------------------------------
    // FIND EMOJI REACTION
    // -------------------------------------------------

    let reaction =
      message.reactions.find(
        (item) =>
          item.emoji === emoji
      );

    // -------------------------------------------------
    // CREATE REACTION
    // -------------------------------------------------

    if (!reaction) {
      message.reactions.push({
        emoji,
        users: [
          userId,
        ],
      });
    }

    // -------------------------------------------------
    // EXISTING REACTION
    // -------------------------------------------------

    else {
      if (
        !Array.isArray(
          reaction.users
        )
      ) {
        reaction.users = [];
      }

      const alreadyReacted =
        reaction.users.some(
          (id) =>
            id.toString() ===
            userId.toString()
        );

      // -----------------------------------------------
      // REMOVE USER REACTION
      // -----------------------------------------------

      if (
        alreadyReacted
      ) {
        reaction.users =
          reaction.users.filter(
            (id) =>
              id.toString() !==
              userId.toString()
          );

        // Remove emoji entirely
        // if nobody is using it.
        if (
          reaction.users
            .length === 0
        ) {
          message.reactions =
            message.reactions.filter(
              (item) =>
                item.emoji !==
                emoji
            );
        }
      }

      // -----------------------------------------------
      // ADD USER REACTION
      // -----------------------------------------------

      else {
        reaction.users.push(
          userId
        );
      }
    }

    await message.save();

    // -------------------------------------------------
    // POPULATE
    // -------------------------------------------------

    await message.populate(
      "sender",
      "name email avatar"
    );

    if (
      message.replyTo
    ) {
      await message.populate(
        "replyTo",
        "content sender createdAt"
      );
    }

    // -------------------------------------------------
    // SOCKET
    // -------------------------------------------------

    const io =
      req.app.get("io");

    if (io) {
      if (
        message.organization
      ) {
        io.to(
          `organization:${message.organization}`
        ).emit(
          "chat-reaction",
          message
        );
      }

      if (
        message.conversation
      ) {
        io.to(
          `conversation:${message.conversation}`
        ).emit(
          "chat-reaction",
          message
        );
      }

      if (
        message.project
      ) {
        io.to(
          `project:${message.project}`
        ).emit(
          "chat-reaction",
          message
        );
      }
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Reaction updated successfully",
      data: message,
    });

  } catch (error) {
    console.error(
      "Toggle reaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update reaction",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getProjectMessages,
  sendProjectMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
};