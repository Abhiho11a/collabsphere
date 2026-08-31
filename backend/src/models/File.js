const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
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
    // null = workspace-level file
    // ObjectId = project-level file

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },


    // ========================================
    // UPLOADED BY
    // ========================================

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },


    // ========================================
    // ORIGINAL FILE NAME
    // ========================================

    originalName: {
      type: String,
      required: true,
      trim: true,
    },


    // ========================================
    // FILE URL
    // ========================================

    fileUrl: {
      type: String,
      required: true,
    },


    // ========================================
    // CLOUDINARY PUBLIC ID
    // ========================================

    publicId: {
      type: String,
      required: true,
    },


    // ========================================
    // RESOURCE TYPE
    // ========================================

    resourceType: {
      type: String,
      default: "auto",
    },


    // ========================================
    // MIME TYPE
    // ========================================

    mimeType: {
      type: String,
      default: "",
    },


    // ========================================
    // FILE SIZE
    // ========================================

    size: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);


// ========================================
// INDEXES
// ========================================

// Workspace files
fileSchema.index({
  workspace: 1,
  project: 1,
  createdAt: -1,
});


// Project files
fileSchema.index({
  project: 1,
  createdAt: -1,
});


// Uploaded files
fileSchema.index({
  uploadedBy: 1,
  createdAt: -1,
});


module.exports = mongoose.model(
  "File",
  fileSchema
);