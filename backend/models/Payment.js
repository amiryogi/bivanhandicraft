/**
 * Payment Model
 * Tracks payment transactions separately from orders
 * 
 * Features:
 * - Gateway-agnostic design
 * - Stores raw gateway responses for debugging
 * - Status tracking with timestamps
 */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gateway: {
        type: String,
        enum: ['cod', 'esewa', 'khalti', 'stripe'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'NPR',
        enum: ['NPR', 'USD'],
    },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'initiated',
    },
    // Gateway-specific response data
    gatewayResponse: {
        transactionId: String,
        referenceId: String,
        // Store full gateway response for debugging
        rawResponse: mongoose.Schema.Types.Mixed,
    },
    // Additional metadata (gateway-specific)
    metadata: mongoose.Schema.Types.Mixed,
    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,
    failureReason: String,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
}, {
    timestamps: true,
});

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gateway: 1 });
paymentSchema.index({ 'gatewayResponse.transactionId': 1 });

/**
 * Instance method to mark payment as complete
 */
paymentSchema.methods.markComplete = async function (transactionId, rawResponse = {}) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.gatewayResponse.transactionId = transactionId;
    this.gatewayResponse.rawResponse = rawResponse;
    await this.save();
    return this;
};

/**
 * Instance method to mark payment as failed
 */
paymentSchema.methods.markFailed = async function (reason, rawResponse = {}) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    this.gatewayResponse.rawResponse = rawResponse;
    await this.save();
    return this;
};

/**
 * Instance method to process refund
 */
paymentSchema.methods.processRefund = async function (amount, reason) {
    this.status = 'refunded';
    this.refundedAt = new Date();
    this.refundAmount = amount || this.amount;
    this.refundReason = reason;
    await this.save();
    return this;
};

/**
 * Static method to find by order
 */
paymentSchema.statics.findByOrder = function (orderId) {
    return this.findOne({ order: orderId }).sort({ createdAt: -1 });
};

/**
 * Static method to get payment stats
 */
paymentSchema.statics.getStats = async function (startDate, endDate) {
    const match = { status: 'completed' };

    if (startDate || endDate) {
        match.completedAt = {};
        if (startDate) match.completedAt.$gte = startDate;
        if (endDate) match.completedAt.$lte = endDate;
    }

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$gateway',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    return stats;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
