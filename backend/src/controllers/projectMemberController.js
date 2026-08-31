const mongoose = require("mongoose");

const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const WorkspaceMember = require("../models/WorkspaceMember");
const User = require("../models/User");
const Activity = require("../models/Activity");


// =====================================================
// HELPER
// Check whether current user can manage project members
// =====================================================

const canManageProjectMembers = async (
  project,
  userId
) => {
  // -------------------------------------------------
  // Check workspace membership first
  // -------------------------------------------------

  const workspaceMember =
    await WorkspaceMember.findOne({
      workspace: project.workspace,
      user: userId,
      status: "Active",
    });

  if (!workspaceMember) {
    return false;
  }

  // -------------------------------------------------
  // Workspace Owner/Admin can manage project members
  // -------------------------------------------------

  if (
    ["Owner", "Admin"].includes(
      workspaceMember.role
    )
  ) {
    return true;
  }

  // -------------------------------------------------
  // Project Manager can manage project members
  // -------------------------------------------------

  const projectMember =
    await ProjectMember.findOne({
      project: project._id,
      user: userId,
      status: "Active",
    });

  if (
    projectMember &&
    projectMember.role === "Project Manager"
  ) {
    return true;
  }

  return false;
};


// =====================================================
// HELPER
// Create project activity safely
// =====================================================

const createProjectActivity = async ({
  type,
  projectId,
  workspaceId,
  userId,
  message,
  metadata = {},
}) => {
  try {
    await Activity.create({
      type,
      project: projectId,
      workspace: workspaceId,
      user: userId,
      message,
      metadata,
    });
  } catch (error) {
    // Activity failure should not break the
    // already completed member operation.
    console.error(
      "Project activity creation error:",
      error
    );
  }
};


// =====================================================
// GET PROJECT MEMBERS
// GET /api/workspaces/:workspaceId/projects/:projectId/members
// =====================================================

const getProjectMembers = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    // -------------------------------------------------
    // Validate IDs
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

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
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
    // Check project
    // -------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // Get project members
    // -------------------------------------------------

    const members =
      await ProjectMember.find({
        project: projectId,
      })
        .populate(
          "user",
          "name email avatar provider emailVerified"
        )
        .sort({
          joinedAt: 1,
        });

    return res.status(200).json({
      success: true,

      members: members.map((member) => ({
        id: member._id,
        userId: member.user?._id,

        name: member.user?.name || "",
        email: member.user?.email || "",
        avatar: member.user?.avatar || "",
        provider: member.user?.provider || null,

        emailVerified:
          member.user?.emailVerified || false,

        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
      })),
    });

  } catch (error) {
    console.error(
      "Get project members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch project members",
    });
  }
};


// =====================================================
// ADD PROJECT MEMBER
// POST /api/workspaces/:workspaceId/projects/:projectId/members
// =====================================================

