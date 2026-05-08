'use strict';

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', customerController.createCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/profile/me', authenticateUser, customerController.getAuthenticatedCustomerProfile);
router.patch('/profile/me', authenticateUser, customerController.updateAuthenticatedCustomerProfile);
router.get('/settlements/me', authenticateUser, customerController.getAuthenticatedCustomerSettlements);
router.post('/settlements/me/request', authenticateUser, customerController.requestAuthenticatedCustomerSettlement);
router.patch('/settlements/me/:id/confirm', authenticateUser, customerController.confirmAuthenticatedCustomerSettlement);
router.get('/:id', customerController.findCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
