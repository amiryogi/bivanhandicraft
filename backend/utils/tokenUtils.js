/**
 * JWT Token Utilities
 * Handles generation and verification of access and refresh tokens
 */
const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 * Used for API authentication
 * @param {object} payload - Data to encode (user ID, role)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
};

/**
 * Generate Refresh Token (long-lived)
 * Used to obtain new access tokens
 * @param {object} payload - Data to encode (user ID)
 * @returns {string} JWT token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });
};

/**
 * Verify Access Token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError} If token is invalid
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError} If token is invalid
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Generate both tokens for a user
 * @param {object} user - User document
 * @returns {object} { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
    const accessPayload = {
        userId: user._id,
        role: user.role,
    };

    const refreshPayload = {
        userId: user._id,
    };

    return {
        accessToken: generateAccessToken(accessPayload),
        refreshToken: generateRefreshToken(refreshPayload),
    };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokenPair,
};