const addProjectMember = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    const {
      email,
      role = "Member",
    } = req.body;

    // -------------------------------------------------
    // Validate IDs
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

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // -------------------------------------------------
    // Validate email
    // -------------------------------------------------

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // -------------------------------------------------
    // Validate role
    // -------------------------------------------------

    const allowedRoles = [
      "Project Manager",
      "Developer",
      "Designer",
      "Reviewer",
      "Member",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project member role",
      });
    }

    // -------------------------------------------------
    // Find project
    // -------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // Check whether requester can manage members
    // -------------------------------------------------

    const canManage =
      await canManageProjectMembers(
        project,
        req.user._id
      );

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage project members",
      });
    }

    // -------------------------------------------------
    // Find target user
    // -------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No COLLABSPHERE user found with this email",
      });
    }

    // -------------------------------------------------
    // Check target user's workspace membership
    // -------------------------------------------------

    const targetWorkspaceMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: user._id,
        status: "Active",
      });

    if (!targetWorkspaceMember) {
      return res.status(400).json({
        success: false,
        message:
          "This user must be a member of the workspace before joining the project",
      });
    }

    // -------------------------------------------------
    // Check existing project membership
    // -------------------------------------------------

    const existingMember =
      await ProjectMember.findOne({
        project: projectId,
        user: user._id,
      });

    if (existingMember) {

      // -------------------------------------------------
      // Reactivate suspended member
      // -------------------------------------------------

      if (
        existingMember.status ===
        "Suspended"
      ) {
        existingMember.status = "Active";
        existingMember.role = role;

        await existingMember.save();

        // Activity
        await createProjectActivity({
          type: "member_added",

          projectId,
          workspaceId,

          userId: req.user._id,

          message:
            `reactivated ${user.name} in the project`,

          metadata: {
            memberId:
              existingMember._id,

            memberUserId:
              user._id,

            memberName:
              user.name,

            role,
            action: "reactivated",
          },
        });

        return res.status(200).json({
          success: true,

          message:
            "Project member reactivated successfully",

          member: {
            id: existingMember._id,
            userId: user._id,

            name: user.name,
            email: user.email,
            avatar: user.avatar,

            role: existingMember.role,
            status: existingMember.status,

            joinedAt:
              existingMember.joinedAt,
          },
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "User is already a member of this project",
      });
    }

    // -------------------------------------------------
    // Add project member
    // -------------------------------------------------

    const projectMember =
      await ProjectMember.create({
        project: projectId,
        user: user._id,
        role,
        status: "Active",
      });

    // -------------------------------------------------
    // CREATE ACTIVITY
    // -------------------------------------------------

    await createProjectActivity({
      type: "member_added",

      projectId,
      workspaceId,

      userId: req.user._id,

      message:
        `added ${user.name} to the project`,

      metadata: {
        memberId:
          projectMember._id,

        memberUserId:
          user._id,

        memberName:
          user.name,

        role,
        action: "added",
      },
    });

    return res.status(201).json({
      success: true,

      message:
        "Project member added successfully",

      member: {
        id: projectMember._id,
        userId: user._id,

        name: user.name,
        email: user.email,
        avatar: user.avatar,

        role: projectMember.role,
        status: projectMember.status,

        joinedAt:
          projectMember.joinedAt,
      },
    });

  } catch (error) {
    console.error(
      "Add project member error:",
      error
    );

    // -------------------------------------------------
    // Handle duplicate unique index safely
    // -------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "User is already a member of this project",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to add project member",
    });
  }
};


// =====================================================
// UPDATE PROJECT MEMBER ROLE
// PATCH /api/workspaces/:workspaceId/projects/:projectId/members/:memberId
// =====================================================

