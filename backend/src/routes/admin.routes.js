'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');


router.post('/', adminController.createAdmin);
router.get('/', adminController.getAllAdmins);
router.get('/:id', adminController.findAdminById);
router.put('/:id', adminController.updateAdmin);


module.exports = router;