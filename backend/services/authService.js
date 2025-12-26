/**
 * Auth Service
 * Handles authentication business logic
 * Separates auth logic from HTTP handling
 */
const { User } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../utils/tokenUtils');
const AppError = require('../utils/AppError');

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {object} { user, tokens }
 */
const registerUser = async (userData) => {
    const { name, email, password, phone } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        phone,
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove sensitive fields
    user.password = undefined;
    user.refreshToken = undefined;

    return { user, tokens };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} { user, tokens }
 */
const loginUser = async (email, password) => {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError('Your account has been deactivated', 401);
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    // Update refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Remove sensitive fields
    user.password = undefined;
    user.refreshToken = undefined;

    return { user, tokens };
};

/**
 * Logout user
 * Invalidates refresh token
 * @param {string} userId - User ID
 */
const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {object} { accessToken, refreshToken }
 */
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    try {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Find user with stored refresh token
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (!user) {
            throw new AppError('User not found', 401);
        }

        if (!user.isActive) {
            throw new AppError('Your account has been deactivated', 401);
        }

        // Verify stored refresh token matches
        if (user.refreshToken !== refreshToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Generate new token pair (rotate refresh token for security)
        const tokens = generateTokenPair(user);

        // Update stored refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save({ validateBeforeSave: false });

        return tokens;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Invalid refresh token', 401);
    }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!(await user.comparePassword(currentPassword))) {
        throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    return { message: 'Password changed successfully' };
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
};
