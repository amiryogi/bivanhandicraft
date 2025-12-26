/**
 * Order Controller
 * Handles HTTP requests for orders
 */
const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create order from cart
 * @route   POST /api/v1/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(req.user._id, req.body);

    res.status(201).json({
        status: 'success',
        message: 'Order placed successfully',
        data: { order },
    });
});

/**
 * @desc    Get user's orders
 * @route   GET /api/v1/orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
    const { orders, pagination } = await orderService.getUserOrders(
        req.user._id,
        req.query
    );

    res.status(200).json({
        status: 'success',
        results: orders.length,
        pagination,
        data: { orders },
    });
});

/**
 * @desc    Get order details
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrder = asyncHandler(async (req, res) => {
    // User can only see their own orders (unless admin)
    const userId = req.user.role === 'admin' ? null : req.user._id;
    const order = await orderService.getOrderById(req.params.id, userId);

    res.status(200).json({
        status: 'success',
        data: { order },
    });
});

/**
 * @desc    Cancel order
 * @route   POST /api/v1/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(
        req.params.id,
        req.user._id,
        reason || 'Cancelled by customer'
    );

    res.status(200).json({
        status: 'success',
        message: 'Order cancelled successfully',
        data: { order },
    });
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/v1/admin/orders
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
    const { orders, pagination } = await orderService.getAllOrders(req.query);

    res.status(200).json({
        status: 'success',
        results: orders.length,
        pagination,
        data: { orders },
    });
});

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/v1/admin/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    const order = await orderService.updateOrderStatus(
        req.params.id,
        status,
        req.user._id,
        note
    );

    res.status(200).json({
        status: 'success',
        message: `Order status updated to ${status}`,
        data: { order },
    });
});

module.exports = {
    createOrder,
    getMyOrders,
    getOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
};
