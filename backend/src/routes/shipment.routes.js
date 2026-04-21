'use strict';

const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipment.controller');

router.post('/', shipmentController.createShipment);
router.get('/', shipmentController.getAllShipments);
router.get('/:id', shipmentController.findShipmentById);
router.put('/:id', shipmentController.updateShipment);
router.delete('/:id', shipmentController.deleteShipment);

module.exports = router;
