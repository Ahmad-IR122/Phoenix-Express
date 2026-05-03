'use strict';

const { TrackingUpdate, Shipment, Order } = require('../models');

const trackingIncludes = [
  {
    model: Shipment,
    as: 'shipment',
  },
];

const createTracking = async (req, res) => {
  try {
    const { shipment_id, status, note, current_location } = req.body;

    const tracking = await TrackingUpdate.create({
      shipment_id,
      status,
      note,
      current_location,
    });

    const createdTracking = await TrackingUpdate.findByPk(tracking.id, {
      include: trackingIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Tracking update created successfully',
      data: createdTracking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create tracking update',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllTrackings = async (req, res) => {
  try {
    const trackings = await TrackingUpdate.findAll({
      include: trackingIncludes,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Tracking updates fetched successfully',
      data: trackings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking updates',
      errors: [error.message],
    });
  }
};

const findTrackingById = async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await TrackingUpdate.findByPk(id, {
      include: trackingIncludes,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking update not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tracking update fetched successfully',
      data: tracking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking update',
      errors: [error.message],
    });
  }
};

const lookupTrackingByNumber = async (req, res) => {
  try {
    const trackingNumber = String(req.params.trackingNumber || '').trim();

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required',
      });
    }

    const shipment = await Shipment.findOne({
      where: { tracking_number: trackingNumber },
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: TrackingUpdate,
          as: 'tracking_updates',
        },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    const latestTrackingUpdate = [...(shipment.tracking_updates || [])].sort(
      (left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();

        return rightTime - leftTime || right.id - left.id;
      }
    )[0];

    const status = latestTrackingUpdate?.status || shipment.current_status || null;
    const currentLocation =
      latestTrackingUpdate?.current_location ||
      (status === 'delivered'
        ? shipment.order?.destination_city || null
        : shipment.order?.origin_city || null);

    return res.status(200).json({
      success: true,
      message: 'Shipment tracking fetched successfully',
      data: {
        tracking_number: shipment.tracking_number,
        status,
        current_location: currentLocation,
        expected_delivery_date: shipment.estimated_delivery_date,
        origin_city: shipment.order?.origin_city || null,
        destination_city: shipment.order?.destination_city || null,
        sender_name: shipment.order?.sender_name || null,
        receiver_name: shipment.order?.receiver_name || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment tracking',
      errors: [error.message],
    });
  }
};

const updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { shipment_id, status, note, current_location } = req.body;
    const tracking = await TrackingUpdate.findByPk(id);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking update not found',
      });
    }

    await tracking.update({
      shipment_id:
        shipment_id !== undefined ? shipment_id : tracking.shipment_id,
      status: status !== undefined ? status : tracking.status,
      note: note !== undefined ? note : tracking.note,
      current_location:
        current_location !== undefined
          ? current_location
          : tracking.current_location,
    });

    const updatedTracking = await TrackingUpdate.findByPk(id, {
      include: trackingIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Tracking update updated successfully',
      data: updatedTracking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update tracking update',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await TrackingUpdate.findByPk(id);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking update not found',
      });
    }

    await tracking.destroy();

    return res.status(200).json({
      success: true,
      message: 'Tracking update deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete tracking update',
      errors: [error.message],
    });
  }
};

module.exports = {
  createTracking,
  getAllTrackings,
  findTrackingById,
  lookupTrackingByNumber,
  updateTracking,
  deleteTracking,
};
