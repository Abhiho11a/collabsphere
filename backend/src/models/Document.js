const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // ========================================
    // BASIC INFORMATION
    // ========================================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    // Legacy/rendered HTML representation.
    // Useful for previews/search/fallback.
    content: {
      type: String,
      default: "",
    },

    // ========================================
    // DOCUMENT VERSION
    // ========================================

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ========================================
    // DOCUMENT SCOPE
    // ========================================

    scope: {
      type: String,
      enum: [
        "organization",
        "workspace",
        "project",
      ],
      required: true,
      index: true,
    },

    // ========================================
    // ORGANIZATION
    // ========================================

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // ========================================
    // WORKSPACE
    // ========================================

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },

    // ========================================
    // PROJECT
    // ========================================

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
    // DOCUMENT ACCESS
    // ========================================

    access: {
      viewers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      editors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      // Scope members can view
      inheritViewAccess: {
        type: Boolean,
        default: true,
      },

      // Scope members CANNOT edit by default.
      // Access can be explicitly granted.
      inheritEditAccess: {
        type: Boolean,
        default: false,
      },
    },

    // ========================================
    // COLLABORATIVE YJS STATE
    // ========================================

    collaborationState: {
      type: Buffer,
      default: null,
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

documentSchema.index({
  organization: 1,
  scope: 1,
  updatedAt: -1,
});

documentSchema.index({
  organization: 1,
  workspace: 1,
  updatedAt: -1,
});

documentSchema.index({
  organization: 1,
  project: 1,
  updatedAt: -1,
});

documentSchema.index({
  createdBy: 1,
  createdAt: -1,
});

documentSchema.index({
  workspace: 1,
  project: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Document",
  documentSchema
);