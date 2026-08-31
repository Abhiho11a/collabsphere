const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
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
        "Project Manager",
        "Developer",
        "Designer",
        "Reviewer",
        "Member",
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

projectMemberSchema.index(
  { project: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ProjectMember",
  projectMemberSchema
);