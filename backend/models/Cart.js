/**
 * Cart Model
 * Handles user shopping cart with flat variant support
 * 
 * Features:
 * - One cart per user
 * - Price snapshot for change detection
 * - Single variantId per item (flat variant model)
 */
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null, // null if product has no variants
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1,
    },
    priceAtAdd: {
        type: Number, // Snapshot price when added (variant price or base price)
    },
}, { _id: true, timestamps: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One cart per user
    },
    items: [cartItemSchema],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

cartSchema.index({ updatedAt: -1 });

/**
 * Virtual for total items count
 */
cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Instance method to calculate cart total
 * Should be called after populating products
 */
cartSchema.methods.calculateTotal = function () {
    let subtotal = 0;
    const itemsWithPrices = [];

    for (const item of this.items) {
        if (!item.product) continue;

        let itemPrice = item.product.price; // Base price fallback
        let variant = null;

        // If variantId exists, find the variant and use its price
        if (item.variantId && item.product.variants) {
            variant = item.product.variants.find(
                v => v._id.toString() === item.variantId.toString()
            );
            if (variant) {
                itemPrice = variant.price;
            }
        }

        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        itemsWithPrices.push({
            ...item.toObject(),
            variant, // Include variant data for display
            currentPrice: itemPrice,
            itemTotal,
            priceChanged: item.priceAtAdd !== itemPrice,
        });
    }

    return {
        items: itemsWithPrices,
        subtotal,
        itemCount: this.itemCount,
    };
};


/**
 * Instance method to add item to cart
 * @param {ObjectId} productId - Product ID
 * @param {Number} quantity - Quantity to add
 * @param {ObjectId|null} variantId - Variant ID (null if no variants)
 * @param {Number} price - Price snapshot
 */
cartSchema.methods.addItem = async function (productId, quantity, variantId, price) {
    // Check if product with same variant exists
    const existingIndex = this.items.findIndex(item => {
        if (!item.product.equals(productId)) return false;
        
        // Compare variantId (both null = match, or both equal)
        const existingVarId = item.variantId ? item.variantId.toString() : null;
        const newVarId = variantId ? variantId.toString() : null;
        return existingVarId === newVarId;
    });

    if (existingIndex > -1) {
        // Update quantity
        this.items[existingIndex].quantity += quantity;
    } else {
        // Add new item
        this.items.push({
            product: productId,
            variantId,
            quantity,
            priceAtAdd: price,
        });
    }

    await this.save();
    return this;
};


/**
 * Instance method to update item quantity
 */
cartSchema.methods.updateItemQuantity = async function (itemId, quantity) {
    const item = this.items.id(itemId);
    if (!item) {
        throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
        item.deleteOne();
    } else {
        item.quantity = quantity;
    }

    await this.save();
    return this;
};

/**
 * Instance method to remove item
 */
cartSchema.methods.removeItem = async function (itemId) {
    const item = this.items.id(itemId);
    if (item) {
        item.deleteOne();
        await this.save();
    }
    return this;
};

/**
 * Instance method to clear cart
 */
cartSchema.methods.clear = async function () {
    this.items = [];
    await this.save();
    return this;
};

/**
 * Static method to get or create cart for user
 */
cartSchema.statics.getOrCreate = async function (userId) {
    let cart = await this.findOne({ user: userId }).populate({
        path: 'items.product',
        select: 'name slug price comparePrice images stock variants isActive',
    });

    if (!cart) {
        cart = await this.create({ user: userId, items: [] });
    }

    return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
