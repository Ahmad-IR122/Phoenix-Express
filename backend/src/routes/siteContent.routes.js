'use strict';

const express = require('express');
const router = express.Router();
const siteContentController = require('../controllers/siteContent.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.get('/:pageKey', siteContentController.getSiteContent);
router.put('/:pageKey', authenticateAdmin, siteContentController.upsertSiteContent);

module.exports = router;
