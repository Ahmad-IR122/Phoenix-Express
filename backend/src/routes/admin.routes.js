'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes working' });
});

router.post('/', adminController.createAdmin);
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/profile', authenticateAdmin, adminController.getAuthenticatedAdminProfile);
router.patch('/profile', authenticateAdmin, adminController.updateAuthenticatedAdminProfile);
router.get('/reports', authenticateAdmin, adminController.getAdminReports);
router.get('/reports/returned', authenticateAdmin, adminController.getAdminReturnedOrdersReport);
router.get('/regions', authenticateAdmin, adminController.getAdminRegions);
router.patch('/regions/:id', authenticateAdmin, adminController.updateAdminRegionPrice);
router.get('/merchants', adminController.getAdminMerchants);
router.get('/merchants/:id', adminController.getAdminMerchantById);
router.post('/merchants/:id/settlements', authenticateAdmin, adminController.settleAdminMerchant);
router.post('/delegates', adminController.createAdminDelegate);
router.patch('/merchant-settlements/:id/sent', authenticateAdmin, adminController.markMerchantSettlementAsSent);
router.get('/delegates', adminController.getAdminDelegates);
router.get('/delegates/:id', adminController.getAdminDelegateDetails);
router.put('/delegates/:id', adminController.updateAdminDelegate);
router.patch('/delegates/:id/status', adminController.updateAdminDelegateStatus);
router.get('/parcel-distribution', adminController.getParcelDistribution);
router.post('/parcel-distribution/assign', adminController.assignParcelToDriver);
router.get('/returned-shipments', adminController.getReturnedShipments);
router.post('/returned-shipments/:shipmentId/reassign', adminController.reassignReturnedShipment);
router.patch('/returned-shipments/:shipmentId/cancel', adminController.cancelReturnedShipment);
router.get('/handover-requests', adminController.getAdminHandoverRequests);
router.get('/handover-requests/:id', adminController.getAdminHandoverRequestById);
router.patch('/handover-requests/:id/status', adminController.updateAdminHandoverRequestStatus);
router.get('/', adminController.getAllAdmins);
router.get('/:id', adminController.findAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);


module.exports = router;
