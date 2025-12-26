/**
 * Cart Routes
 * Protected routes for cart operations
 */
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { addToCartValidator, updateCartItemValidator } = require('../middleware/validate');

// All cart routes require authentication
router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', addToCartValidator, cartController.addToCart);
router.put('/items/:itemId', updateCartItemValidator, cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
