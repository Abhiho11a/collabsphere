const mongoose = require("mongoose");

const Workspace =
  require("../models/Workspace");

const WorkspaceMember =
  require("../models/WorkspaceMember");

const OrganizationMember =
  require("../models/OrganizationMember");

const Task =
  require("../models/Task");

const Project =
  require("../models/Project");
const Organization = require("../models/Organization");


// =====================================================
// HELPER
// CHECK ORGANIZATION + WORKSPACE ACCESS
// =====================================================

const getAuthorizedWorkspace = async (
  workspaceId,
  userId
) => {

  // ---------------------------------------------------
  // VALIDATE WORKSPACE ID
  // ---------------------------------------------------

  if (
    !mongoose.Types.ObjectId.isValid(
      workspaceId
    )
  ) {
    return {
      error: {
        status: 400,
        message: "Invalid workspace ID",
      },
    };
  }


  // ---------------------------------------------------
  // FIND ACTIVE WORKSPACE
  // ---------------------------------------------------

  const workspace =
    await Workspace.findOne({
      _id: workspaceId,
      isActive: true,
    });


  if (!workspace) {
    return {
      error: {
        status: 404,
        message: "Workspace not found",
      },
    };
  }


  // ---------------------------------------------------
  // ORGANIZATION MUST EXIST
  // ---------------------------------------------------

  if (!workspace.organization) {
    return {
      error: {
        status: 403,
        message:
          "This workspace is not associated with an organization",
      },
    };
  }


  // ---------------------------------------------------
  // CHECK ORGANIZATION MEMBERSHIP
  // ---------------------------------------------------

  const organizationMembership =
    await OrganizationMember.findOne({
      organization:
        workspace.organization,

      user:
        userId,

      status: "Active",
    });


  if (!organizationMembership) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this organization",
    });
  }

  // ---------------------------------------------------
  // CHECK WORKSPACE MEMBERSHIP
  // ---------------------------------------------------

  const workspaceMembership =
    await WorkspaceMember.findOne({
      workspace:
        workspaceId,

      user:
        userId,

      status: "Active",
    });


  if (!workspaceMembership) {
    return {
      error: {
        status: 403,
        message:
          "You do not have access to this workspace",
      },
    };
  }


  return {
    workspace,
    organizationMembership,
    workspaceMembership,
  };
};



// =====================================================
// CREATE WORKSPACE
// POST /api/workspaces
// =====================================================

const createWorkspace =
  async (req, res) => {

    const session =
      await mongoose.startSession();

    try {

      const {
        name,
        description,
        organizationId,
      } = req.body;


      // -------------------------------------------------
      // VALIDATE NAME
      // -------------------------------------------------

      if (
        !name ||
        !name.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Workspace name is required",
        });

      }


      // -------------------------------------------------
      // VALIDATE ORGANIZATION
      // -------------------------------------------------

      if (!organizationId) {

        return res.status(400).json({
          success: false,
          message:
            "Organization is required",
        });

      }


      if (
        !mongoose.Types.ObjectId.isValid(
          organizationId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid organization ID",
        });

      }

      // -------------------------------------------------
      // CHECK ORGANIZATION ACCESS
      // -------------------------------------------------

      const organizationMembership =
        await OrganizationMember.findOne({
          organization: organizationId,
          user: req.user._id,
          status: "Active",
        });

      if (!organizationMembership) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this organization",
        });
      }


      // -------------------------------------------------
      // GET ORGANIZATION SETTINGS
      // -------------------------------------------------

      const organization =
        await Organization.findById(
          organizationId
        ).select("settings");

      if (!organization) {
        return res.status(404).json({
          success: false,
          message:
            "Organization not found",
        });
      }


      // -------------------------------------------------
      // CHECK CREATE WORKSPACE PERMISSION
      // -------------------------------------------------

      const canCreateWorkspace =
        organization
          ?.settings
          ?.permissions
          ?.[organizationMembership.role]
          ?.createWorkspace === true;

      if (!canCreateWorkspace) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to create workspaces",
        });
      }

      // -------------------------------------------------
      // CREATE WORKSPACE
      // -------------------------------------------------

      let createdWorkspace;


      await session.withTransaction(
        async () => {

          const [
            workspace,
          ] =
            await Workspace.create(
              [
                {
                  organization:
                    organizationId,

                  name:
                    name.trim(),

                  description:
                    description?.trim() || "",

                  owner:
                    req.user._id,
                },
              ],
              {
                session,
              }
            );


          // ---------------------------------------------
          // CREATE OWNER MEMBERSHIP
          // ---------------------------------------------

          await WorkspaceMember.create(
            [
              {
                workspace:
                  workspace._id,

                user:
                  req.user._id,

                role:
                  "Owner",

                status:
                  "Active",
              },
            ],
            {
              session,
            }
          );


          createdWorkspace =
            workspace;
        }
      );


      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      return res.status(201).json({

        success: true,

        message:
          "Workspace created successfully",

        workspace: {

          id:
            createdWorkspace._id,

          organization:
            createdWorkspace.organization,

          name:
            createdWorkspace.name,

          description:
            createdWorkspace.description,

          owner:
            createdWorkspace.owner,

          createdAt:
            createdWorkspace.createdAt,

          updatedAt:
            createdWorkspace.updatedAt,

        },

      });

    } catch (error) {

      console.error(
        "Create workspace error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to create workspace",

      });

    } finally {

      await session.endSession();

    }

  };



