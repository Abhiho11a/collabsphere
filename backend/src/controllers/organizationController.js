const mongoose = require("mongoose");

const Organization =
  require("../models/Organization");

const OrganizationMember =
  require("../models/OrganizationMember");

const Workspace =
  require("../models/Workspace");

const WorkspaceMember =
  require("../models/WorkspaceMember");

  const DEFAULT_PERMISSIONS = {
  organization_admin: {
    createWorkspace: true,
    inviteMembers: true,
    manageMembers: true,
  },

  member: {
    createWorkspace: true,
    inviteMembers: false,
    manageMembers: false,
  },

  guest: {
    createWorkspace: false,
    inviteMembers: false,
    manageMembers: false,
  },
};

// =====================================================
// GET MY ORGANIZATIONS
// GET /api/organizations
// =====================================================

const getMyOrganizations =
  async (req, res) => {
    try {
      const memberships =
        await OrganizationMember.find({
          user: req.user._id,
          status: "Active",
        })
          .populate({
            path: "organization",
            select:
              "name createdBy createdAt updatedAt",
          })
          .sort({
            createdAt: -1,
          });

      const organizations =
        memberships
          .filter(
            (membership) =>
              membership.organization
          )
          .map((membership) => ({
            id:
              membership.organization._id,

            name:
              membership.organization.name,

            createdBy:
              membership.organization.createdBy,

            createdAt:
              membership.organization.createdAt,

            updatedAt:
              membership.organization.updatedAt,

            role:
              membership.role,

            membershipId:
              membership._id,
          }));

      return res.status(200).json({
        success: true,
        organizations,
      });

    } catch (error) {

      console.error(
        "Get organizations error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch organizations",
      });
    }
  };


// =====================================================
// CREATE ORGANIZATION
// POST /api/organizations
// =====================================================

const createOrganization =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {

      const name =
        req.body?.name?.trim();

      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "Organization name is required",
        });
      }

      if (name.length < 2) {
        return res.status(400).json({
          success: false,
          message:
            "Organization name must contain at least 2 characters",
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            "Organization name cannot exceed 100 characters",
        });
      }


      let createdOrganization;
      let createdMembership;


      // ---------------------------------------------
      // TRANSACTION
      // ---------------------------------------------

      await session.withTransaction(
        async () => {

          createdOrganization =
            await Organization.create(
              [
                {
                  name,
                  createdBy:
                    req.user._id,
                },
              ],
              {
                session,
              }
            );

          createdOrganization =
            createdOrganization[0];


          /*
           * PRODUCT DECISION:
           *
           * The requirements document does not explicitly
           * say that the creator must become Organization
           * Admin.
           *
           * We intentionally make the creator
           * organization_admin because otherwise a newly
           * created organization would have no natural
           * organization-level administrator.
           */

          const memberships =
            await OrganizationMember.create(
              [
                {
                  organization:
                    createdOrganization._id,

                  user:
                    req.user._id,

                  role:
                    "organization_admin",

                  status:
                    "Active",
                },
              ],
              {
                session,
              }
            );

          createdMembership =
            memberships[0];
        }
      );


      return res.status(201).json({
        success: true,

        message:
          "Organization created successfully",

        organization: {
          id:
            createdOrganization._id,

          name:
            createdOrganization.name,

          createdBy:
            createdOrganization.createdBy,

          createdAt:
            createdOrganization.createdAt,

          updatedAt:
            createdOrganization.updatedAt,

          role:
            createdMembership.role,
        },
      });

    } catch (error) {

      console.error(
        "Create organization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create organization",
      });

    } finally {

      await session.endSession();

    }
  };

  const getOrganizationSettings = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const membership =
      await OrganizationMember.findOne({
        organization: organizationId,
        user: req.user._id,
        status: "Active",
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    const organization =
      await Organization.findById(
        organizationId
      ).select(
        "name createdBy createdAt updatedAt settings"
      );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const permissions =
      organization.settings?.permissions ||
      DEFAULT_PERMISSIONS;

    return res.status(200).json({
      success: true,

      organization: {
        id: organization._id,
        name: organization.name,
        createdBy: organization.createdBy,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },

      role: membership.role,

      settings: {
        permissions,
      },
    });

  } catch (error) {
    console.error(
      "Get organization settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch organization settings",
    });
  }
};

