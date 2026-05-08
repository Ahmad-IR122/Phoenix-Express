'use strict';

const { PhotoGallery } = require('../models');

const normalizeGalleryPayload = (body = {}) => ({
  name: String(body.name || '').trim(),
  image_url: String(body.image_url || body.imageUrl || '').trim(),
  description: String(body.description || '').trim() || null,
  display_order: Number.isFinite(Number(body.display_order))
    ? Number(body.display_order)
    : 0,
  is_visible: body.is_visible === undefined ? true : Boolean(body.is_visible),
});

const getAllPhotos = async (req, res) => {
  try {
    const where = req.query.includeHidden === 'true' ? {} : { is_visible: true };
    const photos = await PhotoGallery.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Photos fetched successfully',
      data: photos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch photos',
      errors: [error.message],
    });
  }
};

const createPhoto = async (req, res) => {
  try {
    const payload = normalizeGalleryPayload(req.body);

    if (!payload.name || !payload.image_url) {
      return res.status(400).json({
        success: false,
        message: 'Photo title and image URL are required',
      });
    }

    const photo = await PhotoGallery.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Photo created successfully',
      data: photo,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create photo',
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

const updatePhoto = async (req, res) => {
  try {
    const photo = await PhotoGallery.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    const payload = normalizeGalleryPayload({
      name: req.body.name !== undefined ? req.body.name : photo.name,
      image_url: req.body.image_url !== undefined ? req.body.image_url : photo.image_url,
      description: req.body.description !== undefined ? req.body.description : photo.description,
      display_order:
        req.body.display_order !== undefined ? req.body.display_order : photo.display_order,
      is_visible: req.body.is_visible !== undefined ? req.body.is_visible : photo.is_visible,
    });

    if (!payload.name || !payload.image_url) {
      return res.status(400).json({
        success: false,
        message: 'Photo title and image URL are required',
      });
    }

    await photo.update(payload);

    return res.status(200).json({
      success: true,
      message: 'Photo updated successfully',
      data: photo,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update photo',
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const photo = await PhotoGallery.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    await photo.destroy();

    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      errors: [error.message],
    });
  }
};

module.exports = {
  getAllPhotos,
  createPhoto,
  updatePhoto,
  deletePhoto,
};
