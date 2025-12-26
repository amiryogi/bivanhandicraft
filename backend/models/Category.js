/**
 * Category Model
 * Handles product categories with parent-child relationships
 * 
 * Features:
 * - Self-referencing for nested categories
 * - Auto-generated slugs
 * - Virtual subcategories population
 */
const mongoose = require('mongoose');
const { createSlug } = require('../utils/helpers');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
        url: String,
        publicId: String, // Cloudinary public ID
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null, // null = root category
    },
    order: {
        type: Number,
        default: 0, // For custom ordering
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

/**
 * Virtual for subcategories
 * Allows populating child categories
 */
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent',
});

/**
 * Pre-save middleware to generate slug
 */
categorySchema.pre('save', async function () {
    if (this.isModified('name')) {
        this.slug = createSlug(this.name);
    }
});

/**
 * Pre-remove middleware to handle cascading
 * Sets children's parent to null (orphan) instead of deleting
 */
categorySchema.pre('deleteOne', { document: true }, async function () {
    await this.model('Category').updateMany(
        { parent: this._id },
        { parent: null }
    );
});

/**
 * Static method to get category tree
 * Returns all root categories with populated subcategories
 */
categorySchema.statics.getTree = async function () {
    return this.find({ parent: null, isActive: true })
        .sort({ order: 1 })
        .populate({
            path: 'subcategories',
            match: { isActive: true },
            options: { sort: { order: 1 } },
        });
};

/**
 * Static method to find by slug with subcategories
 */
categorySchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug, isActive: true })
        .populate({
            path: 'subcategories',
            match: { isActive: true },
        })
        .populate('parent', 'name slug');
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
