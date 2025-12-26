/**
 * User Model
 * Handles user authentication and profile data
 * 
 * Features:
 * - Password hashing with bcrypt
 * - Nepal-specific phone validation
 * - Embedded addresses with province support
 * - Role-based access (customer, admin)
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
    label: {
        type: String,
        default: 'Home',
        trim: true,
    },
    street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    district: {
        type: String,
        required: [true, 'District is required'],
        trim: true,
    },
    province: {
        type: Number,
        required: [true, 'Province is required'],
        min: [1, 'Province must be between 1 and 7'],
        max: [7, 'Province must be between 1 and 7'],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { _id: true });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Never return password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        match: [/^(\+?977)?[0-9]{10}$/, 'Please provide a valid Nepali phone number'],
        set: (v) => (v === '' ? undefined : v),
    },
    role: {
        type: String,
        enum: {
            values: ['customer', 'admin'],
            message: 'Role must be either customer or admin',
        },
        default: 'customer',
    },
    avatar: {
        url: String,
        publicId: String, // Cloudinary public ID for deletion
    },
    addresses: [addressSchema],
    refreshToken: {
        type: String,
        select: false, // Never return refresh token in queries
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: Date,
    passwordChangedAt: Date,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes for efficient queries
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

/**
 * Pre-save middleware to hash password
 * Only runs when password is modified
 */
userSchema.pre('save', async function () {
    // Only hash if password was modified
    if (!this.isModified('password')) return;

    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Set passwordChangedAt for token invalidation
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token created after
    }
});

/**
 * Instance method to compare passwords
 * @param {string} candidatePassword - Password to check
 * @returns {boolean} True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to check if password was changed after token was issued
 * @param {number} JWTTimestamp - Token issued timestamp
 * @returns {boolean} True if password was changed after token
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

/**
 * Instance method to get default address
 * @returns {object|null} Default address or first address
 */
userSchema.methods.getDefaultAddress = function () {
    if (this.addresses.length === 0) return null;
    const defaultAddr = this.addresses.find(addr => addr.isDefault);
    return defaultAddr || this.addresses[0];
};

/**
 * Static method to find active users by role
 * @param {string} role - User role
 * @returns {Query} Mongoose query
 */
userSchema.statics.findByRole = function (role) {
    return this.find({ role, isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
