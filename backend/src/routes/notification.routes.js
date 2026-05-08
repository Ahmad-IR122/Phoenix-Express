'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/me', authenticateUser, notificationController.getMyNotifications);
router.get('/unread-count', authenticateUser, notificationController.getUnreadNotificationsCount);
router.patch('/read-all', authenticateUser, notificationController.markAllMyNotificationsAsRead);
router.patch('/:id/read', authenticateUser, notificationController.markMyNotificationAsRead);

module.exports = router;
