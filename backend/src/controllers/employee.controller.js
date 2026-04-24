'use strict';

const {
  Employee,
  User,
  Vehicle,
  EmployeeDocument,
  EmployeeWallet,
  WithdrawalRequest,
} = require('../models');
const { getEmployeeDashboardData } = require('../services/employee-dashboard.service');
const {
  getEmployeeOrdersData,
  getEmployeeOrderDetailsData,
  updateEmployeeOrderStatus,
  getEmployeeProfileData,
  getEmployeeWalletData,
  createEmployeeWithdrawalRequest,
} = require('../services/employee-portal.service');

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

const getEmployeeDashboard = async (req, res) => {
  try {
    const dashboardData = await getEmployeeDashboardData({
      userId: req.user.id,
    });

    if (!dashboardData) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found for the authenticated user',
      });
    }

    return res.status(200).json({
      success: true,
      data: dashboardData,
      mockAuth: Boolean(req.user?.isMockAuth),
      fallbackMockAuth: Boolean(req.user?.isFallbackMockAuth),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee dashboard',
      errors: [error.message],
    });
  }
};

const getAuthenticatedEmployeeProfile = async (req, res) => {
  try {
    const profileData = await getEmployeeProfileData({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: profileData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee profile',
      errors: error.errors ? error.errors.map((err) => err.message) : undefined,
    });
  }
};

const getAuthenticatedEmployeeOrders = async (req, res) => {
  try {
    const ordersData = await getEmployeeOrdersData({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: ordersData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee orders',
    });
  }
};

const getAuthenticatedEmployeeOrderDetails = async (req, res) => {
  try {
    const orderDetails = await getEmployeeOrderDetailsData({
      userId: req.user.id,
      shipmentId: Number(req.params.shipmentId),
    });

    if (!orderDetails) {
      return res.status(404).json({
        success: false,
        message: 'Employee order not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: orderDetails,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee order details',
    });
  }
};

const updateAuthenticatedEmployeeOrderStatus = async (req, res) => {
  try {
    const updatedOrder = await updateEmployeeOrderStatus({
      userId: req.user.id,
      shipmentId: Number(req.params.shipmentId),
      status: req.body.status,
      currentLocation: req.body.currentLocation,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee order status updated successfully',
      data: updatedOrder,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    console.error('Employee order status update error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Validation errors:', error.errors);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee order status',
    });
  }
};

const getAuthenticatedEmployeeWallet = async (req, res) => {
  try {
    const walletData = await getEmployeeWalletData({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: walletData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee wallet',
    });
  }
};

const submitAuthenticatedEmployeeWithdrawal = async (req, res) => {
  try {
    const requestData = await createEmployeeWithdrawalRequest({
      userId: req.user.id,
      amount: req.body.amount,
      withdrawalMethod: req.body.withdrawalMethod,
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: requestData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create withdrawal request',
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  findEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeDashboard,
  getAuthenticatedEmployeeProfile,
  getAuthenticatedEmployeeOrders,
  getAuthenticatedEmployeeOrderDetails,
  updateAuthenticatedEmployeeOrderStatus,
  getAuthenticatedEmployeeWallet,
  submitAuthenticatedEmployeeWithdrawal,
};
