'use strict';

const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.post('/', authenticateAdmin, articleController.createArticle);
router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.findArticleById);
router.put('/:id', authenticateAdmin, articleController.updateArticle);
router.delete('/:id', authenticateAdmin, articleController.deleteArticle);

module.exports = router;
