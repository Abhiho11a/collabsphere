const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    // ==========================================
    // ORGANIZATION
    // ==========================================

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // ==========================================
    // WORKSPACE
    // ==========================================

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },

    // ==========================================
    // PROJECT
    // ==========================================

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    // ==========================================
    // UPLOADER
    // ==========================================

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // FILE INFORMATION
    // ==========================================

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      default: "auto",
    },

    mimeType: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// INDEXES
// ==========================================

fileSchema.index({
  organization: 1,
  createdAt: -1,
});

fileSchema.index({
  organization: 1,
  workspace: 1,
  createdAt: -1,
});

fileSchema.index({
  organization: 1,
  project: 1,
  createdAt: -1,
});

fileSchema.index({
  uploadedBy: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model("File", fileSchema);