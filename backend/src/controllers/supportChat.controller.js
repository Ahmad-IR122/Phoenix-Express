'use strict';

const {
  Sequelize,
  Customer,
  Employee,
  User,
  SupportConversation,
  SupportMessage,
} = require('../models');
const {
  markEntityNotificationsAsRead,
  notifyEmployee,
} = require('../services/notification.service');

const { Op } = Sequelize;

const conversationInclude = [
  {
    model: SupportMessage,
    as: 'messages',
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'email', 'phone', 'role'],
      },
    ],
  },
  {
    model: User,
    as: 'customer_user',
    attributes: ['id', 'email', 'phone', 'role'],
  },
  {
    model: Customer,
    as: 'customer',
    include: ['individual_profile', 'company_profile'],
  },
];

const mapConversation = (conversation) => {
  const plain = conversation.toJSON ? conversation.toJSON() : conversation;
  const customerName =
    plain.customer?.individual_profile?.full_name ||
    plain.customer?.company_profile?.company_name ||
    plain.customer_user?.email ||
    'عميل فينوكس';

  return {
    id: String(plain.id),
    customerId: plain.customer_user_id,
    customerDbId: plain.customer_id,
    customerName,
    customerEmail: plain.customer_user?.email || '',
    status: plain.status,
    employeeHiddenAt: plain.employee_hidden_at
      ? new Date(plain.employee_hidden_at).getTime()
      : null,
    createdAt: new Date(plain.created_at || plain.createdAt).getTime(),
    updatedAt: new Date(plain.updated_at || plain.updatedAt).getTime(),
    messages: (plain.messages || [])
      .sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt))
      .map((message) => ({
        id: String(message.id),
        role: message.sender_role,
        text: message.message,
        readAt: message.read_at ? new Date(message.read_at).getTime() : null,
        createdAt: new Date(message.created_at || message.createdAt).getTime(),
      })),
  };
};

const findCustomerForUser = async (userId) => {
  return Customer.findOne({ where: { user_id: userId } });
};

const findOrCreateCustomerConversation = async (userId) => {
  const customer = await findCustomerForUser(userId);

  if (!customer) {
    const error = new Error('Customer profile not found');
    error.status = 404;
    throw error;
  }

  const existingConversation = await SupportConversation.findOne({
    where: {
      customer_id: customer.id,
      customer_user_id: userId,
      status: { [Op.in]: ['open', 'answered'] },
    },
    order: [['updated_at', 'DESC']],
  });

  if (existingConversation) {
    return existingConversation;
  }

  return SupportConversation.create({
    customer_id: customer.id,
    customer_user_id: userId,
    status: 'open',
    subject: 'محادثة دعم',
  });
};

const getCustomerConversation = async (req, res) => {
  try {
    const customer = await findCustomerForUser(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    const conversation = await SupportConversation.findOne({
      where: {
        customer_id: customer.id,
        customer_user_id: req.user.id,
        status: { [Op.in]: ['open', 'answered'] },
      },
      order: [['updated_at', 'DESC']],
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const fullConversation = await SupportConversation.findByPk(conversation.id, {
      include: conversationInclude,
      order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: mapConversation(fullConversation),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch support conversation',
    });
  }
};

const sendCustomerMessage = async (req, res) => {
  try {
    const text = String(req.body.message || '').trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const conversation = await findOrCreateCustomerConversation(req.user.id);

    await SupportMessage.update(
      { read_at: new Date() },
      {
        where: {
          conversation_id: conversation.id,
          sender_role: 'employee',
          read_at: null,
        },
      }
    );

    await SupportMessage.create({
      conversation_id: conversation.id,
      sender_user_id: req.user.id,
      sender_role: 'customer',
      message: text,
    });

    await conversation.update({ status: 'open', employee_hidden_at: null });

    const fullConversation = await SupportConversation.findByPk(conversation.id, {
      include: conversationInclude,
      order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
    });

    const mappedConversation = mapConversation(fullConversation);

    await notifyEmployee({
      type: 'support_message_received',
      title: 'رسالة دعم جديدة من عميل',
      body: `${mappedConversation.customerName}: ${text.slice(0, 120)}`,
      entityType: 'support_conversation',
      entityId: conversation.id,
      actionUrl: '/employee/support-chats',
    });

    return res.status(201).json({
      success: true,
      data: mappedConversation,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to send support message',
    });
  }
};

const getEmployeeConversations = async (req, res) => {
  try {
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Employee access only',
      });
    }

    const conversations = await SupportConversation.findAll({
      where: {
        employee_hidden_at: null,
      },
      include: conversationInclude,
      order: [['updated_at', 'DESC']],
    });

    const mappedConversations = conversations
      .map(mapConversation)
      .filter((conversation) =>
        conversation.messages.some((message) => message.role === 'customer')
      );

    return res.status(200).json({
      success: true,
      data: mappedConversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch support conversations',
    });
  }
};

const sendEmployeeMessage = async (req, res) => {
  try {
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Employee access only',
      });
    }

    const text = String(req.body.message || '').trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const conversation = await SupportConversation.findByPk(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Support conversation not found',
      });
    }

    const employee = await Employee.findOne({ where: { user_id: req.user.id } });

    await SupportMessage.create({
      conversation_id: conversation.id,
      sender_user_id: req.user.id,
      sender_role: 'employee',
      message: text,
    });

    await conversation.update({
      status: 'answered',
      assigned_employee_id: employee?.id || conversation.assigned_employee_id,
    });

    await markEntityNotificationsAsRead({
      role: 'employee',
      entityType: 'support_conversation',
      entityId: conversation.id,
    });

    const fullConversation = await SupportConversation.findByPk(conversation.id, {
      include: conversationInclude,
      order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
    });

    return res.status(201).json({
      success: true,
      data: mapConversation(fullConversation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send employee reply',
    });
  }
};

const deleteEmployeeConversation = async (req, res) => {
  try {
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Employee access only',
      });
    }

    const conversation = await SupportConversation.findByPk(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Support conversation not found',
      });
    }

    await conversation.update({ employee_hidden_at: new Date() });

    return res.status(200).json({
      success: true,
      message: 'Support conversation hidden successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete support conversation',
    });
  }
};

const markCustomerConversationRead = async (req, res) => {
  try {
    const customer = await findCustomerForUser(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    const conversation = await SupportConversation.findOne({
      where: {
        id: req.params.id,
        customer_id: customer.id,
        customer_user_id: req.user.id,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Support conversation not found',
      });
    }

    const [updatedCount] = await SupportMessage.update(
      { read_at: new Date() },
      {
        where: {
          conversation_id: conversation.id,
          sender_role: 'employee',
          read_at: null,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark support conversation as read',
    });
  }
};

module.exports = {
  getCustomerConversation,
  sendCustomerMessage,
  markCustomerConversationRead,
  getEmployeeConversations,
  sendEmployeeMessage,
  deleteEmployeeConversation,
};
