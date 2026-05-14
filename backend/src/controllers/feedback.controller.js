'use strict';

const {
  Feedback,
  Customer,
  User,
  IndividualCustomerProfile,
  CompanyCustomerProfile,
} = require('../models');
const { Op } = require('sequelize');

const feedbackIncludes = [
  {
    model: Customer,
    as: 'customer',
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'phone', 'full_name'],
      },
      {
        model: IndividualCustomerProfile,
        as: 'individual_profile',
      },
      {
        model: CompanyCustomerProfile,
        as: 'company_profile',
      },
    ],
  },
];

const normalizeRating = (value) => {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
};

const getCustomerDisplayName = (customer) =>
  customer?.individual_profile?.full_name ||
  customer?.company_profile?.company_name ||
  customer?.user?.full_name ||
  'عميل فينوكس';

const getCustomerCity = (customer) =>
  customer?.company_profile?.company_location || 'فلسطين';

const formatPublicFeedback = (feedback) => {
  const plainFeedback = typeof feedback.toJSON === 'function' ? feedback.toJSON() : feedback;

  return {
    id: plainFeedback.id,
    rating: plainFeedback.rating,
    comment: plainFeedback.comment,
    customer_location: plainFeedback.customer_location,
    is_visible: plainFeedback.is_visible,
    created_at: plainFeedback.created_at || plainFeedback.createdAt,
    customer: {
      id: plainFeedback.customer?.id,
      name: getCustomerDisplayName(plainFeedback.customer),
      city: plainFeedback.customer_location || getCustomerCity(plainFeedback.customer),
    },
  };
};

const createFeedback = async (req, res) => {
  try {
    const { customer_id, rating, comment, customer_location } = req.body;
    const normalizedRating = normalizeRating(rating);

    if (!normalizedRating) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const feedback = await Feedback.create({
      customer_id,
      rating: normalizedRating,
      customer_location: String(customer_location || '').trim() || null,
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

const createAuthenticatedFeedback = async (req, res) => {
  try {
    const rating = normalizeRating(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    const customerLocation = String(req.body.customer_location || '').trim();

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار تقييم من 1 إلى 5',
      });
    }

    const customer = await Customer.findOne({
      where: { user_id: req.user.id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    const feedback = await Feedback.create({
      customer_id: customer.id,
      rating,
      customer_location: customerLocation || null,
      comment,
    });

    const createdFeedback = await Feedback.findByPk(feedback.id, {
      include: feedbackIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: formatPublicFeedback(createdFeedback),
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

const getFeedbackSummary = async (req, res) => {
  try {
    const [total, ratingSum, satisfiedCount, recentFeedbacks] = await Promise.all([
      Feedback.count({ where: { is_visible: true } }),
      Feedback.sum('rating', { where: { is_visible: true } }),
      Feedback.count({
        where: {
          is_visible: true,
          rating: { [Op.gte]: 4 },
        },
      }),
      Feedback.findAll({
        where: { is_visible: true },
        include: feedbackIncludes,
        order: [['createdAt', 'DESC']],
        limit: 6,
      }),
    ]);

    const averageRating = total ? Number((Number(ratingSum || 0) / total).toFixed(1)) : 0;
    const satisfactionRate = total ? Math.round((satisfiedCount / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: 'Feedback summary fetched successfully',
      data: {
        reviews: recentFeedbacks.map(formatPublicFeedback),
        stats: {
          total,
          averageRating,
          satisfactionRate,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback summary',
      errors: [error.message],
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
    const { customer_id, rating, comment, customer_location, is_visible } = req.body;
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
      customer_location:
        customer_location !== undefined
          ? String(customer_location || '').trim() || null
          : feedback.customer_location,
      is_visible:
        is_visible !== undefined ? Boolean(is_visible) : feedback.is_visible,
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
  createAuthenticatedFeedback,
  getFeedbackSummary,
  getAllFeedbacks,
  findFeedbackById,
  updateFeedback,
  deleteFeedback,
};
