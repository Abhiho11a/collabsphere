const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // =====================================================
    // CONVERSATION TYPE
    // =====================================================

    type: {
      type: String,
      enum: ["direct", "organization"],
      default: "direct",
      index: true,
    },

    // =====================================================
    // ORGANIZATION
    // =====================================================

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // =====================================================
    // PARTICIPANTS
    // =====================================================

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // =====================================================
    // UNIQUE CONVERSATION KEY
    // =====================================================

    participantKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // =====================================================
    // LAST MESSAGE
    // =====================================================

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

conversationSchema.index({
  organization: 1,
  type: 1,
});

conversationSchema.index({
  participants: 1,
});

conversationSchema.index({
  organization: 1,
  participants: 1,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);