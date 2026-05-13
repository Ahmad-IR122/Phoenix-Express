'use strict';

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth.middleware');
const supportChatController = require('../controllers/supportChat.controller');

router.get('/customer/conversation', authenticateUser, supportChatController.getCustomerConversation);
router.post('/customer/messages', authenticateUser, supportChatController.sendCustomerMessage);
router.patch('/customer/conversations/:id/read', authenticateUser, supportChatController.markCustomerConversationRead);
router.get('/employee/conversations', authenticateUser, supportChatController.getEmployeeConversations);
router.post('/employee/conversations/:id/messages', authenticateUser, supportChatController.sendEmployeeMessage);
router.delete('/employee/conversations/:id', authenticateUser, supportChatController.deleteEmployeeConversation);

module.exports = router;
