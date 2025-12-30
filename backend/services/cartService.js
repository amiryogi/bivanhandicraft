/**
 * Cart Service
 * Handles shopping cart business logic
 */
const { Cart, Product } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Get user's cart with populated products
 */
const getCart = async (userId) => {
    const cart = await Cart.getOrCreate(userId);
    return cart.calculateTotal();
};

/**
 * Add item to cart
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} productId - Product ID
 * @param {Number} quantity - Quantity to add
 * @param {ObjectId|null} variantId - Variant ID (required if product has variants)
 */
const addToCart = async (userId, productId, quantity = 1, variantId = null) => {
    // Verify product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    let price;
    let variant = null;

    // If product has variants, variantId is required
    if (product.variants && product.variants.length > 0) {
        if (!variantId) {
            throw new AppError('Please select a variant (size/color)', 400);
        }
        
        variant = product.variants.id(variantId);
        if (!variant) {
            throw new AppError('Selected variant not found', 400);
        }

        // Check variant stock
        if (variant.stock < quantity) {
            throw new AppError(`Only ${variant.stock} items available for ${variant.size} - ${variant.color}`, 400);
        }

        price = variant.price;
    } else {
        // No variants - use base price and stock
        if (product.stock < quantity) {
            throw new AppError('Insufficient stock', 400);
        }
        price = product.price;
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    await cart.addItem(productId, quantity, variantId, price);

    // Return populated cart
    await cart.populate({
        path: 'items.product',
        select: 'name slug price comparePrice images stock variants isActive',
    });

    return cart.calculateTotal();
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (userId, itemId, quantity) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    const item = cart.items.id(itemId);
    if (!item) {
        throw new AppError('Item not found in cart', 404);
    }

    // Check stock availability
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
        // Remove inactive product from cart
        await cart.removeItem(itemId);
        throw new AppError('Product is no longer available', 400);
    }

    // Check stock based on variantId
    if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
            throw new AppError('Variant no longer available', 400);
        }
        if (variant.stock < quantity) {
            throw new AppError(`Only ${variant.stock} items available for ${variant.size} - ${variant.color}`, 400);
        }
    } else if (product.stock < quantity) {
        throw new AppError(`Only ${product.stock} items available`, 400);
    }

    await cart.updateItemQuantity(itemId, quantity);

    await cart.populate({
        path: 'items.product',
        select: 'name slug price comparePrice images stock variants isActive',
    });

    return cart.calculateTotal();
};


/**
 * Remove item from cart
 */
const removeFromCart = async (userId, itemId) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    await cart.removeItem(itemId);

    await cart.populate({
        path: 'items.product',
        select: 'name slug price comparePrice images stock variants isActive',
    });

    return cart.calculateTotal();
};

/**
 * Clear cart
 */
const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
        await cart.clear();
    }
    return { items: [], subtotal: 0, itemCount: 0 };
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};
