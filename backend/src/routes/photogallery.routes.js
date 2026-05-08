'use strict';

const express = require('express');
const router = express.Router();
const photoGalleryController = require('../controllers/photogallery.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.get('/', photoGalleryController.getAllPhotos);
router.post('/', authenticateAdmin, photoGalleryController.createPhoto);
router.put('/:id', authenticateAdmin, photoGalleryController.updatePhoto);
router.delete('/:id', authenticateAdmin, photoGalleryController.deletePhoto);

module.exports = router;
