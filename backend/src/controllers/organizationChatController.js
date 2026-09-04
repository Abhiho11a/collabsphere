const mongoose = require("mongoose");

const Conversation = require("../models/Converstion");
const OrganizationMember = require("../models/OrganizationMember");
const Message = require("../models/Message");

const cloudinary =
  require("../config/cloudinary");


// =====================================================
// CHECK ACTIVE ORGANIZATION MEMBERSHIP
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
// GET / CREATE ORGANIZATION CONVERSATION
// GET /api/organization-chat/:organizationId
// =====================================================

const getOrganizationConversation = async (
  req,
  res
) => {
  try {
    const { organizationId } = req.params;

    const userId = req.user._id;

    // -------------------------------------------------
    // VALIDATE ORGANIZATION ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
    }

    // -------------------------------------------------
    // CHECK MEMBERSHIP
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
    // GET OR CREATE ORGANIZATION CONVERSATION
    // -------------------------------------------------

    const participantKey =
      `org_${organizationId}`;

    const conversation =
      await Conversation.findOneAndUpdate(
        {
          type: "organization",
          organization: organizationId,
        },
        {
          $setOnInsert: {
            type: "organization",
            organization: organizationId,
            participants: [],
            participantKey,
            lastMessage: null,
            lastMessageAt: null,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

    // -------------------------------------------------
    // POPULATE LAST MESSAGE
    // -------------------------------------------------

    await conversation.populate({
      path: "lastMessage",
      select:
        "sender content createdAt isDeleted",
      populate: {
        path: "sender",
        select: "name email avatar",
      },
    });

    return res.status(200).json({
      success: true,
      conversation,
    });

  } catch (error) {

    console.error(
      "Get organization conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load organization chat",
    });
  }
};


// =====================================================
// GET ORGANIZATION MESSAGES
//
// GET
// /api/organization-chat/:organizationId/messages
// =====================================================

const getOrganizationMessages = async (
  req,
  res
) => {
  try {

    const { organizationId } =
      req.params;

    const userId =
      req.user._id;

    // -------------------------------------------------
    // VALIDATE ORGANIZATION
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid organization ID",
      });
    }

    // -------------------------------------------------
    // CHECK MEMBERSHIP
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
    // FIND ORGANIZATION CONVERSATION
    // -------------------------------------------------

    const conversation =
      await Conversation.findOne({
        type: "organization",
        organization: organizationId,
      });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: [],
      });
    }

    // -------------------------------------------------
    // GET MESSAGES
    // -------------------------------------------------

    const messages =
      await Message.find({
        conversation:
          conversation._id,
      })
        .populate(
          "sender",
          "name email avatar"
        )
        .populate({
          path: "replyTo",
          populate: {
            path: "sender",
            select:
              "name email avatar",
          },
        })
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,
      messages,
    });

  } catch (error) {

    console.error(
      "Get organization messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load organization messages",
    });
  }
};


// =====================================================
// SEND ORGANIZATION MESSAGE
//
// POST
// /api/organization-chat/:organizationId/messages
// =====================================================

const sendOrganizationMessage = async (
  req,
  res
) => {
  try {

    const { organizationId } =
      req.params;


    const userId =
      req.user._id;

    // -------------------------------------------------
    // VALIDATE ORGANIZATION
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid organization ID",
      });
    }

    // -------------------------------------------------
    // VALIDATE MESSAGE
    // -------------------------------------------------

    const {
    content = "",
    replyTo = null,
    } = req.body || {};

    const trimmedContent =
    content.trim();

    if (
    !trimmedContent &&
    !req.file
    ) {
    return res.status(400).json({
        success: false,
        message:
        "Message content or file is required",
    });
    }

    if (
    trimmedContent.length > 5000
    ) {
    return res.status(400).json({
        success: false,
        message:
        "Message cannot exceed 5000 characters",
    });
    }

    // -------------------------------------------------
    // CHECK ORGANIZATION MEMBERSHIP
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
    // FIND ORGANIZATION CONVERSATION
    // -------------------------------------------------

    const conversation =
      await Conversation.findOne({
        type: "organization",
        organization: organizationId,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message:
          "Organization chat does not exist",
      });
    }

    // -------------------------------------------------
    // VALIDATE REPLY
    // -------------------------------------------------

    if (replyTo) {

      if (
        !mongoose.Types.ObjectId.isValid(
          replyTo
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid reply message",
        });
      }

      const parentMessage =
        await Message.findOne({
          _id: replyTo,
          conversation:
            conversation._id,
        });

      if (!parentMessage) {
        return res.status(404).json({
          success: false,
          message:
            "Reply message not found",
        });
      }
    }


    let attachment = null;

    if (req.file) {
    const uploadResult =
        await new Promise(
        (resolve, reject) => {
            const stream =
            cloudinary.uploader.upload_stream(
                {
                folder:
                    `collabsphere/chat/organizations/${organizationId}`,

                resource_type:
                    "auto",

                use_filename:
                    true,

                unique_filename:
                    true,
                },

                (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
                }
            );

            stream.end(
            req.file.buffer
            );
        }
        );

    attachment = {
        name:
        req.file.originalname,

        url:
        uploadResult.secure_url,

        publicId:
        uploadResult.public_id,

        resourceType:
        uploadResult.resource_type,

        mimeType:
        req.file.mimetype,

        size:
        req.file.size,
    };
    }

    // -------------------------------------------------
    // CREATE MESSAGE
    // -------------------------------------------------

    const message =
        await Message.create({
            conversation:
            conversation._id,

            organization:
            organizationId,

            sender:
            userId,

            receiver:
            null,

            content:
            content.trim(),

            replyTo:
            replyTo || null,

            attachments:
            attachment
                ? [attachment]
                : [],
        });

    // -------------------------------------------------
    // UPDATE CONVERSATION
    // -------------------------------------------------

    conversation.lastMessage =
      message._id;

    conversation.lastMessageAt =
      message.createdAt;

    await conversation.save();

    // -------------------------------------------------
    // POPULATE MESSAGE
    // -------------------------------------------------

    await message.populate(
      "sender",
      "name email avatar"
    );

    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select:
            "name email avatar",
        },
      });
    }

    // -------------------------------------------------
    // SOCKET.IO
    // -------------------------------------------------

    const io =
      req.app.get("io");

    if (io) {

      io.to(
        `organization:${organizationId}`
      ).emit(
        "organization-message",
        message
      );

    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message,
    });

  } catch (error) {

    console.error(
      "Send organization message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send organization message",
    });
  }
};


module.exports = {
  getOrganizationConversation,
  getOrganizationMessages,
  sendOrganizationMessage,
};