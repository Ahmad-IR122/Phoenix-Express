'use strict';

const { Shipment, Order, Employee, TrackingUpdate } = require('../models');
const { buildLimitOption } = require('../utils/pagination');

const shipmentIncludes = [
  {
    model: Order,
    as: 'order',
  },
  {
    model: Employee,
    as: 'driver',
  },
  {
    model: TrackingUpdate,
    as: 'tracking_updates',
  },
];

const createShipment = async (req, res) => {
  try {
    const {
      order_id,
      driver_id,
      tracking_number,
      current_status,
      estimated_delivery_date,
    } = req.body;

    const shipment = await Shipment.create({
      order_id,
      driver_id,
      tracking_number,
      current_status,
      estimated_delivery_date,
    });

    const createdShipment = await Shipment.findByPk(shipment.id, {
      include: shipmentIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: createdShipment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create shipment',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.findAll({
      include: shipmentIncludes,
      order: [['id', 'DESC']],
      ...buildLimitOption(req.query.limit, 100),
    });

    return res.status(200).json({
      success: true,
      message: 'Shipments fetched successfully',
      data: shipments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shipments',
      errors: [error.message],
    });
  }
};

const findShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findByPk(id, {
      include: shipmentIncludes,
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Shipment fetched successfully',
      data: shipment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment',
      errors: [error.message],
    });
  }
};

const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      order_id,
      driver_id,
      tracking_number,
      current_status,
      estimated_delivery_date,
    } = req.body;

    const shipment = await Shipment.findByPk(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    await shipment.update({
      order_id: order_id !== undefined ? order_id : shipment.order_id,
      driver_id: driver_id !== undefined ? driver_id : shipment.driver_id,
      tracking_number:
        tracking_number !== undefined
          ? tracking_number
          : shipment.tracking_number,
      current_status:
        current_status !== undefined ? current_status : shipment.current_status,
      estimated_delivery_date:
        estimated_delivery_date !== undefined
          ? estimated_delivery_date
          : shipment.estimated_delivery_date,
    });

    const updatedShipment = await Shipment.findByPk(id, {
      include: shipmentIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Shipment updated successfully',
      data: updatedShipment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update shipment',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findByPk(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    await shipment.destroy();

    return res.status(200).json({
      success: true,
      message: 'Shipment deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete shipment',
      errors: [error.message],
    });
  }
};

module.exports = {
  createShipment,
  getAllShipments,
  findShipmentById,
  updateShipment,
  deleteShipment,
};
