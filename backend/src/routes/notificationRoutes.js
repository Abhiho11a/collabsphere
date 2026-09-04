const express = require("express");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require(
  "../controllers/notificationController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();


// Get current user's notifications
router.get(
  "/",
  protect,
  getMyNotifications
);


// Mark ALL as read
router.patch(
  "/read-all",
  protect,
  markAllNotificationsAsRead
);


// Mark one as read
router.patch(
  "/:notificationId/read",
  protect,
  markNotificationAsRead
);


// Delete one
router.delete(
  "/:notificationId",
  protect,
  deleteNotification
);


module.exports = router;