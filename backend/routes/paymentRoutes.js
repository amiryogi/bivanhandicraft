/**
 * Payment Routes
 * Routes for payment operations
 */
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Public routes (for gateway callbacks)
router.get('/methods', paymentController.getPaymentMethods);
router.get('/esewa/success', paymentController.esewaSuccess);
router.get('/esewa/failure', paymentController.esewaFailure);
router.get('/khalti/callback', paymentController.khaltiCallback);

// Protected routes
router.post('/initiate', protect, paymentController.initiatePayment);
router.post('/verify', protect, paymentController.verifyPayment);

module.exports = router;
