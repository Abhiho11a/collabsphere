const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // ORGANIZATION
    // Conversation belongs to an organization
    // -------------------------------------------------

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // -------------------------------------------------
    // PARTICIPANTS
    // Exactly two users for individual chat
    // -------------------------------------------------

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // -------------------------------------------------
    // UNIQUE PARTICIPANT KEY
    // Organization + sorted user IDs
    // prevents duplicate conversations
    // -------------------------------------------------

    participantKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // -------------------------------------------------
    // LAST MESSAGE
    // Used for chat list preview
    // -------------------------------------------------

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

// -----------------------------------------------------
// PARTICIPANT LOOKUP
// -----------------------------------------------------

conversationSchema.index({
  participants: 1,
});

// -----------------------------------------------------
// ORGANIZATION + PARTICIPANTS
// Useful for organization-scoped queries
// -----------------------------------------------------

conversationSchema.index({
  organization: 1,
  participants: 1,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);