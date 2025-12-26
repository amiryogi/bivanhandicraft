/**
 * Category Routes
 * Public routes for category browsing
 */
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/all', categoryController.getAllCategoriesFlat);
router.get('/:slug', categoryController.getCategory);

module.exports = router;
