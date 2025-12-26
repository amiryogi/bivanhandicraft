/**
 * Authentication Middleware
 * Verifies JWT access tokens and attaches user to request
 */
const { verifyAccessToken } = require('../utils/tokenUtils');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - require valid access token
 * Attaches req.user with user data
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized. Please log in.', 401));
    }

    try {
        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from token
        const user = await User.findById(decoded.userId).select('+passwordChangedAt');

        if (!user) {
            return next(new AppError('User no longer exists.', 401));
        }

        // Check if user is active
        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated.', 401));
        }

        // Check if user changed password after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('Password recently changed. Please log in again.', 401));
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired. Please refresh your token.', 401));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again.', 401));
        }
        return next(new AppError('Authentication failed.', 401));
    }
});

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for logged-in users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(); // Continue without user
    }

    try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (user && user.isActive) {
            req.user = user;
        }
    } catch (error) {
        // Ignore token errors for optional auth
    }

    next();
});

module.exports = { protect, optionalAuth };
