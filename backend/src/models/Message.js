const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // PROJECT
    // -------------------------------------------------

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // -------------------------------------------------
    // WORKSPACE
    // Stored for easier tenant-level validation/querying
    // -------------------------------------------------

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
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
    // FUTURE: REPLY / THREAD
    // -------------------------------------------------

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // -------------------------------------------------
    // FUTURE: ATTACHMENTS
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
  },
  {
    timestamps: true,
  }
);

// -----------------------------------------------------
// INDEX
// Fetch messages of a project chronologically
// -----------------------------------------------------

messageSchema.index({
  project: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "Message",
  messageSchema
);