// ========================================
// GET MY WORKSPACES
// ========================================
const getMyWorkspaces = async (req, res) => {
  try {
    const { organizationId } = req.query;

    // ========================================
    // GET ACTIVE WORKSPACE MEMBERSHIPS
    // ========================================

    const memberships =
      await WorkspaceMember.find({
        user: req.user._id,
        status: "Active",
      })
        .populate({
          path: "workspace",
          select:
            "name description owner organization isActive createdAt updatedAt",
        })
        .sort({
          createdAt: -1,
        });

    // ========================================
    // REMOVE INVALID / INACTIVE WORKSPACES
    // ========================================

    let activeMemberships =
      memberships.filter(
        (membership) =>
          membership.workspace &&
          membership.workspace.isActive
      );


    // ========================================
    // FILTER BY ORGANIZATION IF PROVIDED
    // ========================================

    if (organizationId) {
      activeMemberships =
        activeMemberships.filter(
          (membership) =>
            membership.workspace.organization &&
            String(
              membership.workspace.organization
            ) === String(organizationId)
        );
    }


    // ========================================
    // BUILD WORKSPACE DATA
    // ========================================

    const workspaces =
      await Promise.all(
        activeMemberships.map(
          async (membership) => {

            const workspaceId =
              membership.workspace._id;


            const [
              memberCount,
              projectCount,
            ] = await Promise.all([

              // Active members
              WorkspaceMember.countDocuments({
                workspace: workspaceId,
                status: "Active",
              }),

              // Active projects
              Project.countDocuments({
                workspace: workspaceId,
                isActive: true,
              }),

            ]);


            return {
              id: workspaceId,

              organization:
                membership.workspace.organization,

              name:
                membership.workspace.name,

              description:
                membership.workspace.description,

              owner:
                membership.workspace.owner,

              role:
                membership.role,

              memberCount,

              projectCount,

              createdAt:
                membership.workspace.createdAt,

              updatedAt:
                membership.workspace.updatedAt,
            };

          }
        )
      );


    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({

      success: true,

      count:
        workspaces.length,

      workspaces,

    });


  } catch (error) {

    console.error(
      "Get workspaces error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch workspaces",

    });

  }
};



// =====================================================
// GET SINGLE WORKSPACE
// GET /api/workspaces/:workspaceId
// =====================================================

const getWorkspace =
  async (req, res) => {

    try {

      const {
        workspaceId,
      } = req.params;


      // -------------------------------------------------
      // AUTHORIZATION
      // ORGANIZATION + WORKSPACE
      // -------------------------------------------------

      const result =
        await getAuthorizedWorkspace(
          workspaceId,
          req.user._id
        );


      if (result.error) {

        return res.status(
          result.error.status
        ).json({

          success: false,

          message:
            result.error.message,

        });

      }


      const {
        workspace,
        workspaceMembership,
      } =
        result;


      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({

        success: true,

        workspace: {

          id:
            workspace._id,

          organization:
            workspace.organization,

          name:
            workspace.name,

          description:
            workspace.description,

          owner:
            workspace.owner,

          role:
            workspaceMembership.role,

          createdAt:
            workspace.createdAt,

          updatedAt:
            workspace.updatedAt,

        },

      });

    } catch (error) {

      console.error(
        "Get workspace error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch workspace",

      });

    }

  };



// =====================================================
// UPDATE WORKSPACE
// PATCH /api/workspaces/:workspaceId
// =====================================================

