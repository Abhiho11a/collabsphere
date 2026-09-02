const express = require("express");

const router = express.Router();

const {
  getOrganizationMembers,
  addOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
} = require("../controllers/organizationMemberController");

const {
  protect,
} = require("../middleware/authMiddleware");


// GET MEMBERS
router.get(
  "/:organizationId/members",
  protect,
  getOrganizationMembers
);


// ADD MEMBER
router.post(
  "/:organizationId/members",
  protect,
  addOrganizationMember
);


// UPDATE ROLE
router.patch(
  "/:organizationId/members/:memberId",
  protect,
  updateOrganizationMemberRole
);


// REMOVE MEMBER
router.delete(
  "/:organizationId/members/:memberId",
  protect,
  removeOrganizationMember
);


module.exports = router;