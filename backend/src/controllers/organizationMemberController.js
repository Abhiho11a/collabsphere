const mongoose = require("mongoose");

const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");
const User = require("../models/User");


// =====================================================
// HELPER: GET ORGANIZATION MEMBERSHIP
// =====================================================

const getOrganizationMembership = async (
  organizationId,
  userId
) => {
  return OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
    status: "Active",
  });
};

const hasOrganizationPermission = async (
    organizationId,
    userId,
    permission
  ) => {
    const membership =
      await getOrganizationMembership(
        organizationId,
        userId
      );

    if (!membership) {
      return {
        allowed: false,
        membership: null,
        error: {
          status: 403,
          message:
            "You do not have access to this organization",
        },
      };
    }

    const organization =
      await Organization.findById(
        organizationId
      ).select("settings");

    if (!organization) {
      return {
        allowed: false,
        membership,
        error: {
          status: 404,
          message:
            "Organization not found",
        },
      };
    }

    const allowed =
      organization.settings?.permissions?.[
        membership.role
      ]?.[permission] === true;

    return {
      allowed,
      membership,
      organization,
    };
  };


// =====================================================
// HELPER: CHECK ORGANIZATION ADMIN
// =====================================================

const requireOrganizationAdmin = async (
  organizationId,
  userId
) => {
  const membership =
    await getOrganizationMembership(
      organizationId,
      userId
    );

  if (!membership) {
    return {
      error: {
        status: 403,
        message:
          "You do not have access to this organization",
      },
    };
  }

  if (
    membership.role !==
    "organization_admin"
  ) {
    return {
      error: {
        status: 403,
        message:
          "Only organization admins can perform this action",
      },
    };
  }

  return {
    membership,
  };
};


// =====================================================
// GET ORGANIZATION MEMBERS
// GET /api/organizations/:organizationId/members
// =====================================================

const getOrganizationMembers =
  async (req, res) => {
    try {
      const { organizationId } =
        req.params;

      // ---------------------------------------------
      // VALIDATE ORGANIZATION ID
      // ---------------------------------------------

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


      // ---------------------------------------------
      // CHECK USER ORGANIZATION ACCESS
      // ---------------------------------------------

      const membership =
        await getOrganizationMembership(
          organizationId,
          req.user._id
        );

      if (!membership) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this organization",
        });
      }


      // ---------------------------------------------
      // GET MEMBERS
      // ---------------------------------------------

      const members =
        await OrganizationMember.find({
          organization:
            organizationId,
          status: "Active",
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


      // ---------------------------------------------
      // FORMAT RESPONSE
      // ---------------------------------------------

      return res.status(200).json({
        success: true,

        members: members
          .filter(
            (member) =>
              member.user
          )
          .map(
            (member) => ({
              id:
                member._id,

              userId:
                member.user._id,

              name:
                member.user.name,

              email:
                member.user.email,

              avatar:
                member.user.avatar,

              provider:
                member.user.provider,

              emailVerified:
                member.user.emailVerified,

              role:
                member.role,

              status:
                member.status,

              joinedAt:
                member.joinedAt,

              createdAt:
                member.createdAt,

              updatedAt:
                member.updatedAt,
            })
          ),
      });

    } catch (error) {

      console.error(
        "Get organization members error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch organization members",
      });
    }
  };


// =====================================================
// ADD ORGANIZATION MEMBER
// POST /api/organizations/:organizationId/members
// =====================================================

