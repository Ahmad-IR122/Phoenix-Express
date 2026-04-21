'use strict';

const { Vehicle, Employee } = require('../models');

const vehicleIncludes = [
  {
    model: Employee,
    as: 'employee',
  },
];

const createVehicle = async (req, res) => {
  try {
    const {
      employee_id,
      brand,
      model,
      color,
      year,
      type,
      plate_number,
      vehicle_photo_url,
    } = req.body;

    const vehicle = await Vehicle.create({
      employee_id,
      brand,
      model,
      color,
      year,
      type,
      plate_number,
      vehicle_photo_url,
    });

    const createdVehicle = await Vehicle.findByPk(vehicle.id, {
      include: vehicleIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: createdVehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create vehicle',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: vehicleIncludes,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Vehicles fetched successfully',
      data: vehicles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      errors: [error.message],
    });
  }
};

const findVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id, {
      include: vehicleIncludes,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle fetched successfully',
      data: vehicle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      errors: [error.message],
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      brand,
      model,
      color,
      year,
      type,
      plate_number,
      vehicle_photo_url,
    } = req.body;

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    await vehicle.update({
      employee_id: employee_id !== undefined ? employee_id : vehicle.employee_id,
      brand: brand !== undefined ? brand : vehicle.brand,
      model: model !== undefined ? model : vehicle.model,
      color: color !== undefined ? color : vehicle.color,
      year: year !== undefined ? year : vehicle.year,
      type: type !== undefined ? type : vehicle.type,
      plate_number:
        plate_number !== undefined ? plate_number : vehicle.plate_number,
      vehicle_photo_url:
        vehicle_photo_url !== undefined
          ? vehicle_photo_url
          : vehicle.vehicle_photo_url,
    });

    const updatedVehicle = await Vehicle.findByPk(id, {
      include: vehicleIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update vehicle',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    await vehicle.destroy();

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      errors: [error.message],
    });
  }
};

module.exports = {
  createVehicle,
  getAllVehicles,
  findVehicleById,
  updateVehicle,
  deleteVehicle,
};
