const mongoose = require("mongoose");

const Notification =
  require("../models/Notification");


// =====================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// =====================================================

const getMyNotifications = async (
  req,
  res
) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 50,
      100
    );

    const notifications =
      await Notification.find({
        recipient:
          req.user._id,
      })
        .populate(
          "actor",
          "name email avatar"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    const unreadCount =
      await Notification.countDocuments({
        recipient:
          req.user._id,

        isRead: false,
      });

    return res.status(200).json({
      success: true,

      notifications,

      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch notifications",
    });
  }
};


// =====================================================
// MARK ONE AS READ
// PATCH /api/notifications/:notificationId/read
// =====================================================

const markNotificationAsRead =
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid notification ID",
        });
      }

      const notification =
        await Notification.findOne({
          _id: notificationId,

          recipient:
            req.user._id,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,

          message:
            "Notification not found",
        });
      }

      if (!notification.isRead) {
        notification.isRead = true;

        notification.readAt =
          new Date();

        await notification.save();
      }

      return res.status(200).json({
        success: true,

        notification,
      });
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to mark notification as read",
      });
    }
  };


// =====================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// =====================================================

const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          recipient:
            req.user._id,

          isRead: false,
        },

        {
          $set: {
            isRead: true,

            readAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        success: true,

        message:
          "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to mark notifications as read",
      });
    }
  };


// =====================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:notificationId
// =====================================================

const deleteNotification =
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid notification ID",
        });
      }

      const deleted =
        await Notification.findOneAndDelete({
          _id: notificationId,

          recipient:
            req.user._id,
        });

      if (!deleted) {
        return res.status(404).json({
          success: false,

          message:
            "Notification not found",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Notification deleted",
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete notification",
      });
    }
  };


// =====================================================
// CREATE NOTIFICATION
//
// This helper is used internally by:
// workspace invitations
// project invitations
// tasks
// files
// documents
// mentions
// chat
// etc.
// =====================================================

const createNotification = async ({
  recipient,
  actor = null,
  type,
  title,
  message,
  entityType = "none",
  entityId = null,
  actionUrl = "",
  metadata = {},
}) => {
  try {
    if (!recipient) {
      return null;
    }

    const notification =
      await Notification.create({
        recipient,

        actor,

        type,

        title,

        message,

        entityType,

        entityId,

        actionUrl,

        metadata,

        isRead: false,
      });

    const populated =
      await Notification.findById(
        notification._id
      )
        .populate(
          "actor",
          "name email avatar"
        )
        .lean();

    return populated;
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    return null;
  }
};


// =====================================================
// REAL-TIME NOTIFICATION DELIVERY
// =====================================================

const emitNotification = (
  req,
  notification
) => {
  try {
    if (!notification) {
      return;
    }

    const io =
      req.app.get("io");

    if (!io) {
      return;
    }

    const recipientId =
      notification.recipient?._id ||
      notification.recipient;

    if (!recipientId) {
      return;
    }

    io.to(
      `user:${recipientId.toString()}`
    ).emit(
      "notification:new",
      notification
    );
  } catch (error) {
    console.error(
      "Emit notification error:",
      error
    );
  }
};


module.exports = {
  getMyNotifications,

  markNotificationAsRead,

  markAllNotificationsAsRead,

  deleteNotification,

  createNotification,

  emitNotification,
};