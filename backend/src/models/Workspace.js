const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    // =====================================================
    // ORGANIZATION
    // =====================================================

    organization: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref:
        "Organization",

      required: true,

      index: true,
    },

    // =====================================================
    // WORKSPACE
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // =====================================================
    // OWNER
    // =====================================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // STATUS
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Workspace",
  workspaceSchema
);