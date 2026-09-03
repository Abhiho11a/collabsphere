const jwt = require("jsonwebtoken");

const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");

const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");

const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");

const User = require("../models/User");

// =====================================================
// SUPER ADMIN LOGIN
// =====================================================

const superAdminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const configuredPassword =
      process.env.SUPERADMIN_PASSWORD;

    if (!configuredPassword) {
      console.error(
        "SUPERADMIN_PASSWORD is not configured"
      );

      return res.status(500).json({
        success: false,
        message:
          "Super Admin authentication is not configured",
      });
    }

    if (password !== configuredPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid Super Admin password",
      });
    }

    const token = jwt.sign(
      {
        type: "superadmin",
        role: "superadmin",
      },
      process.env.SUPERADMIN_JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.cookie(
      "superAdminToken",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 8 * 60 * 60 * 1000,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Super Admin login successful",
      role: "superadmin",
    });
  } catch (error) {
    console.error(
      "Super Admin login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to login as Super Admin",
    });
  }
};


// =====================================================
// SUPER ADMIN LOGOUT
// =====================================================

const superAdminLogout = async (req, res) => {
  try {
    res.clearCookie(
      "superAdminToken",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Super Admin logged out",
    });
  } catch (error) {
    console.error(
      "Super Admin logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to logout",
    });
  }
};


// =====================================================
// SUPER ADMIN SESSION
// =====================================================

const getSuperAdminSession = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,
    authenticated: true,
    role: "superadmin",
  });
};


// =====================================================
// SUPER ADMIN DASHBOARD
// =====================================================

const getSuperAdminDashboard =
  async (req, res) => {
    try {
      // ---------------------------------------------
      // ORGANIZATIONS
      // ---------------------------------------------

      const organizations =
        await Organization.find()
          .sort({ createdAt: -1 })
          .lean();

      // ---------------------------------------------
      // WORKSPACES
      // ---------------------------------------------

      const workspaces =
        await Workspace.find()
          .sort({ createdAt: -1 })
          .lean();

      // ---------------------------------------------
      // PROJECTS
      // ---------------------------------------------

      const projects =
        await Project.find()
          .sort({ createdAt: -1 })
          .lean();

      // ---------------------------------------------
      // ORGANIZATION MEMBERS
      // ---------------------------------------------

      const organizationMembers =
        await OrganizationMember.find({
          status: "Active",
        })
          .populate(
            "user",
            "name email avatar"
          )
          .lean();

      // ---------------------------------------------
      // WORKSPACE MEMBERS
      // ---------------------------------------------

      const workspaceMembers =
        await WorkspaceMember.find({
          status: "Active",
        })
          .populate(
            "user",
            "name email avatar"
          )
          .lean();

      // ---------------------------------------------
      // BUILD WORKSPACE DATA
      // ---------------------------------------------

      const workspaceData =
        workspaces.map((workspace) => {
          const workspaceProjects =
            projects.filter(
              (project) =>
                String(
                  project.workspace
                ) ===
                String(workspace._id)
            );

          const workspaceMemberList =
            workspaceMembers.filter(
              (member) =>
                String(
                  member.workspace
                ) ===
                String(workspace._id)
            );

          return {
            id: workspace._id,
            name: workspace.name,
            description:
              workspace.description || "",
            organization:
              workspace.organization,
            owner: workspace.owner,
            isActive:
              workspace.isActive !== false,
            createdAt:
              workspace.createdAt,

            memberCount:
              workspaceMemberList.length,

            projectCount:
              workspaceProjects.length,

            projects:
              workspaceProjects.map(
                (project) => ({
                  id: project._id,
                  name: project.name,
                  description:
                    project.description ||
                    "",
                  workspace:
                    project.workspace,
                  owner:
                    project.owner,
                  createdAt:
                    project.createdAt,
                })
              ),
          };
        });

      // ---------------------------------------------
      // BUILD ORGANIZATION DATA
      // ---------------------------------------------

      const organizationData =
        organizations.map(
          (organization) => {
            const organizationWorkspaces =
              workspaceData.filter(
                (workspace) =>
                  String(
                    workspace.organization
                  ) ===
                  String(
                    organization._id
                  )
              );

            const organizationMemberList =
              organizationMembers.filter(
                (member) =>
                  String(
                    member.organization
                  ) ===
                  String(
                    organization._id
                  )
              );

            return {
              id: organization._id,
              name: organization.name,
              createdBy:
                organization.createdBy,
              createdAt:
                organization.createdAt,
              updatedAt:
                organization.updatedAt,

              memberCount:
                organizationMemberList.length,

              workspaceCount:
                organizationWorkspaces.length,

              projectCount:
                organizationWorkspaces.reduce(
                  (total, workspace) =>
                    total +
                    workspace.projectCount,
                  0
                ),

              members:
                organizationMemberList.map(
                  (member) => ({
                    id: member.user?._id,
                    name:
                      member.user?.name ||
                      "Unknown user",
                    email:
                      member.user?.email ||
                      "",
                    avatar:
                      member.user?.avatar ||
                      "",
                    role:
                      member.role,
                    joinedAt:
                      member.joinedAt,
                  })
                ),

              workspaces:
                organizationWorkspaces,
            };
          }
        );

      // ---------------------------------------------
      // GLOBAL STATISTICS
      // ---------------------------------------------

      const totalUsers =
        await User.countDocuments({
          isActive: true,
        });

      return res.status(200).json({
        success: true,

        statistics: {
          organizations:
            organizations.length,

          workspaces:
            workspaces.length,

          projects:
            projects.length,

          users:
            totalUsers,
        },

        organizations:
          organizationData,
      });
    } catch (error) {
      console.error(
        "Super Admin dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load Super Admin dashboard",
      });
    }
  };
