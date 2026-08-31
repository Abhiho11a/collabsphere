const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");

const Task = require("../models/Task")
const Project = require("../models/Project")


// ========================================
// CREATE WORKSPACE
// ========================================
const createWorkspace = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, description } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
    }

    let createdWorkspace;

    // ========================================
    // TRANSACTION
    // ========================================

    await session.withTransaction(async () => {
      // --------------------------------------
      // Create workspace
      // --------------------------------------

      const [workspace] = await Workspace.create(
        [
          {
            name: name.trim(),
            description: description?.trim() || "",
            owner: req.user._id,
          },
        ],
        { session }
      );

      // --------------------------------------
      // Create Owner membership
      // --------------------------------------

      await WorkspaceMember.create(
        [
          {
            workspace: workspace._id,
            user: req.user._id,
            role: "Owner",
            status: "Active",
          },
        ],
        { session }
      );

      createdWorkspace = workspace;
    });

    // ========================================
    // SUCCESS
    // ========================================

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",

      workspace: {
        id: createdWorkspace._id,
        name: createdWorkspace.name,
        description: createdWorkspace.description,
        owner: createdWorkspace.owner,
        createdAt: createdWorkspace.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create workspace error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create workspace",
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
    // ----------------------------------------
    // GET ACTIVE WORKSPACE MEMBERSHIPS
    // ----------------------------------------

    const memberships = await WorkspaceMember.find({
      user: req.user._id,
      status: "Active",
    })
      .populate({
        path: "workspace",
        select:
          "name description owner isActive createdAt updatedAt",
      })
      .sort({
        createdAt: -1,
      });

    // ----------------------------------------
    // REMOVE INVALID / INACTIVE WORKSPACES
    // ----------------------------------------

    const activeMemberships = memberships.filter(
      (membership) =>
        membership.workspace &&
        membership.workspace.isActive
    );

    // ----------------------------------------
    // BUILD WORKSPACE DATA
    // ----------------------------------------

    const workspaces = await Promise.all(
      activeMemberships.map(async (membership) => {
        const workspaceId =
          membership.workspace._id;

        // --------------------------------------
        // GET COUNTS
        // --------------------------------------

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

        // --------------------------------------
        // RETURN WORKSPACE
        // --------------------------------------

        return {
          id: workspaceId,

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
      })
    );

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      count: workspaces.length,
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


// ========================================
// GET SINGLE WORKSPACE
// ========================================

const getWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "Active",
      }).populate({
        path: "workspace",
        select:
          "name description owner isActive createdAt updatedAt",
      });

    if (
      !membership ||
      !membership.workspace ||
      !membership.workspace.isActive
    ) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    return res.status(200).json({
      success: true,
      workspace: {
        id: membership.workspace._id,
        name: membership.workspace.name,
        description:
          membership.workspace.description,
        owner: membership.workspace.owner,
        role: membership.role,
        createdAt:
          membership.workspace.createdAt,
        updatedAt:
          membership.workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get workspace error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch workspace",
    });
  }
};


// ========================================
// UPDATE WORKSPACE
// ========================================

const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    const membership =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "Active",
        role: {
          $in: ["Owner", "Admin"],
        },
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this workspace",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        isActive: true,
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Workspace name cannot be empty",
        });
      }

      workspace.name = name.trim();
    }

    if (description !== undefined) {
      workspace.description =
        description.trim();
    }

    await workspace.save();

    return res.status(200).json({
      success: true,
      message:
        "Workspace updated successfully",
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        owner: workspace.owner,
        updatedAt: workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update workspace error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update workspace",
    });
  }
};


// ========================================
// DELETE WORKSPACE
// ========================================

const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        role: "Owner",
        status: "Active",
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "Only the workspace owner can delete this workspace",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        isActive: true,
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    workspace.isActive = false;

    await workspace.save();

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
      message: "Unable to delete workspace",
    });
  }
};

// Summary
const getWorkspaceSummary = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // -------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -------------------------------------------------
    // CHECK WORKSPACE ACCESS
    // -------------------------------------------------

    const workspaceMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "Active",
      });

    if (!workspaceMember) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this workspace",
      });
    }

    // -------------------------------------------------
    // CHECK WORKSPACE EXISTS
    // -------------------------------------------------

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // -------------------------------------------------
    // GET COUNTS
    // -------------------------------------------------

    const [
      projectCount,
      memberCount,
      taskCount,
      completedTaskCount,
    ] = await Promise.all([
      // Active projects
      Project.countDocuments({
        workspace: workspaceId,
        isActive: true,
      }),

      // Active workspace members
      WorkspaceMember.countDocuments({
        workspace: workspaceId,
        status: "Active",
      }),

      // All tasks in workspace
      Task.countDocuments({
        workspace: workspaceId,
      }),

      // Completed tasks
      Task.countDocuments({
        workspace: workspaceId,
        status: {
          $in: ["done", "completed", "Done", "Completed"],
        },
      }),
    ]);

    // -------------------------------------------------
    // PROGRESS
    // -------------------------------------------------

    const progress =
      taskCount > 0
        ? Math.round(
            (completedTaskCount / taskCount) * 100
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
          taskCount - completedTaskCount,
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


module.exports = {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceSummary
};