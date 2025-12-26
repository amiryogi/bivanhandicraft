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
 */
const addToCart = async (userId, productId, quantity = 1, selectedVariants = []) => {
    // Verify product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Calculate price with variant modifiers
    let price = product.price;
    const processedVariants = [];

    if (selectedVariants && selectedVariants.length > 0) {
        for (const sv of selectedVariants) {
            const variant = product.variants.find(v => v.name === sv.variantName);
            if (!variant) {
                throw new AppError(`Variant ${sv.variantName} not found`, 400);
            }

            const option = variant.options.find(o => o.value === sv.optionValue);
            if (!option) {
                throw new AppError(`Option ${sv.optionValue} not found for ${sv.variantName}`, 400);
            }

            // Check stock for variant
            if (option.stock < quantity) {
                throw new AppError(`Insufficient stock for ${sv.variantName}: ${sv.optionValue}`, 400);
            }

            price += option.priceModifier || 0;
            processedVariants.push({
                variantName: sv.variantName,
                optionValue: sv.optionValue,
                variantId: variant._id,
                optionId: option._id,
                priceModifier: option.priceModifier || 0,
            });
        }
    } else {
        // Check base stock if no variants
        if (product.stock < quantity) {
            throw new AppError('Insufficient stock', 400);
        }
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    await cart.addItem(productId, quantity, processedVariants, price);

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

    // Check stock
    if (item.selectedVariants && item.selectedVariants.length > 0) {
        for (const sv of item.selectedVariants) {
            const variant = product.variants.id(sv.variantId);
            const option = variant?.options.id(sv.optionId);
            if (option && option.stock < quantity) {
                throw new AppError(`Only ${option.stock} items available for ${sv.variantName}: ${sv.optionValue}`, 400);
            }
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
