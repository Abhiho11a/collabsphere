const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");
const User = require("../models/User");
const OrganizationMember = require("../models/OrganizationMember");

const {
  createNotification,
  emitNotification,
} = require(
  "./notificationController"
);


// ========================================
// HELPER: CHECK WORKSPACE ACCESS
// ========================================

const getMembership = async (workspaceId, userId) => {
  return WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
    status: "Active",
  });
};


// ========================================
// GET WORKSPACE MEMBERS
// ========================================

const getWorkspaceMembers = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;

    const membership =
      await getMembership(
        workspaceId,
        req.user._id
      );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this workspace",
      });
    }

    const members =
      await WorkspaceMember.find({
        workspace: workspaceId,
        status: {
          $ne: "Suspended",
        },
      })
        .populate({
          path: "user",
          select:
            "name email avatar provider emailVerified lastLogin createdAt",
        })
        .sort({
          role: 1,
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,
      members: members.map(
        (member) => ({
          id: member._id,
          userId: member.user._id,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar,
          provider: member.user.provider,
          emailVerified:
            member.user.emailVerified,
          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Get workspace members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch workspace members",
    });
  }
};


// ========================================
// ADD EXISTING USER TO WORKSPACE
// ========================================

const addWorkspaceMember = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    // ------------------------------------
    // Validate email
    // ------------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();


    // ------------------------------------
    // Validate role
    // ------------------------------------

    const allowedRoles = [
      "Admin",
      "Member",
      "Viewer",
    ];

    const memberRole =
      role || "Member";

    if (
      !allowedRoles.includes(
        memberRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid member role",
      });
    }


    // ------------------------------------
    // Check requester permission
    // ------------------------------------

    const requester =
      await getMembership(
        workspaceId,
        req.user._id
      );

    if (!requester) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this workspace",
      });
    }

    if (
      !["Owner", "Admin"].includes(
        requester.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only owners and admins can add members",
      });
    }


    // ------------------------------------
    // Find workspace
    // ------------------------------------

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


    // ------------------------------------
    // Find user
    // ------------------------------------

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No user found with this email",
      });
    }


    // ------------------------------------
    // Prevent adding yourself
    // ------------------------------------

    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You are already a member of this workspace",
      });
    }

    // ------------------------------------
    // Check organization membership
    // ------------------------------------

    const organizationMembership =
      await OrganizationMember.findOne({
        organization: workspace.organization,
        user: user._id,
        status: "Active",
      });

    if (!organizationMembership) {
      return res.status(403).json({
        success: false,
        message:
          "User must be an active member of this organization before being added to the workspace",
      });
    }


    // ------------------------------------
    // Check existing membership
    // ------------------------------------

    const existingMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: user._id,
      });

    if (existingMember) {

      if (
        existingMember.status ===
        "Suspended"
      ) {
        existingMember.status =
          "Active";

        existingMember.role =
          memberRole;

        await existingMember.save();

        return res.status(200).json({
          success: true,
          message:
            "Member added back to workspace",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "User is already a member of this workspace",
      });
    }


    // ------------------------------------
    // Create workspace membership
    // ------------------------------------

    const membership =
      await WorkspaceMember.create({
        workspace: workspaceId,
        user: user._id,
        role: memberRole,
        status: "Active",
      });


      // =====================================================
  // CREATE WORKSPACE INVITATION NOTIFICATION
  // =====================================================

  const notification =
    await createNotification({
      recipient:
        user._id,

      actor:
        req.user._id,

      type:
        "workspace_invitation",

      title:
        "Workspace Invitation",

      message:
        `You were added to ${workspace.name} as ${memberRole}.`,

      entityType:
        "workspace",

      entityId:
        workspace._id,

      actionUrl:
        `/workspaces/${workspace._id}`,

      metadata: {
        workspaceId:
          workspace._id,

        workspaceName:
          workspace.name,

        role:
          memberRole,
      },
    });

  emitNotification(
    req,
    notification
  );

    return res.status(201).json({
      success: true,
      message:
        "Member added successfully",
      member: {
        id: membership._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: membership.role,
        status: membership.status,
        joinedAt:
          membership.joinedAt,
      },
    });
  } catch (error) {
    console.error(
      "Add workspace member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to add workspace member",
    });
  }
};


// ========================================
// UPDATE MEMBER ROLE
// ========================================

const updateWorkspaceMemberRole =
  async (req, res) => {
    try {
      const {
        workspaceId,
        memberId,
      } = req.params;

      const { role } = req.body;


      // ----------------------------------
      // Validate role
      // ----------------------------------

      const allowedRoles = [
        "Admin",
        "Member",
        "Viewer",
      ];

      if (
        !allowedRoles.includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid member role",
        });
      }


      // ----------------------------------
      // Check requester
      // ----------------------------------

      const requester =
        await getMembership(
          workspaceId,
          req.user._id
        );

      if (!requester) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this workspace",
        });
      }


      // Only Owner/Admin
      if (
        !["Owner", "Admin"].includes(
          requester.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to change member roles",
        });
      }


      // ----------------------------------
      // Find target member
      // ----------------------------------

      const member =
        await WorkspaceMember.findOne({
          _id: memberId,
          workspace: workspaceId,
          status: "Active",
        }).populate({
          path: "user",
          select:
            "name email avatar",
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Workspace member not found",
        });
      }


      // ----------------------------------
      // Owner protection
      // ----------------------------------

      if (
        member.role === "Owner"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "The workspace owner role cannot be changed",
        });
      }


      // Admin cannot modify another Admin
      if (
        requester.role === "Admin" &&
        member.role === "Admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admins cannot change another admin's role",
        });
      }


      member.role = role;

      await member.save();


      return res.status(200).json({
        success: true,
        message:
          "Member role updated successfully",
        member: {
          id: member._id,
          userId: member.user._id,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar,
          role: member.role,
          status: member.status,
        },
      });
    } catch (error) {
      console.error(
        "Update workspace member role error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update member role",
      });
    }
  };


// ========================================
// REMOVE WORKSPACE MEMBER
// ========================================

const removeWorkspaceMember =
  async (req, res) => {
    try {
      const {
        workspaceId,
        memberId,
      } = req.params;


      // ----------------------------------
      // Check requester
      // ----------------------------------

      const requester =
        await getMembership(
          workspaceId,
          req.user._id
        );

      if (!requester) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this workspace",
        });
      }


      if (
        !["Owner", "Admin"].includes(
          requester.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only owners and admins can remove members",
        });
      }


      // ----------------------------------
      // Find target
      // ----------------------------------

      const member =
        await WorkspaceMember.findOne({
          _id: memberId,
          workspace: workspaceId,
          status: "Active",
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Workspace member not found",
        });
      }


      // ----------------------------------
      // Cannot remove owner
      // ----------------------------------

      if (
        member.role === "Owner"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "The workspace owner cannot be removed",
        });
      }


      // Admin cannot remove Admin
      if (
        requester.role === "Admin" &&
        member.role === "Admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admins cannot remove another admin",
        });
      }


      // ----------------------------------
      // Soft remove
      // ----------------------------------

      member.status =
        "Suspended";

      await member.save();


      return res.status(200).json({
        success: true,
        message:
          "Member removed successfully",
      });
    } catch (error) {
      console.error(
        "Remove workspace member error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove workspace member",
      });
    }
  };


module.exports = {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
};