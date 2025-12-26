/**
 * Review Model
 * Handles product reviews with ratings
 * 
 * Features:
 * - One review per user per product
 * - Verified purchase tracking
 * - Admin moderation support
 * - Auto-updates product ratings
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    title: {
        type: String,
        maxlength: [100, 'Title cannot exceed 100 characters'],
        trim: true,
    },
    comment: {
        type: String,
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        trim: true,
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: false, // Requires admin approval
    },
    helpfulCount: {
        type: Number,
        default: 0,
    },
    // Users who found this review helpful
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
    timestamps: true,
});

// Compound index: one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ createdAt: -1 });

/**
 * Static method to calculate average rating for a product
 * Called after review is added/updated/deleted
 */
reviewSchema.statics.calculateAverageRating = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: productId, isApproved: true } },
        {
            $group: {
                _id: '$product',
                avgRating: { $avg: '$rating' },
                numRatings: { $sum: 1 },
            },
        },
    ]);

    const Product = mongoose.model('Product');

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            'ratings.average': Math.round(stats[0].avgRating * 10) / 10,
            'ratings.count': stats[0].numRatings,
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            'ratings.average': 0,
            'ratings.count': 0,
        });
    }
};

/**
 * Post-save middleware to update product ratings
 */
reviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.product);
});

/**
 * Post-remove middleware to update product ratings
 */
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
    await this.constructor.calculateAverageRating(this.product);
});

/**
 * Static method to get reviews for a product
 */
reviewSchema.statics.getProductReviews = function (productId, options = {}) {
    const { limit = 10, page = 1, sort = '-createdAt' } = options;

    return this.find({ product: productId, isApproved: true })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name avatar');
};

/**
 * Instance method to mark review as helpful
 */
reviewSchema.methods.markHelpful = async function (userId) {
    const userIdStr = userId.toString();
    const alreadyMarked = this.helpfulBy.some(id => id.toString() === userIdStr);

    if (alreadyMarked) {
        // Remove helpful mark
        this.helpfulBy = this.helpfulBy.filter(id => id.toString() !== userIdStr);
        this.helpfulCount = Math.max(0, this.helpfulCount - 1);
    } else {
        // Add helpful mark
        this.helpfulBy.push(userId);
        this.helpfulCount += 1;
    }

    await this.save();
    return this;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
