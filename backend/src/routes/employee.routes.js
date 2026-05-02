'use strict';

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { mockEmployeeAuth } = require('../middleware/auth.middleware');

router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/dashboard', mockEmployeeAuth, employeeController.getEmployeeDashboard);
router.get('/profile', mockEmployeeAuth, employeeController.getAuthenticatedEmployeeProfile);
router.patch('/profile', mockEmployeeAuth, employeeController.updateAuthenticatedEmployeeProfile);
router.patch('/vehicle', mockEmployeeAuth, employeeController.updateAuthenticatedEmployeeVehicle);
router.patch(
  '/profile/status',
  mockEmployeeAuth,
  employeeController.updateAuthenticatedEmployeeAvailabilityStatus
);
router.post('/documents', mockEmployeeAuth, employeeController.createAuthenticatedEmployeeDocument);
router.patch('/documents/:id', mockEmployeeAuth, employeeController.updateAuthenticatedEmployeeDocument);
router.delete('/documents/:id', mockEmployeeAuth, employeeController.deleteAuthenticatedEmployeeDocument);
router.get('/orders', mockEmployeeAuth, employeeController.getAuthenticatedEmployeeOrders);
router.patch('/orders/:shipmentId/status', mockEmployeeAuth, employeeController.updateAuthenticatedEmployeeOrderStatus);
router.get('/orders/:shipmentId', mockEmployeeAuth, employeeController.getAuthenticatedEmployeeOrderDetails);
router.get('/wallet', mockEmployeeAuth, employeeController.getAuthenticatedEmployeeWallet);
router.post('/wallet/withdrawals', mockEmployeeAuth, employeeController.submitAuthenticatedEmployeeWithdrawal);
router.get('/:id', employeeController.findEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
