/**
 * Middleware Index
 * Exports all middleware from a single entry point
 */

const { protect, optionalAuth } = require('./auth');
const { restrictTo, adminOnly, ownerOrAdmin } = require('./role');
const validators = require('./validate');
const { errorHandler, notFound } = require('./errorHandler');

module.exports = {
    // Auth middleware
    protect,
    optionalAuth,

    // Role middleware
    restrictTo,
    adminOnly,
    ownerOrAdmin,

    // Validators
    ...validators,

    // Error handling
    errorHandler,
    notFound,
};
