/**
 * Order Model
 * Handles orders with status lifecycle and payment tracking
 * 
 * Features:
 * - Unique order number generation
 * - Price snapshots (products may change)
 * - Status history audit trail
 * - Nepali address format
 */
const mongoose = require('mongoose');
const { generateOrderNumber } = require('../utils/helpers');

// Order item schema (snapshot of product at order time)
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    // Variant reference (for stock deduction)
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    // Snapshots (product/variant data may change later)
    name: {
        type: String,
        required: true,
    },
    slug: String,
    image: String,
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    // Flat variant snapshot
    variant: {
        size: String,
        color: String,
    },
    subtotal: {
        type: Number,
        required: true,
    },
}, { _id: true });


// Shipping address schema (Nepal format)
const shippingAddressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    province: {
        type: Number,
        required: true,
        min: 1,
        max: 7,
    },
    landmark: String,
}, { _id: false });

// Status history for audit trail
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
    },
    changedAt: {
        type: Date,
        default: Date.now,
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    note: String,
}, { _id: true });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        default: generateOrderNumber,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: {
        type: [orderItemSchema],
        validate: {
            validator: function (v) {
                return v.length > 0;
            },
            message: 'Order must have at least one item',
        },
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true,
    },
    payment: {
        method: {
            type: String,
            enum: ['cod', 'esewa', 'khalti', 'stripe'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        transactionId: String,
        paidAt: Date,
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true,
        },
        shippingCost: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    statusHistory: [statusHistorySchema],
    notes: String,
    customerNotes: String, // Notes from customer at checkout
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

/**
 * Virtual to check if order can be cancelled
 * Only pending or confirmed orders can be cancelled
 */
orderSchema.virtual('canBeCancelled').get(function () {
    return ['pending', 'confirmed'].includes(this.status);
});

// /**
//  * Pre-save logic moved to schema default
//  */
// // orderSchema.pre('save', function (next) {
// //     if (this.isNew && !this.orderNumber) {
// //         this.orderNumber = generateOrderNumber();
// //     }
// //     next();
// // });

/**
 * Instance method to update order status
 * @param {string} newStatus - New status
 * @param {string} userId - User making the change
 * @param {string} note - Optional note
 */
orderSchema.methods.updateOrderStatus = async function (newStatus, userId, note = '') {
    const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [], // Final state
        cancelled: [], // Final state
    };

    if (!validTransitions[this.status].includes(newStatus)) {
        throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        changedBy: userId,
        note,
    });

    if (newStatus === 'delivered') {
        this.deliveredAt = new Date();
        if (this.payment.method === 'cod') {
            this.payment.status = 'paid';
            this.payment.paidAt = new Date();
        }
    }

    if (newStatus === 'cancelled') {
        this.cancelledAt = new Date();
        this.cancellationReason = note;
    }

    await this.save();
    return this;
};

/**
 * Instance method to mark payment as complete
 */
orderSchema.methods.markPaymentComplete = async function (transactionId) {
    this.payment.status = 'paid';
    this.payment.paidAt = new Date();
    this.payment.transactionId = transactionId;

    // Auto-confirm order after successful payment
    if (this.status === 'pending') {
        this.status = 'confirmed';
        this.statusHistory.push({
            status: 'confirmed',
            note: 'Auto-confirmed after payment',
        });
    }

    await this.save();
    return this;
};

/**
 * Static method to calculate dashboard stats
 */
orderSchema.statics.getDashboardStats = async function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, pendingOrders, revenue] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ createdAt: { $gte: today } }),
        this.countDocuments({ status: 'pending' }),
        this.aggregate([
            { $match: { 'payment.status': 'paid' } },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } },
        ]),
    ]);

    return {
        totalOrders,
        todayOrders,
        pendingOrders,
        totalRevenue: revenue[0]?.total || 0,
    };
};

/**
 * Static method to get orders by user
 */
orderSchema.statics.getUserOrders = function (userId, options = {}) {
    const { limit = 10, page = 1, status } = options;

    const query = { user: userId };
    if (status) query.status = status;

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-statusHistory');
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
