/**
 * Product Routes
 * Public routes for product browsing
 */
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { paginationValidator, mongoIdValidator } = require('../middleware/validate');

// Public routes
router.get('/', paginationValidator, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:slug', productController.getProduct);

module.exports = router;
