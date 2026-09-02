const mongoose = require("mongoose");

const organizationMemberSchema =
  new mongoose.Schema(
    {
      organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
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
          "organization_admin",
          "member",
          "guest",
        ],
        default: "member",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "Active",
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

organizationMemberSchema.index(
  {
    organization: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "OrganizationMember",
    organizationMemberSchema
  );