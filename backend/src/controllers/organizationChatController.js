const mongoose = require("mongoose");

const Conversation = require("../models/Converstion");
const OrganizationMember = require("../models/OrganizationMember");


// =====================================================
// GET ACTIVE ORGANIZATION MEMBERSHIP
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
// GET /api/conversations/organization/:organizationId
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

    let conversation =
      await Conversation.findOne({
        type: "organization",
        organization: organizationId,
      });

    // -------------------------------------------------
    // CREATE IF NOT EXISTS
    // -------------------------------------------------

    if (!conversation) {
      conversation =
        await Conversation.create({
          type: "organization",

          organization:
            organizationId,

          participants: [],

          participantKey:
            `org_${organizationId}`,

          lastMessage: null,

          lastMessageAt: null,
        });
    }

    // -------------------------------------------------
    // POPULATE LAST MESSAGE
    // -------------------------------------------------

    await conversation.populate({
      path: "lastMessage",
      select:
        "sender content createdAt isDeleted",
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


module.exports = {
  getOrganizationConversation,
};