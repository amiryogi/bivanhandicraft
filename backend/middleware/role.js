/**
 * Role-based Access Control Middleware
 * Restricts access based on user roles
 */
const AppError = require('../utils/AppError');

/**
 * Restrict access to specific roles
 * Must be used after protect middleware
 * 
 * Usage:
 *   router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);
 *   router.get('/orders', protect, restrictTo('admin', 'customer'), getOrders);
 * 
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // protect middleware must run first
        if (!req.user) {
            return next(new AppError('Not authenticated.', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }

        next();
    };
};

/**
 * Restrict to admin only
 * Convenience wrapper for restrictTo('admin')
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Not authenticated.', 401));
    }

    if (req.user.role !== 'admin') {
        return next(new AppError('Admin access required.', 403));
    }

    next();
};

/**
 * Check if user owns the resource or is admin
 * Useful for routes where users can only access their own data
 * 
 * Usage:
 *   router.put('/users/:id', protect, ownerOrAdmin('id'), updateUser);
 * 
 * @param {string} paramName - Request param containing user ID to check
 */
const ownerOrAdmin = (paramName = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Not authenticated.', 401));
        }

        const resourceUserId = req.params[paramName];
        const isOwner = req.user._id.toString() === resourceUserId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return next(new AppError('You can only access your own resources.', 403));
        }

        req.isOwner = isOwner;
        req.isAdmin = isAdmin;
        next();
    };
};

module.exports = { restrictTo, adminOnly, ownerOrAdmin };
