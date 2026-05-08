'use strict';

const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', trackingController.createTracking);
router.get('/', trackingController.getAllTrackings);
router.get('/number/:trackingNumber', authenticateUser, trackingController.lookupTrackingByNumber);
router.get('/:id', trackingController.findTrackingById);
router.put('/:id', trackingController.updateTracking);
router.delete('/:id', trackingController.deleteTracking);


module.exports = router;
