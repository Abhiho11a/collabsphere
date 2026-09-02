const express =
  require("express");

const router =
  express.Router();

const {
  getMyOrganizations,
  createOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganization,
  deleteOrganization,
} =
  require("../controllers/organizationController");

const {
  protect,
} =
  require("../middleware/authMiddleware");


// =====================================================
// ORGANIZATIONS
// =====================================================

router.get(
  "/",
  protect,
  getMyOrganizations
);


router.post(
  "/",
  protect,
  createOrganization
);

router.get(
  "/:organizationId/settings",
  protect,
  getOrganizationSettings
);

router.patch(
  "/:organizationId/settings",
  protect,
  updateOrganizationSettings
);
router.patch(
  "/:organizationId",
  protect,
  updateOrganization
);

router.delete(
  "/:organizationId",
  protect,
  deleteOrganization
);
module.exports = router;