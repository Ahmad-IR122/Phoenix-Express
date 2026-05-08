'use strict';

const { Article } = require('../models');

const createArticle = async (req, res) => {
  try {
    const { title, category, description, content, published_date } = req.body;

    const article = await Article.create({
      title,
      category,
      description,
      content,
      published_date,
    });

    return res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create article',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Articles fetched successfully',
      data: articles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      errors: [error.message],
    });
  }
};

const findArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Article fetched successfully',
      data: article,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      errors: [error.message],
    });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, content, published_date } = req.body;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    await article.update({
      title: title !== undefined ? title : article.title,
      category: category !== undefined ? category : article.category,
      description: description !== undefined ? description : article.description,
      content: content !== undefined ? content : article.content,
      published_date:
        published_date !== undefined ? published_date : article.published_date,
    });

    return res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: article,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update article',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    await article.destroy();

    return res.status(200).json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete article',
      errors: [error.message],
    });
  }
};

module.exports = {
  createArticle,
  getAllArticles,
  findArticleById,
  updateArticle,
  deleteArticle,
};
