/**
 * Order Routes
 * Protected routes for order management
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { createOrderValidator, paginationValidator, mongoIdValidator } = require('../middleware/validate');

// All order routes require authentication
router.use(protect);

router.post('/', createOrderValidator, orderController.createOrder);
router.get('/', paginationValidator, orderController.getMyOrders);
router.get('/:id', mongoIdValidator('id'), orderController.getOrder);
router.post('/:id/cancel', mongoIdValidator('id'), orderController.cancelOrder);

module.exports = router;
