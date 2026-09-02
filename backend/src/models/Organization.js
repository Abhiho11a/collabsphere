const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    settings: {
  permissions: {
    organization_admin: {
      createWorkspace: {
        type: Boolean,
        default: true,
      },
      inviteMembers: {
        type: Boolean,
        default: true,
      },
      manageMembers: {
        type: Boolean,
        default: true,
      },
    },

    member: {
      createWorkspace: {
        type: Boolean,
        default: true,
      },
      inviteMembers: {
        type: Boolean,
        default: false,
      },
      manageMembers: {
        type: Boolean,
        default: false,
      },
    },

    guest: {
      createWorkspace: {
        type: Boolean,
        default: false,
      },
      inviteMembers: {
        type: Boolean,
        default: false,
      },
      manageMembers: {
        type: Boolean,
        default: false,
      },
    },
  },
},
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({
  name: 1,
});

organizationSchema.index({
  createdBy: 1,
});

module.exports = mongoose.model(
  "Organization",
  organizationSchema
);