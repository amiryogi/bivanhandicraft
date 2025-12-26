/**
 * Cart Model
 * Handles user shopping cart with variant support
 * 
 * Features:
 * - One cart per user
 * - Price snapshot for change detection
 * - Selected variants tracking
 */
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1,
    },
    selectedVariants: [{
        variantName: String, // e.g., 'Size'
        optionValue: String, // e.g., 'XL'
        variantId: mongoose.Schema.Types.ObjectId,
        optionId: mongoose.Schema.Types.ObjectId,
        priceModifier: Number,
    }],
    priceAtAdd: {
        type: Number, // Snapshot price when added
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

        let itemPrice = item.product.price;

        // Add variant price modifiers
        if (item.selectedVariants && item.selectedVariants.length > 0) {
            for (const variant of item.selectedVariants) {
                itemPrice += variant.priceModifier || 0;
            }
        }

        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        itemsWithPrices.push({
            ...item.toObject(),
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
 */
cartSchema.methods.addItem = async function (productId, quantity, selectedVariants, price) {
    // Check if product with same variants exists
    const existingIndex = this.items.findIndex(item => {
        if (!item.product.equals(productId)) return false;

        // Compare variants
        const existingVariants = JSON.stringify(
            (item.selectedVariants || []).map(v => ({ name: v.variantName, value: v.optionValue })).sort()
        );
        const newVariants = JSON.stringify(
            (selectedVariants || []).map(v => ({ name: v.variantName, value: v.optionValue })).sort()
        );

        return existingVariants === newVariants;
    });

    if (existingIndex > -1) {
        // Update quantity
        this.items[existingIndex].quantity += quantity;
    } else {
        // Add new item
        this.items.push({
            product: productId,
            quantity,
            selectedVariants,
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