const updateWorkspace =
  async (req, res) => {

    try {

      const {
        workspaceId,
      } = req.params;

      const {
        name,
        description,
      } = req.body;


      // -------------------------------------------------
      // AUTHORIZATION
      // ORGANIZATION + WORKSPACE
      // -------------------------------------------------

      const result =
        await getAuthorizedWorkspace(
          workspaceId,
          req.user._id
        );


      if (result.error) {

        return res.status(
          result.error.status
        ).json({

          success: false,

          message:
            result.error.message,

        });

      }


      const {
        workspace,
        workspaceMembership,
      } =
        result;


      // -------------------------------------------------
      // EXISTING WORKSPACE PERMISSION
      // -------------------------------------------------

      if (
        !["Owner", "Admin"].includes(
          workspaceMembership.role
        )
      ) {

        return res.status(403).json({

          success: false,

          message:
            "You do not have permission to update this workspace",

        });

      }


      // -------------------------------------------------
      // VALIDATE NAME
      // -------------------------------------------------

      if (
        name !== undefined
      ) {

        if (
          !name.trim()
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Workspace name cannot be empty",

          });

        }


        if (
          name.trim().length < 2
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Workspace name must contain at least 2 characters",

          });

        }


        if (
          name.trim().length > 100
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Workspace name cannot exceed 100 characters",

          });

        }


        workspace.name =
          name.trim();

      }


      // -------------------------------------------------
      // UPDATE DESCRIPTION
      // -------------------------------------------------

      if (
        description !== undefined
      ) {

        workspace.description =
          description.trim();

      }


      // -------------------------------------------------
      // SAVE
      // -------------------------------------------------

      await workspace.save();


      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({

        success: true,

        message:
          "Workspace updated successfully",

        workspace: {

          id:
            workspace._id,

          organization:
            workspace.organization,

          name:
            workspace.name,

          description:
            workspace.description,

          owner:
            workspace.owner,

          role:
            workspaceMembership.role,

          updatedAt:
            workspace.updatedAt,

        },

      });

    } catch (error) {

      console.error(
        "Update workspace error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to update workspace",

      });

    }

  };



// =====================================================
// DELETE WORKSPACE
// DELETE /api/workspaces/:workspaceId
// =====================================================

const deleteWorkspace =
  async (req, res) => {

    try {

      const {
        workspaceId,
      } = req.params;


      // -------------------------------------------------
      // AUTHORIZATION
      // ORGANIZATION + WORKSPACE
      // -------------------------------------------------

      const result =
        await getAuthorizedWorkspace(
          workspaceId,
          req.user._id
        );


      if (result.error) {

        return res.status(
          result.error.status
        ).json({

          success: false,

          message:
            result.error.message,

        });

      }


      const {
        workspace,
        workspaceMembership,
      } =
        result;


      // -------------------------------------------------
      // ONLY WORKSPACE OWNER CAN DELETE
      // -------------------------------------------------

      if (
        workspaceMembership.role !==
        "Owner"
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Only the workspace owner can delete this workspace",

        });

      }


      // -------------------------------------------------
      // SOFT DELETE
      // -------------------------------------------------

      workspace.isActive =
        false;


      await workspace.save();


      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({

        success: true,

        message:
          "Workspace deleted successfully",

      });

    } catch (error) {

      console.error(
        "Delete workspace error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to delete workspace",

      });

    }

  };



// =====================================================
// GET WORKSPACE SUMMARY
// GET /api/workspaces/:workspaceId/summary
// =====================================================

const getWorkspaceSummary =
  async (req, res) => {

    try {

      const {
        workspaceId,
      } = req.params;


      // -------------------------------------------------
      // AUTHORIZATION
      // ORGANIZATION + WORKSPACE
      // -------------------------------------------------

      const result =
        await getAuthorizedWorkspace(
          workspaceId,
          req.user._id
        );


      if (result.error) {

        return res.status(
          result.error.status
        ).json({

          success: false,

          message:
            result.error.message,

        });

      }


      // -------------------------------------------------
      // COUNTS
      // -------------------------------------------------

      const [
        projectCount,
        memberCount,
        taskCount,
        completedTaskCount,
      ] =
        await Promise.all([

          // ---------------------------------------------
          // ACTIVE PROJECTS
          // ---------------------------------------------

          Project.countDocuments({

            workspace:
              workspaceId,

            isActive:
              true,

          }),


          // ---------------------------------------------
          // ACTIVE MEMBERS
          // ---------------------------------------------

          WorkspaceMember.countDocuments({

            workspace:
              workspaceId,

            status:
              "Active",

          }),


          // ---------------------------------------------
          // ALL TASKS
          // ---------------------------------------------

          Task.countDocuments({

            workspace:
              workspaceId,

          }),


          // ---------------------------------------------
          // COMPLETED TASKS
          // ---------------------------------------------

          Task.countDocuments({

            workspace:
              workspaceId,

            status: {
              $in: [
                "done",
                "completed",
                "Done",
                "Completed",
              ],
            },

          }),

        ]);


      // -------------------------------------------------
      // PROGRESS
      // -------------------------------------------------

      const progress =
        taskCount > 0
          ? Math.round(
              (
                completedTaskCount /
                taskCount
              ) * 100
            )
          : 0;


      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({

        success: true,

        summary: {

          projectCount,

          memberCount,

          taskCount,

          completedTaskCount,

          remainingTaskCount:
            taskCount -
            completedTaskCount,

          progress,

        },

      });

    } catch (error) {

      console.error(
        "Get workspace summary error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch workspace summary",

      });

    }

  };



// =====================================================
// EXPORT
// =====================================================

module.exports = {

  createWorkspace,

  getMyWorkspaces,

  getWorkspace,

  updateWorkspace,

  deleteWorkspace,

  getWorkspaceSummary,
  

};