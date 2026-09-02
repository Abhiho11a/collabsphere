const mongoose = require("mongoose");

const Organization =
  require("../models/Organization");

const OrganizationMember =
  require("../models/OrganizationMember");


// =====================================================
// GET ORGANIZATION ID
// =====================================================

const getOrganizationId =
  (req) => {

    return (
      req.params.organizationId ||
      req.body?.organizationId ||
      req.query?.organizationId ||
      req.headers["x-organization-id"] ||
      null
    );

  };


// =====================================================
// REQUIRE ORGANIZATION MEMBERSHIP
// =====================================================

const requireOrganizationMember =
  async (req, res, next) => {

    try {

      const organizationId =
        getOrganizationId(req);


      if (!organizationId) {

        return res.status(400).json({
          success: false,
          message:
            "Organization ID is required",
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


      const membership =
        await OrganizationMember.findOne({
          organization:
            organizationId,

          user:
            req.user._id,

          status:
            "Active",
        }).populate({
          path: "organization",
          select:
            "name createdBy createdAt updatedAt",
        });


      if (!membership) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this organization",
        });

      }


      req.organization =
        membership.organization;

      req.organizationMembership =
        membership;

      req.organizationRole =
        membership.role;


      next();

    } catch (error) {

      console.error(
        "Organization authorization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to validate organization access",
      });

    }
  };


// =====================================================
// REQUIRE ORGANIZATION ADMIN
// =====================================================

const requireOrganizationAdmin =
  async (req, res, next) => {

    if (
      !req.organizationMembership
    ) {

      return res.status(500).json({
        success: false,
        message:
          "Organization membership has not been validated",
      });

    }


    if (
      req.organizationRole !==
      "organization_admin"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can perform this action",
      });

    }


    next();
  };


module.exports = {
  getOrganizationId,
  requireOrganizationMember,
  requireOrganizationAdmin,
};