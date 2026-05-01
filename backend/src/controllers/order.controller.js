'use strict';

const {
  Order,
  Customer,
  Region,
  Shipment,
  TrackingUpdate,
  sequelize,
} = require('../models');

const REGION_NAME_MAP = {
  'west-bank': 'west_bank',
  west_bank: 'west_bank',
  jerusalem: 'jerusalem',
  inside: 'inside',
};

const DELIVERY_SPEED_MAP = {
  normal: 'normal',
  urgent: 'urgent',
  immediate: 'express',
  express: 'express',
};

const TRACKING_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const orderIncludes = [
  {
    model: Customer,
    as: 'customer',
  },
  {
    model: Region,
    as: 'region',
  },
  {
    model: Shipment,
    as: 'shipment',
  },
];

const buildTrackingNumber = (length = 10) => {
  let result = '';

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * TRACKING_CHARSET.length);
    result += TRACKING_CHARSET[randomIndex];
  }

  return result;
};

const generateUniqueTrackingNumber = async (transaction) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const trackingNumber = buildTrackingNumber(10);
    const existingShipment = await Shipment.findOne({
      where: { tracking_number: trackingNumber },
      transaction,
    });

    if (!existingShipment) {
      return trackingNumber;
    }
  }

  throw new Error('Failed to generate a unique tracking number');
};

const resolveRegionId = async (payload, transaction) => {
  if (payload.region_id) {
    return payload.region_id;
  }

  const normalizedRegionName = REGION_NAME_MAP[payload.selectedRegion];

  if (!normalizedRegionName) {
    return null;
  }

  const region = await Region.findOne({
    where: { name: normalizedRegionName },
    transaction,
  });

  return region?.id || null;
};

const resolveCustomerId = async (req, payload, transaction) => {
  if (payload.customer_id) {
    return payload.customer_id;
  }

  const requestedUserId = Number(req.headers['x-user-id']);

  if (Number.isInteger(requestedUserId) && requestedUserId > 0) {
    const customer = await Customer.findOne({
      where: { user_id: requestedUserId },
      transaction,
    });

    if (customer) {
      return customer.id;
    }
  }

  const fallbackCustomer = await Customer.findOne({
    order: [['id', 'ASC']],
    transaction,
  });

  return fallbackCustomer?.id || null;
};

const normalizeCreatePayload = async (req, transaction) => {
  const payload = req.body || {};
  const regionId = await resolveRegionId(payload, transaction);
  const customerId = await resolveCustomerId(req, payload, transaction);

  if (!regionId) {
    throw new Error('A valid delivery region is required');
  }

  if (!customerId) {
    throw new Error('A customer account is required before creating an order');
  }

  return {
    customer_id: customerId,
    region_id: regionId,
    sender_name: payload.sender_name || payload.senderName || '',
    sender_phone: payload.sender_phone || payload.senderPhone || '',
    sender_address: payload.sender_address || payload.senderAddress || '',
    receiver_name: payload.receiver_name || payload.receiverName || '',
    receiver_phone: payload.receiver_phone || payload.receiverPhone || '',
    receiver_address: payload.receiver_address || payload.receiverAddress || '',
    origin_city: payload.origin_city || payload.originalCity || '',
    destination_city: payload.destination_city || payload.destinationCity || '',
    package_size: payload.package_size || payload.orderSize || 'small',
    delivery_speed:
      DELIVERY_SPEED_MAP[payload.delivery_speed || payload.orderStatus] || 'normal',
    is_fragile:
      payload.is_fragile !== undefined
        ? Boolean(payload.is_fragile)
        : Boolean(payload.isFragile),
    declared_value:
      payload.declared_value !== undefined
        ? payload.declared_value
        : payload.orderPrice !== ''
          ? payload.orderPrice
          : null,
    package_description:
      payload.package_description || payload.orderDescription || null,
    status: payload.status || 'pending',
    delivered_at: payload.delivered_at || null,
  };
};

const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const orderPayload = await normalizeCreatePayload(req, transaction);

    const order = await Order.create(orderPayload, { transaction });
    const trackingNumber = await generateUniqueTrackingNumber(transaction);

    const shipment = await Shipment.create(
      {
        order_id: order.id,
        tracking_number: trackingNumber,
        current_status: 'accepted',
      },
      { transaction }
    );

    await TrackingUpdate.create(
      {
        shipment_id: shipment.id,
        status: 'accepted',
        note: 'Order confirmed and added to the tracking system',
        current_location: order.origin_city || null,
      },
      { transaction }
    );

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, {
      include: orderIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
      trackingNumber,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(400).json({
      success: false,
      message: 'Failed to create order',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: orderIncludes,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      errors: [error.message],
    });
  }
};

const findOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: orderIncludes,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order fetched successfully',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      errors: [error.message],
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_id,
      region_id,
      sender_name,
      sender_phone,
      sender_address,
      receiver_name,
      receiver_phone,
      receiver_address,
      origin_city,
      destination_city,
      package_size,
      delivery_speed,
      is_fragile,
      declared_value,
      package_description,
      status,
      delivered_at,
    } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await order.update({
      customer_id: customer_id !== undefined ? customer_id : order.customer_id,
      region_id: region_id !== undefined ? region_id : order.region_id,
      sender_name: sender_name !== undefined ? sender_name : order.sender_name,
      sender_phone:
        sender_phone !== undefined ? sender_phone : order.sender_phone,
      sender_address:
        sender_address !== undefined ? sender_address : order.sender_address,
      receiver_name:
        receiver_name !== undefined ? receiver_name : order.receiver_name,
      receiver_phone:
        receiver_phone !== undefined ? receiver_phone : order.receiver_phone,
      receiver_address:
        receiver_address !== undefined
          ? receiver_address
          : order.receiver_address,
      origin_city: origin_city !== undefined ? origin_city : order.origin_city,
      destination_city:
        destination_city !== undefined
          ? destination_city
          : order.destination_city,
      package_size:
        package_size !== undefined ? package_size : order.package_size,
      delivery_speed:
        delivery_speed !== undefined ? delivery_speed : order.delivery_speed,
      is_fragile: is_fragile !== undefined ? is_fragile : order.is_fragile,
      declared_value:
        declared_value !== undefined ? declared_value : order.declared_value,
      package_description:
        package_description !== undefined
          ? package_description
          : order.package_description,
      status: status !== undefined ? status : order.status,
      delivered_at:
        delivered_at !== undefined ? delivered_at : order.delivered_at,
    });

    const updatedOrder = await Order.findByPk(id, {
      include: orderIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update order',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await order.destroy();

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      errors: [error.message],
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  findOrderById,
  updateOrder,
  deleteOrder,
};
