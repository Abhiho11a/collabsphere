const mongoose = require("mongoose");

const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const WorkspaceMember = require("../models/WorkspaceMember");
const Task = require("../models/Task");

// =====================================================
// CREATE PROJECT
// POST /api/workspaces/:workspaceId/projects
// =====================================================

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const {
      name,
      description,
      status,
      priority,
      startDate,
      dueDate,
    } = req.body;

    // -------------------------------------------------
    // Validate workspace ID
    // -------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -------------------------------------------------
    // Validate project name
    // -------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    // -------------------------------------------------
    // Check workspace membership
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
    // Only Owner and Admin can create projects
    // -------------------------------------------------

    if (
      !["Owner", "Admin"].includes(
        workspaceMember.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only workspace owners and admins can create projects",
      });
    }

    // -------------------------------------------------
    // Validate dates
    // -------------------------------------------------

    let parsedStartDate = null;
    let parsedDueDate = null;

    if (startDate) {
      parsedStartDate = new Date(startDate);

      if (Number.isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }
    }

    if (dueDate) {
      parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }
    }

    if (
      parsedStartDate &&
      parsedDueDate &&
      parsedDueDate < parsedStartDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Due date cannot be before start date",
      });
    }

    // -------------------------------------------------
    // Create project
    // -------------------------------------------------

    const project = await Project.create({
      workspace: workspaceId,
      name: name.trim(),
      description: description?.trim() || "",
      status: status || "Planning",
      priority: priority || "Medium",
      startDate: parsedStartDate,
      dueDate: parsedDueDate,
      createdBy: req.user._id,
    });

    // -------------------------------------------------
    // Automatically add creator as Project Manager
    // -------------------------------------------------

    await ProjectMember.create({
      project: project._id,
      user: req.user._id,
      role: "Project Manager",
      status: "Active",
    });

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Project created successfully",

      project: {
        id: project._id,
        workspace: project.workspace,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        dueDate: project.dueDate,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
};

// =====================================================
// GET WORKSPACE PROJECTS
// GET /api/workspaces/:workspaceId/projects
// =====================================================

const getWorkspaceProjects = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    // -------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -------------------------------------------------
    // CHECK WORKSPACE MEMBERSHIP
    // -------------------------------------------------

    const workspaceMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
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
    // GET ALL ACTIVE PROJECTS
    // -------------------------------------------------

    const projects =
      await Project.find({
        workspace: workspaceId,
        isActive: true,
      })
        .populate(
          "createdBy",
          "name email avatar"
        )
        .sort({
          createdAt: -1,
        });

    // -------------------------------------------------
    // GET ACTIVE PROJECT MEMBERSHIPS
    // FOR ALL PROJECTS IN THIS WORKSPACE
    // -------------------------------------------------

    const projectIds =
      projects.map(
        (project) => project._id
      );

    const projectMemberships =
      await ProjectMember.find({
        project: {
          $in: projectIds,
        },
        status: "Active",
      }).select(
        "project user"
      );

    // -------------------------------------------------
    // CREATE QUICK LOOKUP
    // -------------------------------------------------

    const userProjectIds =
      new Set();

    const memberCounts =
      new Map();

    projectMemberships.forEach(
      (membership) => {
        const projectId =
          membership.project.toString();

        // Count members
        memberCounts.set(
          projectId,
          (memberCounts.get(projectId) || 0) + 1
        );

        // Check whether current user
        // belongs to this project
        if (
          membership.user.toString() ===
          userId.toString()
        ) {
          userProjectIds.add(
            projectId
          );
        }
      }
    );

    // -------------------------------------------------
    // FORMAT PROJECT RESPONSE
    // -------------------------------------------------

    const formattedProjects =
      projects.map(
        (project) => {
          const projectId =
            project._id.toString();

          return {
            id: project._id,

            workspace:
              project.workspace,

            name:
              project.name,

            description:
              project.description,

            status:
              project.status,

            priority:
              project.priority,

            startDate:
              project.startDate,

            dueDate:
              project.dueDate,

            createdBy:
              project.createdBy
                ? {
                    id:
                      project.createdBy
                        ._id,

                    name:
                      project.createdBy
                        .name,

                    email:
                      project.createdBy
                        .email,

                    avatar:
                      project.createdBy
                        .avatar,
                  }
                : null,

            // --------------------------------
            // NEW ACCESS INFORMATION
            // --------------------------------

            hasAccess:
              userProjectIds.has(
                projectId
              ),

            // --------------------------------
            // NEW MEMBER COUNT
            // --------------------------------

            memberCount:
              memberCounts.get(
                projectId
              ) || 0,

            createdAt:
              project.createdAt,

            updatedAt:
              project.updatedAt,
          };
        }
      );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      projects:
        formattedProjects,
    });

  } catch (error) {
    console.error(
      "Get workspace projects error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch projects",
    });
  }
};

// =====================================================
// GET SINGLE PROJECT
// GET /api/workspaces/:workspaceId/projects/:projectId
// =====================================================

const getProject = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    // -------------------------------------------------
    // VALIDATE IDS
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(workspaceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(projectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // -------------------------------------------------
    // CHECK WORKSPACE MEMBERSHIP
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
    // FIND PROJECT
    // -------------------------------------------------

    const project =
      await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
        isActive: true,
      }).populate(
        "createdBy",
        "name email avatar"
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // FETCH PROJECT STATISTICS
    // -------------------------------------------------

    const [
      totalTasks,
      completedTasks,
      memberCount,
    ] = await Promise.all([
      // Total tasks
      Task.countDocuments({
        workspace: workspaceId,
        project: projectId,
      }),

      // Completed tasks
      Task.countDocuments({
        workspace: workspaceId,
        project: projectId,
        status: {
          $in: [
            "done",
            "completed",
            "Done",
            "Completed",
          ],
        },
      }),

      // Active project members
      ProjectMember.countDocuments({
        project: projectId,
        status: "Active",
      }),
    ]);

    // -------------------------------------------------
    // CALCULATE PROGRESS
    // -------------------------------------------------

    const progress =
      totalTasks > 0
        ? Math.round(
            (completedTasks / totalTasks) * 100
          )
        : 0;

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      project: {
        id: project._id,
        workspace: project.workspace,

        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,

        startDate: project.startDate,
        dueDate: project.dueDate,

        createdBy: project.createdBy
          ? {
              id: project.createdBy._id,
              name: project.createdBy.name,
              email: project.createdBy.email,
              avatar: project.createdBy.avatar,
            }
          : null,

        createdAt: project.createdAt,
        updatedAt: project.updatedAt,

        // -----------------------------------------
        // STATISTICS
        // -----------------------------------------

        totalTasks,
        completedTasks,
        remainingTasks:
          totalTasks - completedTasks,
        progress,

        membersCount: memberCount,
      },
    });
  } catch (error) {
    console.error(
      "Get project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project",
    });
  }
};


const getMyProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all active project memberships
    const memberships = await ProjectMember.find({
      user: userId,
      status: "Active",
    }).select("project");

    const projectIds = memberships.map(
      (membership) => membership.project
    );

    // Get the actual projects
    const projects = await Project.find({
      _id: { $in: projectIds },
      isActive: true,
    })
      .populate("workspace", "name")
      .populate("createdBy", "name email avatar")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error(
      "Get my projects error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your projects",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createProject,
  getWorkspaceProjects,
  getProject,
  getMyProjects
};