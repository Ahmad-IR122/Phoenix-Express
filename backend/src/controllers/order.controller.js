'use strict';

const {
  Order,
  Customer,
  Region,
  Shipment,
  TrackingUpdate,
  sequelize,
} = require('../models');
const { fn, col, literal, Op } = require('sequelize');
const { notifyAdmins } = require('../services/notification.service');
const { buildLimitOption } = require('../utils/pagination');

const REGION_NAME_MAP = {
  'west-bank': 'west_bank',
  west_bank: 'west_bank',
  jerusalem: 'jerusalem',
  inside: 'inside',
};

const normalizeRegionLookupValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');

const DELIVERY_SPEED_MAP = {
  normal: 'normal',
  urgent: 'urgent',
  immediate: 'express',
  express: 'express',
};

const CUSTOMER_PHONE_REGEX = /^05\d{8}$/;

const TRACKING_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REGION_LABEL_MAP = {
  west_bank: 'الضفة الغربية',
  jerusalem: 'القدس',
  inside: 'الداخل',
};

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

  const selectedRegion = normalizeRegionLookupValue(payload.selectedRegion);
  const normalizedRegionName = REGION_NAME_MAP[selectedRegion] || selectedRegion;

  if (!normalizedRegionName) {
    return null;
  }

  const region = await Region.findOne({
    where: {
      name: normalizedRegionName,
      is_active: true,
    },
    transaction,
  });

  return region?.id || null;
};

const resolveRegionPrice = async ({ regionId, transaction }) => {
  if (!regionId) {
    return 0;
  }

  const region = await Region.findByPk(regionId, {
    attributes: ['id', 'price'],
    transaction,
  });

  return region?.price !== null && region?.price !== undefined
    ? Number(region.price)
    : 0;
};

const shouldRefreshDeliveryFee = ({ existingOrder, nextRegionId }) => {
  if (!existingOrder) {
    return true;
  }

  const currentRegionId = Number(existingOrder.region_id || 0);
  const requestedRegionId = Number(nextRegionId || currentRegionId || 0);

  return currentRegionId !== requestedRegionId;
};

const resolveCustomerId = async (req, payload, transaction) => {
  if (payload.customer_id) {
    return payload.customer_id;
  }

  if (req.user?.id) {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id },
      transaction,
    });

    if (customer) {
      return customer.id;
    }
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

const getAuthenticatedCustomerOrders = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    const orders = await Order.findAll({
      where: { customer_id: customer.id },
      include: orderIncludes,
      order: [['created_at', 'DESC']],
      ...buildLimitOption(req.query.limit, 100),
    });

    return res.status(200).json({
      success: true,
      message: 'Customer orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
      errors: [error.message],
    });
  }
};

const getAuthenticatedCustomer = async (req, transaction = null) => {
  const customer = await Customer.findOne({
    where: { user_id: req.user.id },
    transaction,
  });

  return customer;
};

const isOrderEditableInCompany = (order) => {
  const shipment = order?.shipment;

  return Boolean(
    shipment &&
      shipment.current_status === 'accepted' &&
      !shipment.driver_id
  );
};

