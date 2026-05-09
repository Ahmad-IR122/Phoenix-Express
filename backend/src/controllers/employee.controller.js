'use strict';

const {
  Employee,
  User,
  Vehicle,
  EmployeeDocument,
  EmployeeWallet,
  WithdrawalRequest,
} = require('../models');
const {
  getEmployeeDashboardData,
  getEmployeeOrdersData,
  getEmployeeOrderDetailsData,
  updateEmployeeOrderStatus,
  updateEmployeeShipmentLocation,
  getEmployeeProfileData,
  updateEmployeeProfileData,
  updateEmployeeVehicleData,
  createEmployeeDocumentData,
  updateEmployeeDocumentData,
  deleteEmployeeDocumentData,
  updateEmployeeAvailabilityStatus,
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
    const { user_id, full_name, address, is_active, availability_status } = req.body;

    const employee = await Employee.create({
      user_id,
      full_name,
      address,
      is_active,
      availability_status,
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
    const { user_id, full_name, address, is_active, availability_status } = req.body;
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
      availability_status:
        availability_status !== undefined
          ? availability_status
          : employee.availability_status,
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee dashboard',
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

const updateAuthenticatedEmployeeAvailabilityStatus = async (req, res) => {
  try {
    const statusData = await updateEmployeeAvailabilityStatus({
      userId: req.user.id,
      availabilityStatus: req.body.availabilityStatus,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee availability status updated successfully',
      data: statusData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee availability status',
    });
  }
};

const updateAuthenticatedEmployeeProfile = async (req, res) => {
  try {
    const profileData = await updateEmployeeProfileData({
      userId: req.user.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      data: profileData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee profile',
      errors: error.errors ? error.errors.map((err) => err.message) : undefined,
    });
  }
};

const updateAuthenticatedEmployeeVehicle = async (req, res) => {
  try {
    const profileData = await updateEmployeeVehicleData({
      userId: req.user.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee vehicle updated successfully',
      data: profileData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee vehicle',
      errors: error.errors ? error.errors.map((err) => err.message) : undefined,
    });
  }
};

const createAuthenticatedEmployeeDocument = async (req, res) => {
  try {
    const profileData = await createEmployeeDocumentData({
      userId: req.user.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee document created successfully',
      data: profileData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create employee document',
      errors: error.errors ? error.errors.map((err) => err.message) : undefined,
    });
  }
};

const updateAuthenticatedEmployeeDocument = async (req, res) => {
  try {
    const profileData = await updateEmployeeDocumentData({
      userId: req.user.id,
      documentId: Number(req.params.id),
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee document updated successfully',
      data: profileData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee document',
      errors: error.errors ? error.errors.map((err) => err.message) : undefined,
    });
  }
};

const deleteAuthenticatedEmployeeDocument = async (req, res) => {
  try {
    const profileData = await deleteEmployeeDocumentData({
      userId: req.user.id,
      documentId: Number(req.params.id),
    });

    return res.status(200).json({
      success: true,
      message: 'Employee document deleted successfully',
      data: profileData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete employee document',
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee order status',
    });
  }
};

const updateAuthenticatedEmployeeShipmentLocation = async (req, res) => {
  try {
    const updatedOrder = await updateEmployeeShipmentLocation({
      userId: req.user.id,
      shipmentId: Number(req.params.shipmentId),
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee shipment location updated successfully',
      data: updatedOrder,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update shipment location',
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
      message: 'Handover request created successfully',
      data: requestData,
      mockAuth: Boolean(req.user.isMockAuth),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create handover request',
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
  updateAuthenticatedEmployeeProfile,
  updateAuthenticatedEmployeeVehicle,
  createAuthenticatedEmployeeDocument,
  updateAuthenticatedEmployeeDocument,
  deleteAuthenticatedEmployeeDocument,
  updateAuthenticatedEmployeeAvailabilityStatus,
  getAuthenticatedEmployeeOrders,
  getAuthenticatedEmployeeOrderDetails,
  updateAuthenticatedEmployeeOrderStatus,
  updateAuthenticatedEmployeeShipmentLocation,
  getAuthenticatedEmployeeWallet,
  submitAuthenticatedEmployeeWithdrawal,
};