const addOrganizationMember =
  async (req, res) => {
    try {
      const { organizationId } =
        req.params;

      const email =
        req.body?.email
          ?.toLowerCase()
          .trim();

      const role =
        req.body?.role || "member";


      // ---------------------------------------------
      // VALIDATE ORGANIZATION ID
      // ---------------------------------------------

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


      // ---------------------------------------------
      // VALIDATE EMAIL
      // ---------------------------------------------

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required",
        });
      }


      // ---------------------------------------------
      // VALIDATE ROLE
      // ---------------------------------------------

      const allowedRoles = [
        "organization_admin",
        "member",
        "guest",
      ];

      if (
        !allowedRoles.includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid organization member role",
        });
      }


      // ---------------------------------------------
      // CHECK ADMIN PERMISSION
      // ---------------------------------------------

      const authorization =
        await hasOrganizationPermission(
          organizationId,
          req.user._id,
          "inviteMembers"
        );

      if (!authorization.allowed) {
        return res.status(
          authorization.error?.status || 403
        ).json({
          success: false,
          message:
            authorization.error?.message ||
            "You do not have permission to invite members",
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
      // FIND USER
      // ---------------------------------------------

      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "No user found with this email",
        });
      }


      // ---------------------------------------------
      // PREVENT ADDING YOURSELF
      // ---------------------------------------------

      if (
        user._id.toString() ===
        req.user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You are already an organization member",
        });
      }


      // ---------------------------------------------
      // CHECK EXISTING MEMBERSHIP
      // ---------------------------------------------

      const existingMembership =
        await OrganizationMember.findOne({
          organization:
            organizationId,

          user:
            user._id,
        });


      if (existingMembership) {

        // -------------------------------------------
        // REACTIVATE SUSPENDED MEMBER
        // -------------------------------------------

        if (
          existingMembership.status ===
          "Suspended"
        ) {
          existingMembership.status =
            "Active";

          existingMembership.role =
            role;

          await existingMembership.save();

          const populatedMembership =
            await OrganizationMember
              .findById(
                existingMembership._id
              )
              .populate({
                path: "user",
                select:
                  "name email avatar provider emailVerified",
              });

          return res.status(200).json({
            success: true,

            message:
              "Organization member added back successfully",

            member: {
              id:
                populatedMembership._id,

              userId:
                populatedMembership.user._id,

              name:
                populatedMembership.user.name,

              email:
                populatedMembership.user.email,

              avatar:
                populatedMembership.user.avatar,

              role:
                populatedMembership.role,

              status:
                populatedMembership.status,

              joinedAt:
                populatedMembership.joinedAt,
            },
          });
        }


        // -------------------------------------------
        // ALREADY ACTIVE
        // -------------------------------------------

        return res.status(409).json({
          success: false,
          message:
            "User is already a member of this organization",
        });
      }


      // ---------------------------------------------
      // CREATE MEMBERSHIP
      // ---------------------------------------------

      const membership =
        await OrganizationMember.create({
          organization:
            organizationId,

          user:
            user._id,

          role,

          status:
            "Active",
        });


      // ---------------------------------------------
      // RETURN MEMBER
      // ---------------------------------------------

      return res.status(201).json({
        success: true,

        message:
          "Organization member added successfully",

        member: {
          id:
            membership._id,

          userId:
            user._id,

          name:
            user.name,

          email:
            user.email,

          avatar:
            user.avatar,

          role:
            membership.role,

          status:
            membership.status,

          joinedAt:
            membership.joinedAt,
        },
      });

    } catch (error) {

      console.error(
        "Add organization member error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to add organization member",
      });
    }
  };


// =====================================================
// UPDATE ORGANIZATION MEMBER ROLE
// PATCH /api/organizations/:organizationId/members/:memberId
// =====================================================

