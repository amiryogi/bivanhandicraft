/**
 * Product Model
 * Handles products with variants, stock management, and ratings
 * 
 * Features:
 * - Multiple images with Cloudinary
 * - Flat variants (size + color combination) with individual price/stock/image
 * - Stock tracking per variant
 * - Text search index for product search
 * - Rating aggregation
 */
const mongoose = require('mongoose');
const { createSlug } = require('../utils/helpers');

// Fixed size options (MUST be enforced)
const VALID_SIZES = [
    'Small Size (0-1 yrs)',
    'Medium Size (1-4 yrs)',
    'Large Size (4-6 yrs)',
    'XL Size (6-8 yrs)',
    'XXL Size (8-10 yrs)',
    'Standard Size',
    'One Size',
];

// Flat variant schema: each variant is a unique size+color combination
const variantSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
        enum: {
            values: VALID_SIZES,
            message: 'Invalid size. Must be one of: ' + VALID_SIZES.join(', ')
        },
    },
    color: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Variant price is required'],
        min: [0, 'Price cannot be negative'],
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative'],
    },
    image: {
        type: String, // URL of the variant image
        default: null,
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
    },
}, { _id: true });

// Image schema (for product gallery, separate from variant images)
const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    publicId: {
        type: String, // Cloudinary public ID
    },
    alt: String,
    isPrimary: {
        type: Boolean,
        default: false,
    },
}, { _id: true });


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
        type: String,
        maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
        type: Number, // Original price for showing discounts
        min: [0, 'Compare price cannot be negative'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required'],
    },
    images: [imageSchema],
    variants: [variantSchema],
    // Base stock (used when no variants)
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative'],
    },
    sku: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple nulls
        uppercase: true,
        trim: true,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Aggregated ratings (updated when reviews change)
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        count: {
            type: Number,
            default: 0,
        },
    },
    // SEO
    metaTitle: String,
    metaDescription: String,
    // Tracking
    soldCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes for common queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

// Text index for search
productSchema.index(
    { name: 'text', description: 'text', shortDescription: 'text' },
    { weights: { name: 10, shortDescription: 5, description: 1 } }
);

/**
 * Virtual for discount percentage (based on first variant or base price)
 */
productSchema.virtual('discountPercentage').get(function () {
    const displayPrice = this.variants.length > 0 ? this.variants[0].price : this.price;
    if (this.comparePrice && this.comparePrice > displayPrice) {
        return Math.round(((this.comparePrice - displayPrice) / this.comparePrice) * 100);
    }
    return 0;
});

/**
 * Virtual for display price (first variant's price or base price)
 */
productSchema.virtual('displayPrice').get(function () {
    if (this.variants.length > 0) {
        return this.variants[0].price;
    }
    return this.price;
});

/**
 * Virtual for primary image
 */
productSchema.virtual('primaryImage').get(function () {
    if (this.images.length === 0) return null;
    const primary = this.images.find(img => img.isPrimary);
    return primary || this.images[0];
});

/**
 * Virtual for total stock (sum of all variant stocks or base stock)
 */
productSchema.virtual('totalStock').get(function () {
    if (this.variants.length === 0) return this.stock;
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});

/**
 * Virtual for inStock status
 */
productSchema.virtual('inStock').get(function () {
    return this.totalStock > 0;
});

/**
 * Pre-save middleware to generate slug
 */
productSchema.pre('save', async function () {
    if (this.isModified('name')) {
        let slug = createSlug(this.name);

        // Ensure unique slug by appending number if needed
        const existingProduct = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
        if (existingProduct) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        this.slug = slug;
    }
});

/**
 * Static method to search products
 */
productSchema.statics.search = function (query, options = {}) {
    const { limit = 20, page = 1, category, minPrice, maxPrice, sort = '-createdAt' } = options;

    const filter = { isActive: true };

    if (query) {
        filter.$text = { $search: query };
    }
    if (category) {
        filter.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    return this.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category', 'name slug');
};

/**
 * Static method to get featured products
 */
productSchema.statics.getFeatured = function (limit = 8) {
    return this.find({ isFeatured: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('category', 'name slug');
};

/**
 * Instance method to reduce stock
 * @param {array} items - [{ variantId, quantity }]
 */
productSchema.methods.reduceStock = async function (items) {
    for (const item of items) {
        if (item.variantId) {
            const variant = this.variants.id(item.variantId);
            if (variant) {
                variant.stock = Math.max(0, variant.stock - item.quantity);
            }
        } else {
            this.stock = Math.max(0, this.stock - item.quantity);
        }
    }
    this.soldCount += items.reduce((sum, i) => sum + i.quantity, 0);
    await this.save();
};

/**
 * Static method to get a specific variant by ID
 */
productSchema.methods.getVariant = function (variantId) {
    return this.variants.id(variantId);
};

/**
 * Static method to find variant by size and color
 */
productSchema.methods.findVariant = function (size, color) {
    return this.variants.find(
        v => v.size === size && v.color.toLowerCase() === color.toLowerCase()
    );
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
