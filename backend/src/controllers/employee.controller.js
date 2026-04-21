'use strict';

const {
  Employee,
  User,
  Vehicle,
  EmployeeDocument,
  EmployeeWallet,
  WithdrawalRequest,
} = require('../models');

const employeeIncludes = [
  {
    model: User,
    as: 'user',
    attributes: { exclude: ['password'] },
  },
  {
    model: Vehicle,
    as: 'vehicle',
  },
  {
    model: EmployeeDocument,
    as: 'documents',
  },
  {
    model: EmployeeWallet,
    as: 'wallet',
  },
  {
    model: WithdrawalRequest,
    as: 'withdrawal_requests',
  },
];

const createEmployee = async (req, res) => {
  try {
    const { user_id, full_name, address, is_active } = req.body;

    const employee = await Employee.create({
      user_id,
      full_name,
      address,
      is_active,
    });

    const createdEmployee = await Employee.findByPk(employee.id, {
      include: employeeIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: createdEmployee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create employee',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: employeeIncludes,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Employees fetched successfully',
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      errors: [error.message],
    });
  }
};

const findEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: employeeIncludes,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee fetched successfully',
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      errors: [error.message],
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, full_name, address, is_active } = req.body;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    await employee.update({
      user_id: user_id !== undefined ? user_id : employee.user_id,
      full_name: full_name !== undefined ? full_name : employee.full_name,
      address: address !== undefined ? address : employee.address,
      is_active: is_active !== undefined ? is_active : employee.is_active,
    });

    const updatedEmployee = await Employee.findByPk(id, {
      include: employeeIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update employee',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    await employee.destroy();

    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      errors: [error.message],
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  findEmployeeById,
  updateEmployee,
  deleteEmployee,
};
