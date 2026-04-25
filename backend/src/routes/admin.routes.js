'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes working' });
});

router.post('/', adminController.createAdmin);
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/parcel-distribution', adminController.getParcelDistribution);
router.post('/parcel-distribution/assign', adminController.assignParcelToDriver);
router.get('/', adminController.getAllAdmins);
router.get('/:id', adminController.findAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);


module.exports = router;