const updateOrganizationMemberRole =
  async (req, res) => {
    try {
      const {
        organizationId,
        memberId,
      } = req.params;

      const { role } =
        req.body;


      // ---------------------------------------------
      // VALIDATE IDs
      // ---------------------------------------------

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

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID",
        });
      }


      // ---------------------------------------------
      // VALIDATE ROLE
      // ---------------------------------------------

      const allowedRoles = [
        "organization_admin",
        "member",
        "guest",
      ];

      if (
        !allowedRoles.includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid organization role",
        });
      }


      // ---------------------------------------------
      // CHECK ADMIN PERMISSION
      // ---------------------------------------------

      const authorization =
        await hasOrganizationPermission(
          organizationId,
          req.user._id,
          "manageMembers"
        );

      if (!authorization.allowed) {
        return res.status(
          authorization.error?.status || 403
        ).json({
          success: false,
          message:
            authorization.error?.message ||
            "You do not have permission to manage organization members",
        });
      }

      // ---------------------------------------------
      // FIND MEMBER
      // ---------------------------------------------

      const member =
        await OrganizationMember
          .findOne({
            _id: memberId,

            organization:
              organizationId,

            status:
              "Active",
          })
          .populate({
            path: "user",
            select:
              "name email avatar provider emailVerified",
          });


      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Organization member not found",
        });
      }


      // ---------------------------------------------
      // PREVENT SELF ROLE CHANGE
      // ---------------------------------------------

      if (
        member.user._id.toString() ===
        req.user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot change your own organization role",
        });
      }


      // ---------------------------------------------
      // PREVENT REMOVING LAST ADMIN
      // ---------------------------------------------

      if (
        member.role ===
          "organization_admin" &&
        role !==
          "organization_admin"
      ) {

        const adminCount =
          await OrganizationMember.countDocuments(
            {
              organization:
                organizationId,

              role:
                "organization_admin",

              status:
                "Active",
            }
          );

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message:
              "The organization must have at least one admin",
          });
        }
      }


      // ---------------------------------------------
      // UPDATE ROLE
      // ---------------------------------------------

      member.role =
        role;

      await member.save();


      // ---------------------------------------------
      // RESPONSE
      // ---------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "Organization member role updated successfully",

        member: {
          id:
            member._id,

          userId:
            member.user._id,

          name:
            member.user.name,

          email:
            member.user.email,

          avatar:
            member.user.avatar,

          role:
            member.role,

          status:
            member.status,

          joinedAt:
            member.joinedAt,
        },
      });

    } catch (error) {

      console.error(
        "Update organization member role error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update organization member role",
      });
    }
  };


// =====================================================
// REMOVE / SUSPEND ORGANIZATION MEMBER
// DELETE /api/organizations/:organizationId/members/:memberId
// =====================================================

const removeOrganizationMember =
  async (req, res) => {
    try {
      const {
        organizationId,
        memberId,
      } = req.params;


      // ---------------------------------------------
      // VALIDATE IDs
      // ---------------------------------------------

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

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID",
        });
      }


      // ---------------------------------------------
      // CHECK ADMIN PERMISSION
      // ---------------------------------------------

      const authorization =
        await hasOrganizationPermission(
          organizationId,
          req.user._id,
          "manageMembers"
        );

      if (!authorization.allowed) {
        return res.status(
          authorization.error?.status || 403
        ).json({
          success: false,
          message:
            authorization.error?.message ||
            "You do not have permission to manage organization members",
        });
      }

      // ---------------------------------------------
      // FIND MEMBER
      // ---------------------------------------------

      const member =
        await OrganizationMember
          .findOne({
            _id: memberId,

            organization:
              organizationId,

            status:
              "Active",
          })
          .populate({
            path: "user",
            select:
              "name email avatar",
          });


      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Organization member not found",
        });
      }


      // ---------------------------------------------
      // PREVENT SELF REMOVAL
      // ---------------------------------------------

      if (
        member.user._id.toString() ===
        req.user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove yourself from the organization",
        });
      }


      // ---------------------------------------------
      // PREVENT REMOVING LAST ADMIN
      // ---------------------------------------------

      if (
        member.role ===
        "organization_admin"
      ) {

        const adminCount =
          await OrganizationMember.countDocuments(
            {
              organization:
                organizationId,

              role:
                "organization_admin",

              status:
                "Active",
            }
          );

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message:
              "The organization must have at least one admin",
          });
        }
      }


      // ---------------------------------------------
      // SOFT REMOVE
      // ---------------------------------------------

      member.status =
        "Suspended";

      await member.save();


      // ---------------------------------------------
      // RESPONSE
      // ---------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "Organization member removed successfully",
      });

    } catch (error) {

      console.error(
        "Remove organization member error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove organization member",
      });
    }
  };


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getOrganizationMembers,
  addOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
};