const findEditableCustomerOrder = async ({ req, orderId, transaction = null }) => {
  const customer = await getAuthenticatedCustomer(req, transaction);

  if (!customer) {
    const error = new Error('Customer profile not found');
    error.statusCode = 404;
    throw error;
  }

  const order = await Order.findOne({
    where: {
      id: orderId,
      customer_id: customer.id,
    },
    include: orderIncludes,
    transaction,
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (!isOrderEditableInCompany(order)) {
    const error = new Error('Order can only be modified while it is still at the company');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const normalizeCreatePayload = async (req, transaction) => {
  const payload = req.body || {};
  const regionId = await resolveRegionId(payload, transaction);
  const customerId = await resolveCustomerId(req, payload, transaction);
  const deliveryFee = await resolveRegionPrice({ regionId, transaction });
  const senderPhone = String(payload.sender_phone || payload.senderPhone || '').trim();
  const receiverPhone = String(payload.receiver_phone || payload.receiverPhone || '').trim();

  if (!regionId) {
    throw new Error('A valid delivery region is required');
  }

  if (!customerId) {
    throw new Error('A customer account is required before creating an order');
  }

  if (!CUSTOMER_PHONE_REGEX.test(senderPhone)) {
    const error = new Error('Sender phone must start with 05 and contain exactly 10 digits');
    error.statusCode = 400;
    throw error;
  }

  if (!CUSTOMER_PHONE_REGEX.test(receiverPhone)) {
    const error = new Error('Receiver phone must start with 05 and contain exactly 10 digits');
    error.statusCode = 400;
    throw error;
  }

  return {
    customer_id: customerId,
    region_id: regionId,
    sender_name: payload.sender_name || payload.senderName || '',
    sender_phone: senderPhone,
    sender_address: payload.sender_address || payload.senderAddress || '',
    receiver_name: payload.receiver_name || payload.receiverName || '',
    receiver_phone: receiverPhone,
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
    delivery_fee: deliveryFee,
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

    // await TrackingUpdate.create(
    //   {
    //     shipment_id: shipment.id,
    //     status: 'accepted',
    //     note: 'Order confirmed and added to the tracking system',
    //     current_location: order.origin_city || null,
    //   },
    //   { transaction }
    // );

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, {
      include: orderIncludes,
    });

    const customerName =
      createdOrder?.customer?.full_name ||
      createdOrder?.sender_name ||
      createdOrder?.customer?.email ||
      'زبون';

    await notifyAdmins({
      type: 'customer_order_created',
      title: `طلبية جديدة من ${customerName}`,
      body: `تم إنشاء طلبية جديدة برقم ${createdOrder?.id || order.id} وتحتاج إلى متابعة من الإدارة.`,
      entityType: 'order',
      entityId: createdOrder?.id || order.id,
      actionUrl: '/admin/parcel-distribution',
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
      trackingNumber,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
      ...buildLimitOption(req.query.limit, 100),
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

const getMostRequestedRegion = async (req, res) => {
  try {
    const regionOrders = await Order.findAll({
      attributes: [
        'region_id',
        [fn('COUNT', col('region_id')), 'orders_count'],
      ],
      where: {
        region_id: {
          [Op.ne]: null,
        },
      },
      group: ['region_id'],
      order: [[literal('orders_count'), 'DESC']],
      limit: 1,
      raw: true,
    });

    const topRegionOrder = regionOrders[0];
    const region = topRegionOrder
      ? await Region.findByPk(topRegionOrder.region_id)
      : null;

    return res.status(200).json({
      success: true,
      message: 'Most requested region fetched successfully',
      data: region
        ? {
            region,
            orders_count: Number(topRegionOrder.orders_count || 0),
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch most requested region',
      errors: [error.message],
    });
  }
};

const getAvailableRegions = async (req, res) => {
  try {
    const regions = await Region.findAll({
      attributes: ['id', 'name', 'label', 'price'],
      where: { is_active: true },
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Regions fetched successfully',
      data: regions.map((region) => ({
        id: region.id,
        name: region.name,
        label: region.label || REGION_LABEL_MAP[region.name] || region.name,
        price: Number(region.price || 0),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
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

    const nextRegionId = region_id !== undefined ? region_id : order.region_id;
    const shouldUpdateDeliveryFee = shouldRefreshDeliveryFee({
      existingOrder: order,
      nextRegionId,
    });
    const nextDeliveryFee = shouldUpdateDeliveryFee
      ? await resolveRegionPrice({ regionId: nextRegionId, transaction: null })
      : order.delivery_fee;

    await order.update({
      customer_id: customer_id !== undefined ? customer_id : order.customer_id,
      region_id: nextRegionId,
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
      delivery_fee: nextDeliveryFee,
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

const updateAuthenticatedCustomerOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const order = await findEditableCustomerOrder({
      req,
      orderId: id,
      transaction,
    });
    const updatePayload = await normalizeCreatePayload(req, transaction);
    const shouldUpdateDeliveryFee = shouldRefreshDeliveryFee({
      existingOrder: order,
      nextRegionId: updatePayload.region_id,
    });

    delete updatePayload.customer_id;
    delete updatePayload.status;
    delete updatePayload.delivered_at;

    if (!shouldUpdateDeliveryFee) {
      updatePayload.delivery_fee = order.delivery_fee;
    }

    await order.update(updatePayload, { transaction });
    await transaction.commit();

    const updatedOrder = await Order.findByPk(id, {
      include: orderIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to update order',
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

const deleteAuthenticatedCustomerOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const order = await findEditableCustomerOrder({
      req,
      orderId: id,
      transaction,
    });

    const shipment = order.shipment;

    if (shipment) {
      await TrackingUpdate.destroy({
        where: { shipment_id: shipment.id },
        transaction,
      });
      await shipment.destroy({ transaction });
    }

    await order.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete order',
      errors: [error.message],
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getAvailableRegions,
  getMostRequestedRegion,
  getAuthenticatedCustomerOrders,
  updateAuthenticatedCustomerOrder,
  deleteAuthenticatedCustomerOrder,
  findOrderById,
  updateOrder,
  deleteOrder,
};
