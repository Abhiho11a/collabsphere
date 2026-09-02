const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // PROJECT CHAT
    // These are used when the message belongs to a project.
    // -------------------------------------------------

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    // -------------------------------------------------
    // WORKSPACE
    // Stored for project-chat tenant validation/querying.
    // -------------------------------------------------

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },

    // -------------------------------------------------
    // INDIVIDUAL CHAT
    // These are used when the message belongs to a
    // 1-to-1 conversation.
    // -------------------------------------------------

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // -------------------------------------------------
    // MESSAGE SENDER
    // -------------------------------------------------

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // -------------------------------------------------
    // MESSAGE CONTENT
    // -------------------------------------------------

    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    // -------------------------------------------------
    // REPLY / THREAD
    // Works for both project and individual chat.
    // -------------------------------------------------

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // -------------------------------------------------
    // ATTACHMENTS
    // Works for both project and individual chat.
    // -------------------------------------------------

    attachments: [
      {
        name: {
          type: String,
          trim: true,
        },

        url: {
          type: String,
          trim: true,
        },

        type: {
          type: String,
          trim: true,
        },

        size: {
          type: Number,
        },
      },
    ],

    // -------------------------------------------------
    // MESSAGE STATE
    // -------------------------------------------------

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // -------------------------------------------------
    // READ STATE
    // Primarily used for individual chat.
    // -------------------------------------------------

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// -----------------------------------------------------
// PROJECT CHAT INDEX
// -----------------------------------------------------

messageSchema.index({
  project: 1,
  createdAt: 1,
});

// -----------------------------------------------------
// INDIVIDUAL CHAT INDEX
// -----------------------------------------------------

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------

module.exports = mongoose.model("Message", messageSchema);