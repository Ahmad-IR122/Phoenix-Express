'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/', authController.createAuth);
router.get('/', authController.getAllAuths);
router.get('/:id', authController.findAuthById);
router.put('/:id', authController.updateAuth);
router.delete('/:id', authController.deleteAuth);

module.exports = router;
