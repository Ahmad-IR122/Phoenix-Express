'use strict';

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', authenticateUser, orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/me', authenticateUser, orderController.getAuthenticatedCustomerOrders);
router.put('/me/:id', authenticateUser, orderController.updateAuthenticatedCustomerOrder);
router.delete('/me/:id', authenticateUser, orderController.deleteAuthenticatedCustomerOrder);
router.get('/stats/most-requested-region', orderController.getMostRequestedRegion);
router.get('/:id', orderController.findOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