const updateProjectMemberRole = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      projectId,
      memberId,
    } = req.params;

    const { role } = req.body;

    // -------------------------------------------------
    // Validate IDs
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

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        memberId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    // -------------------------------------------------
    // Validate role
    // -------------------------------------------------

    const allowedRoles = [
      "Project Manager",
      "Developer",
      "Designer",
      "Reviewer",
      "Member",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project member role",
      });
    }

    // -------------------------------------------------
    // Find project
    // -------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // Check permission
    // -------------------------------------------------

    const canManage =
      await canManageProjectMembers(
        project,
        req.user._id
      );

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage project members",
      });
    }

    // -------------------------------------------------
    // Find project member
    // -------------------------------------------------

    const member =
      await ProjectMember.findOne({
        _id: memberId,
        project: projectId,
      }).populate(
        "user",
        "name email avatar"
      );

    if (!member) {
      return res.status(404).json({
        success: false,
        message:
          "Project member not found",
      });
    }

    // -------------------------------------------------
    // If role hasn't changed
    // -------------------------------------------------

    if (member.role === role) {
      return res.status(200).json({
        success: true,

        message:
          "Project member role is already set to this role",

        member: {
          id: member._id,
          userId: member.user?._id,

          name: member.user?.name || "",
          email: member.user?.email || "",
          avatar: member.user?.avatar || "",

          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt,
        },
      });
    }

    // -------------------------------------------------
    // Store old role BEFORE changing it
    // -------------------------------------------------

    const oldRole = member.role;

    // -------------------------------------------------
    // Prevent removing the last Project Manager role
    // -------------------------------------------------

    if (
      member.role === "Project Manager" &&
      role !== "Project Manager"
    ) {
      const managerCount =
        await ProjectMember.countDocuments({
          project: projectId,
          role: "Project Manager",
          status: "Active",
        });

      if (managerCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "A project must have at least one Project Manager",
        });
      }
    }

    // -------------------------------------------------
    // Update role
    // -------------------------------------------------

    member.role = role;

    await member.save();

    // -------------------------------------------------
    // CREATE ACTIVITY
    // -------------------------------------------------

    await createProjectActivity({
      type: "member_role_updated",

      projectId,
      workspaceId,

      userId: req.user._id,

      message:
        `changed ${member.user?.name || "a member"}'s role from ${oldRole} to ${role}`,

      metadata: {
        memberId:
          member._id,

        memberUserId:
          member.user?._id,

        memberName:
          member.user?.name || "",

        oldRole,
        newRole: role,
      },
    });

    return res.status(200).json({
      success: true,

      message:
        "Project member role updated successfully",

      member: {
        id: member._id,
        userId: member.user?._id,

        name: member.user?.name || "",
        email: member.user?.email || "",
        avatar: member.user?.avatar || "",

        role: member.role,
        status: member.status,

        joinedAt: member.joinedAt,
      },
    });

  } catch (error) {
    console.error(
      "Update project member role error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update project member role",
    });
  }
};


// =====================================================
// REMOVE PROJECT MEMBER
// DELETE /api/workspaces/:workspaceId/projects/:projectId/members/:memberId
// =====================================================

const removeProjectMember = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      projectId,
      memberId,
    } = req.params;

    // -------------------------------------------------
    // Validate IDs
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

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        memberId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    // -------------------------------------------------
    // Find project
    // -------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -------------------------------------------------
    // Check permission
    // -------------------------------------------------

    const canManage =
      await canManageProjectMembers(
        project,
        req.user._id
      );

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage project members",
      });
    }

    // -------------------------------------------------
    // Find member
    // -------------------------------------------------

    const member =
      await ProjectMember.findOne({
        _id: memberId,
        project: projectId,
      }).populate(
        "user",
        "name email avatar"
      );

    if (!member) {
      return res.status(404).json({
        success: false,
        message:
          "Project member not found",
      });
    }

    // -------------------------------------------------
    // Prevent removing the last Project Manager
    // -------------------------------------------------

    if (
      member.role === "Project Manager"
    ) {
      const managerCount =
        await ProjectMember.countDocuments({
          project: projectId,
          role: "Project Manager",
          status: "Active",
        });

      if (managerCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove the last Project Manager from the project",
        });
      }
    }

    // -------------------------------------------------
    // Store member information BEFORE suspension
    // -------------------------------------------------

    const memberName =
      member.user?.name || "a member";

    const memberUserId =
      member.user?._id;

    const memberRole =
      member.role;

    // -------------------------------------------------
    // Suspend instead of deleting
    // -------------------------------------------------

    member.status = "Suspended";

    await member.save();

    // -------------------------------------------------
    // CREATE ACTIVITY
    // -------------------------------------------------

    await createProjectActivity({
      type: "member_removed",

      projectId,
      workspaceId,

      userId: req.user._id,

      message:
        `removed ${memberName} from the project`,

      metadata: {
        memberId:
          member._id,

        memberUserId,

        memberName,

        role: memberRole,

        action: "removed",
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Project member removed successfully",
    });

  } catch (error) {
    console.error(
      "Remove project member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to remove project member",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
};