const mongoose = require("mongoose");

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: [
        "Owner",
        "Admin",
        "Member",
        "Viewer",
      ],
      default: "Member",
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Pending",
        "Suspended",
      ],
      default: "Active",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

workspaceMemberSchema.index(
  { workspace: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "WorkspaceMember",
  workspaceMemberSchema
);