'use strict';

const { Order, Customer, Region, Shipment } = require('../models');

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

const createOrder = async (req, res) => {
  try {
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

    const order = await Order.create({
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
    });

    const createdOrder = await Order.findByPk(order.id, {
      include: orderIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
    });
  } catch (error) {
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
