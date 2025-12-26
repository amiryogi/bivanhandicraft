/**
 * Auth Routes
 * Routes for authentication endpoints
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validate');

// Public routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(protect); // All routes below require authentication
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/change-password', authController.changePassword);

module.exports = router;
