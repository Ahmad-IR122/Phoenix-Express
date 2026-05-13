'use strict';

const { Op } = require('sequelize');
const { Notification } = require('../models');

const DEFAULT_LIMIT = 20;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapNotification = (notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  body: notification.body || '',
  target_role: notification.target_role,
  target_user_id: notification.target_user_id,
  target_employee_id: notification.target_employee_id,
  entity_type: notification.entity_type || null,
  entity_id: notification.entity_id || null,
  action_url: notification.action_url || null,
  is_read: Boolean(notification.is_read),
  read_at: notification.read_at,
  created_at: notification.createdAt,
  updated_at: notification.updatedAt,
});

const createNotification = async ({
  targetRole,
  targetUserId = null,
  targetEmployeeId = null,
  type,
  title,
  body = null,
  entityType = null,
  entityId = null,
  actionUrl = null,
  transaction,
}) => {
  if (!targetRole || !type || !title) {
    throw new Error('Notification targetRole, type, and title are required');
  }

  return Notification.create(
    {
      target_role: targetRole,
      target_user_id: targetUserId,
      target_employee_id: targetEmployeeId,
      type,
      title,
      body,
      entity_type: entityType,
      entity_id: entityId,
      action_url: actionUrl,
    },
    transaction ? { transaction } : undefined
  );
};

const notifyAdmins = async (payload) =>
  createNotification({
    ...payload,
    targetRole: 'admin',
  });

const notifyEmployee = async ({ employeeId, userId = null, ...payload }) =>
  createNotification({
    ...payload,
    targetRole: 'employee',
    targetEmployeeId: employeeId || null,
    targetUserId: userId || null,
  });

const buildRecipientFilter = ({ role, userId, employeeId }) => {
  if (!role) {
    return null;
  }

  if (role === 'admin') {
    return {
      target_role: 'admin',
      [Op.or]: [
        { target_user_id: null },
        ...(userId ? [{ target_user_id: toNumber(userId) }] : []),
      ],
    };
  }

  if (role === 'employee') {
    const recipientConditions = [{ target_user_id: null, target_employee_id: null }];

    if (userId) {
      recipientConditions.push({ target_user_id: toNumber(userId) });
    }

    if (employeeId) {
      recipientConditions.push({ target_employee_id: toNumber(employeeId) });
    }

    return {
      target_role: 'employee',
      [Op.or]: recipientConditions,
    };
  }

  return null;
};

const listNotificationsForRecipient = async ({ role, userId, employeeId, limit = DEFAULT_LIMIT }) => {
  const where = buildRecipientFilter({ role, userId, employeeId });

  if (!where) {
    return [];
  }

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Math.max(1, Math.min(toNumber(limit) || DEFAULT_LIMIT, 50)),
  });

  return notifications.map(mapNotification);
};

const getUnreadCountForRecipient = async ({ role, userId, employeeId }) => {
  const where = buildRecipientFilter({ role, userId, employeeId });

  if (!where) {
    return 0;
  }

  return Notification.count({
    where: {
      ...where,
      is_read: false,
    },
  });
};

const markNotificationAsRead = async ({ notificationId, role, userId, employeeId }) => {
  const where = buildRecipientFilter({ role, userId, employeeId });

  if (!where) {
    return null;
  }

  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      ...where,
    },
  });

  if (!notification) {
    return null;
  }

  if (!notification.is_read) {
    await notification.update({
      is_read: true,
      read_at: new Date(),
    });
  }

  return mapNotification(notification);
};

const markAllNotificationsAsRead = async ({ role, userId, employeeId }) => {
  const where = buildRecipientFilter({ role, userId, employeeId });

  if (!where) {
    return 0;
  }

  const [updatedCount] = await Notification.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        ...where,
        is_read: false,
      },
    }
  );

  return updatedCount;
};

const markEntityNotificationsAsRead = async ({ role, entityType, entityId }) => {
  if (!role || !entityType || !entityId) {
    return 0;
  }

  const [updatedCount] = await Notification.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        target_role: role,
        entity_type: entityType,
        entity_id: entityId,
        is_read: false,
      },
    }
  );

  return updatedCount;
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyEmployee,
  listNotificationsForRecipient,
  getUnreadCountForRecipient,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markEntityNotificationsAsRead,
};
