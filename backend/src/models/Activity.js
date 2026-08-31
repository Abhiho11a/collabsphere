const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // ========================================
    // WORKSPACE
    // ========================================

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    // ========================================
    // PROJECT
    // ========================================

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // ========================================
    // ACTOR
    // ========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // ACTIVITY TYPE
    // ========================================

    type: {
      type: String,
      enum: [
        "project_created",

        "task_created",
        "task_updated",
        "task_completed",
        "task_deleted",

        "member_added",
        "member_removed",
        "member_role_updated",

        "document_created",
        "document_updated",

        "file_uploaded",
        "file_deleted",

        "project_updated",
        "task_status_changed",
        "task_deleted", 
      ],
      required: true,
      index: true,
    },

    // ========================================
    // MESSAGE
    // ========================================

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // TARGET INFORMATION
    // ========================================

    targetType: {
      type: String,
      enum: [
        "Project",
        "Task",
        "User",
        "Document",
        "File",
      ],
      default: null,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ========================================
    // EXTRA DATA
    // ========================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  {
    timestamps: true,
  }
);

// ========================================
// INDEX
// ========================================

activitySchema.index({
  project: 1,
  createdAt: -1,
});

activitySchema.index({
  workspace: 1,
  createdAt: -1,
});

activitySchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Activity",
  activitySchema
);