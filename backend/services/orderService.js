/**
 * Order Service
 * Handles order business logic
 */
const { Order, Cart, Product } = require('../models');
const { PaymentService } = require('./payment');
const { paginate } = require('../utils/helpers');
const AppError = require('../utils/AppError');

/**
 * Create order from cart
 */
const createOrder = async (userId, orderData) => {
    const { shippingAddress, paymentMethod, customerNotes } = orderData;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        select: 'name slug price images stock variants isActive',
    });

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Validate products and build order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
        const product = item.product;

        if (!product || !product.isActive) {
            throw new AppError(`Product "${item.product?.name || 'Unknown'}" is no longer available`, 400);
        }

        // Calculate item price with variants
        let itemPrice = product.price;
        const variantDetails = [];

        if (item.selectedVariants && item.selectedVariants.length > 0) {
            for (const sv of item.selectedVariants) {
                itemPrice += sv.priceModifier || 0;
                variantDetails.push({
                    name: sv.variantName,
                    value: sv.optionValue,
                });

                // Check variant stock
                const variant = product.variants.id(sv.variantId);
                const option = variant ? variant.options.id(sv.optionId) : null;
                if (!option || option.stock < item.quantity) {
                    throw new AppError(`Insufficient stock for ${product.name} (${sv.variantName}: ${sv.optionValue})`, 400);
                }
            }
        } else {
            // Check base stock
            if (product.stock < item.quantity) {
                throw new AppError(`Insufficient stock for ${product.name}`, 400);
            }
        }

        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            product: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images[0]?.url,
            price: itemPrice,
            quantity: item.quantity,
            selectedVariants: variantDetails,
            subtotal: itemSubtotal,
        });
    }

    // Calculate totals
    const shippingCost = calculateShippingCost(shippingAddress, subtotal);
    const discount = 0; // Implement coupon logic here
    const tax = 0; // Nepal doesn't have sales tax for most products
    const total = subtotal + shippingCost - discount + tax;

    // Create order
    const order = await Order.create({
        user: userId,
        items: orderItems,
        shippingAddress,
        payment: {
            method: paymentMethod,
            status: 'pending',
        },
        pricing: {
            subtotal,
            shippingCost,
            discount,
            tax,
            total,
        },
        customerNotes,
        statusHistory: [{
            status: 'pending',
            note: 'Order placed',
        }],
    });

    // Reduce stock
    for (const item of cart.items) {
        const product = await Product.findById(item.product._id || item.product);
        if (product) {
            const stockUpdates = item.selectedVariants?.map(sv => ({
                variantId: sv.variantId,
                optionId: sv.optionId,
                quantity: item.quantity,
            })) || [{ quantity: item.quantity }];

            await product.reduceStock(stockUpdates);
        }
    }

    // Clear cart only for COD (immediate checkout)
    // For online payments, cart is cleared after successful payment callback
    if (paymentMethod === 'cod') {
        await cart.clear();
    }

    return order;
};

/**
 * Calculate shipping cost based on location
 */
const calculateShippingCost = (address, subtotal) => {
    // Free shipping for orders over NPR 5000
    if (subtotal >= 5000) return 0;

    // Kathmandu Valley (provinces 3): NPR 100
    if (address.province === 3 && ['Kathmandu', 'Lalitpur', 'Bhaktapur'].includes(address.district)) {
        return 100;
    }

    // Other areas: NPR 150-300 based on province
    const shippingRates = {
        1: 250, // Province 1 (Eastern)
        2: 250, // Madhesh
        3: 150, // Bagmati
        4: 200, // Gandaki
        5: 250, // Lumbini
        6: 300, // Karnali
        7: 300, // Sudurpashchim
    };

    return shippingRates[address.province] || 200;
};

/**
 * Get user's orders
 */
const getUserOrders = async (userId, options = {}) => {
    const { page = 1, limit = 10, status } = options;

    const filter = { user: userId };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const pagination = paginate(page, limit, total);

    const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.itemsPerPage)
        .select('-statusHistory');

    return { orders, pagination };
};

/**
 * Get order details
 */
const getOrderById = async (orderId, userId = null) => {
    const filter = { _id: orderId };
    if (userId) filter.user = userId; // Ensure user owns the order

    const order = await Order.findOne(filter).populate('user', 'name email phone');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    return order;
};

/**
 * Cancel order
 */
const cancelOrder = async (orderId, userId, reason) => {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (!order.canBeCancelled) {
        throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    await order.updateOrderStatus('cancelled', userId, reason);

    // Restore stock
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            // Increase stock back
            if (item.selectedVariants && item.selectedVariants.length > 0) {
                for (const sv of item.selectedVariants) {
                    const variant = product.variants.find(v => v.name === sv.name);
                    if (variant) {
                        const option = variant.options.find(o => o.value === sv.value);
                        if (option) {
                            option.stock += item.quantity;
                        }
                    }
                }
            } else {
                product.stock += item.quantity;
            }
            product.soldCount -= item.quantity;
            await product.save();
        }
    }

    return order;
};

/**
 * Get all orders (Admin)
 */
const getAllOrders = async (options = {}) => {
    const { page = 1, limit = 20, status, paymentStatus } = options;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;

    const total = await Order.countDocuments(filter);
    const pagination = paginate(page, limit, total);

    const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.itemsPerPage)
        .populate('user', 'name email phone');

    return { orders, pagination };
};

/**
 * Update order status (Admin)
 */
const updateOrderStatus = async (orderId, status, adminId, note) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    await order.updateOrderStatus(status, adminId, note);
    return order;
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
};
