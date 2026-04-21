'use strict';

const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');

router.post('/', trackingController.createTracking);
router.get('/', trackingController.getAllTrackings);
router.get('/:id', trackingController.findTrackingById);
router.put('/:id', trackingController.updateTracking);
router.delete('/:id', trackingController.deleteTracking);

module.exports = router;