const updateOrganizationSettings = async (
  req,
  res
) => {
  try {
    const { organizationId } = req.params;

    const membership =
      await OrganizationMember.findOne({
        organization: organizationId,
        user: req.user._id,
        status: "Active",
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    if (
      membership.role !==
      "organization_admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can change organization settings",
      });
    }

    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({
        success: false,
        message:
          "Permissions are required",
      });
    }

    const allowedRoles = [
      "organization_admin",
      "member",
      "guest",
    ];

    const allowedPermissions = [
      "createWorkspace",
      "inviteMembers",
      "manageMembers",
    ];

    for (const role of allowedRoles) {
      if (
        !permissions[role] ||
        typeof permissions[role] !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid permissions for ${role}`,
        });
      }

      for (
        const permission of allowedPermissions
      ) {
        if (
          typeof permissions[role][
            permission
          ] !== "boolean"
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid value for ${role}.${permission}`,
          });
        }
      }
    }

    // Admin permissions are always protected
    permissions.organization_admin = {
      createWorkspace: true,
      inviteMembers: true,
      manageMembers: true,
    };

    const organization =
      await Organization.findByIdAndUpdate(
        organizationId,
        {
          $set: {
            "settings.permissions":
              permissions,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("settings");

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Organization settings updated successfully",
      settings:
        organization.settings,
    });

  } catch (error) {
    console.error(
      "Update organization settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update organization settings",
    });
  }
};

// =====================================================
// UPDATE ORGANIZATION NAME
// PATCH /api/organizations/:organizationId
// =====================================================

const updateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const name = req.body?.name?.trim();

    // ---------------------------------------------
    // VALIDATE NAME
    // ---------------------------------------------

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Organization name must contain at least 2 characters",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Organization name cannot exceed 100 characters",
      });
    }

    // ---------------------------------------------
    // CHECK ADMIN
    // ---------------------------------------------

    const membership =
      await OrganizationMember.findOne({
        organization: organizationId,
        user: req.user._id,
        status: "Active",
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    if (
      membership.role !==
      "organization_admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can rename the organization",
      });
    }

    // ---------------------------------------------
    // UPDATE
    // ---------------------------------------------

    const organization =
      await Organization.findByIdAndUpdate(
        organizationId,
        {
          $set: {
            name,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Organization name updated successfully",
      organization: {
        id: organization._id,
        name: organization.name,
        updatedAt:
          organization.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update organization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update organization",
    });
  }
};

// =====================================================
// DELETE ORGANIZATION
// DELETE /api/organizations/:organizationId
// =====================================================

const deleteOrganization = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const { organizationId } =
      req.params;

    // ---------------------------------------------
    // CHECK ADMIN
    // ---------------------------------------------

    const membership =
      await OrganizationMember.findOne({
        organization: organizationId,
        user: req.user._id,
        status: "Active",
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    if (
      membership.role !==
      "organization_admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can delete the organization",
      });
    }

    // ---------------------------------------------
    // CHECK ORGANIZATION EXISTS
    // ---------------------------------------------

    const organization =
      await Organization.findById(
        organizationId
      );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message:
          "Organization not found",
      });
    }

    // ---------------------------------------------
    // DELETE EVERYTHING IN TRANSACTION
    // ---------------------------------------------

    await session.withTransaction(
      async () => {
        // Get all workspaces
        const workspaces =
          await Workspace.find({
            organization:
              organizationId,
          })
            .select("_id")
            .session(session);

        const workspaceIds =
          workspaces.map(
            (workspace) =>
              workspace._id
          );

        // Delete workspace members
        if (workspaceIds.length > 0) {
          await WorkspaceMember.deleteMany(
            {
              workspace: {
                $in: workspaceIds,
              },
            },
            {
              session,
            }
          );
        }

        // Delete workspaces
        await Workspace.deleteMany(
          {
            organization:
              organizationId,
          },
          {
            session,
          }
        );

        // Delete organization members
        await OrganizationMember.deleteMany(
          {
            organization:
              organizationId,
          },
          {
            session,
          }
        );

        // Finally delete organization
        await Organization.deleteOne(
          {
            _id: organizationId,
          },
          {
            session,
          }
        );
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Organization deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete organization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete organization",
    });
  } finally {
    await session.endSession();
  }
};


module.exports = {
  getMyOrganizations,
  createOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganization,
  deleteOrganization,
};