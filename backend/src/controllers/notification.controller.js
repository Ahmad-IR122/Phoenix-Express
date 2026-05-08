'use strict';

const {
  listNotificationsForRecipient,
  getUnreadCountForRecipient,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../services/notification.service');

const getRecipientContext = (req) => ({
  role: req.user?.role,
  userId: req.user?.id || null,
  employeeId: req.user?.employeeId || null,
});

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await listNotificationsForRecipient({
      ...getRecipientContext(req),
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      errors: [error.message],
    });
  }
};

const getUnreadNotificationsCount = async (req, res) => {
  try {
    const unreadCount = await getUnreadCountForRecipient(getRecipientContext(req));

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notifications count',
      errors: [error.message],
    });
  }
};

const markMyNotificationAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead({
      notificationId: Number(req.params.id),
      ...getRecipientContext(req),
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      errors: [error.message],
    });
  }
};

const markAllMyNotificationsAsRead = async (req, res) => {
  try {
    const updatedCount = await markAllNotificationsAsRead(getRecipientContext(req));

    return res.status(200).json({
      success: true,
      message: 'Notifications marked as read',
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      errors: [error.message],
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadNotificationsCount,
  markMyNotificationAsRead,
  markAllMyNotificationsAsRead,
};
