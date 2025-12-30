/**
 * Cart Controller
 * Handles HTTP requests for shopping cart
 */
const cartService = require('../services/cartService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get user's cart
 * @route   GET /api/v1/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user._id);

    res.status(200).json({
        status: 'success',
        data: { cart },
    });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart/items
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, variantId } = req.body;
    const cart = await cartService.addToCart(
        req.user._id,
        productId,
        quantity,
        variantId
    );

    res.status(200).json({
        status: 'success',
        message: 'Item added to cart',
        data: { cart },
    });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/v1/cart/items/:itemId
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(
        req.user._id,
        req.params.itemId,
        quantity
    );

    res.status(200).json({
        status: 'success',
        message: 'Cart updated',
        data: { cart },
    });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/items/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
    const cart = await cartService.removeFromCart(
        req.user._id,
        req.params.itemId
    );

    res.status(200).json({
        status: 'success',
        message: 'Item removed from cart',
        data: { cart },
    });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
    const cart = await cartService.clearCart(req.user._id);

    res.status(200).json({
        status: 'success',
        message: 'Cart cleared',
        data: { cart },
    });
});

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};
