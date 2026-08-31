const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // ========================================
    // DOCUMENT TITLE
    // ========================================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },


    // ========================================
    // DOCUMENT CONTENT
    // ========================================

    content: {
      type: String,
      default: "",
    },


    // ========================================
    // WORKSPACE
    // ========================================
    // null  → Personal document
    // ID    → Workspace or Project document

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },


    // ========================================
    // PROJECT
    // ========================================
    // null  → Personal or Workspace document
    // ID    → Project document

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },


    // ========================================
    // CREATED BY
    // ========================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },


    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: [
        "Draft",
        "Published",
        "Archived",
      ],
      default: "Draft",
    },


    // ========================================
    // ACTIVE
    // ========================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);


// ========================================
// INDEXES
// ========================================

// Project documents
documentSchema.index({
  project: 1,
  createdAt: -1,
});


// Workspace documents
documentSchema.index({
  workspace: 1,
  createdAt: -1,
});


// Documents created by a user
documentSchema.index({
  createdBy: 1,
  createdAt: -1,
});


// Useful for querying documents
// belonging to a workspace/project combination
documentSchema.index({
  workspace: 1,
  project: 1,
  createdAt: -1,
});


module.exports = mongoose.model(
  "Document",
  documentSchema
);