'use strict';

const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { authenticateUser, mockEmployeeAuth } = require('../middleware/auth.middleware');

router.post('/subscribe', authenticateUser, newsletterController.subscribe);
router.get('/employee', mockEmployeeAuth, newsletterController.getEmployeeNewsletter);
router.get('/employee/status', mockEmployeeAuth, newsletterController.getNewsletterStatus);
router.get('/employee/send-status/:jobId', mockEmployeeAuth, newsletterController.getNewsletterSendStatus);
router.post('/employee/send', mockEmployeeAuth, newsletterController.sendNewsletter);
router.delete('/employee/subscribers/:subscriberId', mockEmployeeAuth, newsletterController.deleteNewsletterSubscriber);

module.exports = router;