// =====================================================
// DELETE ORGANIZATION
// =====================================================

const deleteOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const organization =
      await Organization.findById(
        organizationId
      );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // ---------------------------------------------
    // FIND WORKSPACES
    // ---------------------------------------------

    const workspaces =
      await Workspace.find({
        organization: organizationId,
      }).select("_id");

    const workspaceIds =
      workspaces.map(
        (workspace) => workspace._id
      );

    // ---------------------------------------------
    // FIND PROJECTS
    // ---------------------------------------------

    const projects =
      await Project.find({
        workspace: {
          $in: workspaceIds,
        },
      }).select("_id");

    const projectIds =
      projects.map(
        (project) => project._id
      );

    // ---------------------------------------------
    // DELETE PROJECT MEMBERS
    // ---------------------------------------------

    if (projectIds.length > 0) {
      await ProjectMember.deleteMany({
        project: {
          $in: projectIds,
        },
      });
    }

    // ---------------------------------------------
    // DELETE PROJECTS
    // ---------------------------------------------

    if (projectIds.length > 0) {
      await Project.deleteMany({
        _id: {
          $in: projectIds,
        },
      });
    }

    // ---------------------------------------------
    // DELETE WORKSPACE MEMBERS
    // ---------------------------------------------

    if (workspaceIds.length > 0) {
      await WorkspaceMember.deleteMany({
        workspace: {
          $in: workspaceIds,
        },
      });
    }

    // ---------------------------------------------
    // DELETE WORKSPACES
    // ---------------------------------------------

    if (workspaceIds.length > 0) {
      await Workspace.deleteMany({
        _id: {
          $in: workspaceIds,
        },
      });
    }

    // ---------------------------------------------
    // DELETE ORGANIZATION MEMBERS
    // ---------------------------------------------

    await OrganizationMember.deleteMany({
      organization: organizationId,
    });

    // ---------------------------------------------
    // DELETE ORGANIZATION
    // ---------------------------------------------

    await Organization.deleteOne({
      _id: organizationId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Organization and all associated data deleted successfully",
      deleted: {
        organizationId,
        workspaces:
          workspaceIds.length,
        projects:
          projectIds.length,
      },
    });
  } catch (error) {
    console.error(
      "Super Admin delete organization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete organization",
    });
  }
};


// =====================================================
// DELETE WORKSPACE
// =====================================================

const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace ID is required",
      });
    }

    const workspace =
      await Workspace.findById(
        workspaceId
      );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // ---------------------------------------------
    // FIND PROJECTS
    // ---------------------------------------------

    const projects =
      await Project.find({
        workspace: workspaceId,
      }).select("_id");

    const projectIds =
      projects.map(
        (project) => project._id
      );

    // ---------------------------------------------
    // DELETE PROJECT MEMBERS
    // ---------------------------------------------

    if (projectIds.length > 0) {
      await ProjectMember.deleteMany({
        project: {
          $in: projectIds,
        },
      });
    }

    // ---------------------------------------------
    // DELETE PROJECTS
    // ---------------------------------------------

    if (projectIds.length > 0) {
      await Project.deleteMany({
        _id: {
          $in: projectIds,
        },
      });
    }

    // ---------------------------------------------
    // DELETE WORKSPACE MEMBERS
    // ---------------------------------------------

    await WorkspaceMember.deleteMany({
      workspace: workspaceId,
    });

    // ---------------------------------------------
    // DELETE WORKSPACE
    // ---------------------------------------------

    await Workspace.deleteOne({
      _id: workspaceId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Workspace and associated projects deleted successfully",
      deleted: {
        workspaceId,
        projects:
          projectIds.length,
      },
    });
  } catch (error) {
    console.error(
      "Super Admin delete workspace error:",
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
// DELETE PROJECT
// =====================================================

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project =
      await Project.findById(
        projectId
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // ---------------------------------------------
    // DELETE PROJECT MEMBERS
    // ---------------------------------------------

    await ProjectMember.deleteMany({
      project: projectId,
    });

    // ---------------------------------------------
    // DELETE PROJECT
    // ---------------------------------------------

    await Project.deleteOne({
      _id: projectId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Project deleted successfully",
      deleted: {
        projectId,
      },
    });
  } catch (error) {
    console.error(
      "Super Admin delete project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete project",
    });
  }
};

module.exports = {
  superAdminLogin,
  superAdminLogout,
  getSuperAdminSession,
  getSuperAdminDashboard,
  deleteOrganization,
  deleteWorkspace,
  deleteProject
};