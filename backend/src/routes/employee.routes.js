'use strict';

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticateEmployee } = require('../middleware/auth.middleware');

router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/dashboard', authenticateEmployee, employeeController.getEmployeeDashboard);
router.get('/profile', authenticateEmployee, employeeController.getAuthenticatedEmployeeProfile);
router.patch('/profile', authenticateEmployee, employeeController.updateAuthenticatedEmployeeProfile);
router.patch('/vehicle', authenticateEmployee, employeeController.updateAuthenticatedEmployeeVehicle);
router.patch(
  '/profile/status',
  authenticateEmployee,
  employeeController.updateAuthenticatedEmployeeAvailabilityStatus
);
router.post('/documents', authenticateEmployee, employeeController.createAuthenticatedEmployeeDocument);
router.patch('/documents/:id', authenticateEmployee, employeeController.updateAuthenticatedEmployeeDocument);
router.delete('/documents/:id', authenticateEmployee, employeeController.deleteAuthenticatedEmployeeDocument);
router.get('/orders', authenticateEmployee, employeeController.getAuthenticatedEmployeeOrders);
router.patch('/orders/:shipmentId/status', authenticateEmployee, employeeController.updateAuthenticatedEmployeeOrderStatus);
router.patch('/orders/:shipmentId/location', authenticateEmployee, employeeController.updateAuthenticatedEmployeeShipmentLocation);
router.get('/orders/:shipmentId', authenticateEmployee, employeeController.getAuthenticatedEmployeeOrderDetails);
router.get('/wallet', authenticateEmployee, employeeController.getAuthenticatedEmployeeWallet);
router.post('/wallet/withdrawals', authenticateEmployee, employeeController.submitAuthenticatedEmployeeWithdrawal);
router.get('/:id', employeeController.findEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
