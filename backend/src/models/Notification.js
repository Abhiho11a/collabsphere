const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // =====================================================
    // RECIPIENT
    // =====================================================

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // ACTOR
    // User who caused the notification
    // =====================================================

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =====================================================
    // NOTIFICATION TYPE
    // =====================================================

    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_updated",
        "mention",
        "document_edited",
        "file_uploaded",
        "chat_message",
        "workspace_invitation",
        "project_invitation",
        "due_date_reminder",
      ],
      required: true,
      index: true,
    },

    // =====================================================
    // TITLE
    // =====================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // =====================================================
    // MESSAGE
    // =====================================================

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // =====================================================
    // RESOURCE
    // Used for navigation when notification is clicked.
    // =====================================================

    entityType: {
      type: String,
      enum: [
        "workspace",
        "project",
        "task",
        "document",
        "file",
        "chat",
        "conversation",
        "none",
      ],
      default: "none",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // =====================================================
    // OPTIONAL NAVIGATION URL
    // =====================================================

    actionUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // EXTRA DATA
    // =====================================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // =====================================================
    // READ STATE
    // =====================================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
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

// =====================================================
// INDEXES
// =====================================================

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );