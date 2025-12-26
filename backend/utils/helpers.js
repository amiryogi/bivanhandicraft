/**
 * Helper Utilities
 * Common utility functions used across the application
 */
const slugify = require('slugify');

/**
 * Generate URL-friendly slug from text
 * @param {string} text - Text to slugify
 * @returns {string} URL-friendly slug
 */
const createSlug = (text) => {
    return slugify(text, {
        lower: true,
        strict: true, // Remove special characters
        trim: true,
    });
};

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXXXX (random)
 * @returns {string} Order number
 */
const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${dateStr}-${random}`;
};

/**
 * Calculate pagination values
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination object
 */
const paginate = (page = 1, limit = 10, total = 0) => {
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
    const totalPages = Math.ceil(total / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        totalItems: total,
        skip,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
};

/**
 * Filter object to only include allowed fields
 * Useful for sanitizing user input
 * @param {object} obj - Object to filter
 * @param {array} allowedFields - Fields to keep
 * @returns {object} Filtered object
 */
const filterObject = (obj, allowedFields) => {
    const filtered = {};
    Object.keys(obj).forEach((key) => {
        if (allowedFields.includes(key)) {
            filtered[key] = obj[key];
        }
    });
    return filtered;
};

/**
 * Format price in NPR (Nepali Rupees)
 * @param {number} amount - Amount in paisa or rupees
 * @param {boolean} inPaisa - If true, divide by 100
 * @returns {string} Formatted price string
 */
const formatNPR = (amount, inPaisa = false) => {
    const rupees = inPaisa ? amount / 100 : amount;
    return new Intl.NumberFormat('ne-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(rupees);
};

/**
 * Validate Nepali phone number
 * Supports formats: 98XXXXXXXX, +977-98XXXXXXXX, 977XXXXXXXXXX
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidNepaliPhone = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, '');
    const pattern = /^(\+?977)?[0-9]{10}$/;
    return pattern.test(cleaned);
};

module.exports = {
    createSlug,
    generateOrderNumber,
    paginate,
    filterObject,
    formatNPR,
    isValidNepaliPhone,
};
