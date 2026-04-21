'use strict';

const { Feedback, Customer } = require('../models');

const feedbackIncludes = [
  {
    model: Customer,
    as: 'customer',
  },
];

const createFeedback = async (req, res) => {
  try {
    const { customer_id, rating, comment } = req.body;

    const feedback = await Feedback.create({
      customer_id,
      rating,
      comment,
    });

    const createdFeedback = await Feedback.findByPk(feedback.id, {
      include: feedbackIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: createdFeedback,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create feedback',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: feedbackIncludes,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback fetched successfully',
      data: feedbacks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      errors: [error.message],
    });
  }
};

const findFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByPk(id, {
      include: feedbackIncludes,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback fetched successfully',
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      errors: [error.message],
    });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, rating, comment } = req.body;
    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    await feedback.update({
      customer_id:
        customer_id !== undefined ? customer_id : feedback.customer_id,
      rating: rating !== undefined ? rating : feedback.rating,
      comment: comment !== undefined ? comment : feedback.comment,
    });

    const updatedFeedback = await Feedback.findByPk(id, {
      include: feedbackIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update feedback',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    await feedback.destroy();

    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      errors: [error.message],
    });
  }
};

module.exports = {
  createFeedback,
  getAllFeedbacks,
  findFeedbackById,
  updateFeedback,
  deleteFeedback,
};
