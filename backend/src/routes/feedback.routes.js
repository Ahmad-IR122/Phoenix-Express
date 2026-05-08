'use strict';

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticateAdmin, authenticateUser } = require('../middleware/auth.middleware');

router.post('/', feedbackController.createFeedback);
router.post('/me', authenticateUser, feedbackController.createAuthenticatedFeedback);
router.get('/summary', feedbackController.getFeedbackSummary);
router.get('/', feedbackController.getAllFeedbacks);
router.get('/:id', feedbackController.findFeedbackById);
router.put('/:id', authenticateAdmin, feedbackController.updateFeedback);
router.delete('/:id', authenticateAdmin, feedbackController.deleteFeedback);

module.exports = router;
