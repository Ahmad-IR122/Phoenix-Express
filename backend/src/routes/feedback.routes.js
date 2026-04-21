'use strict';

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');

router.post('/', feedbackController.createFeedback);
router.get('/', feedbackController.getAllFeedbacks);
router.get('/:id', feedbackController.findFeedbackById);
router.put('/:id', feedbackController.updateFeedback);
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
