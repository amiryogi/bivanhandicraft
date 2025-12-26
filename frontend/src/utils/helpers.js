/**
 * Utility Functions
 * Common helper functions for the frontend
 */

/**
 * Format price in NPR
 * @param {number} amount - Amount in NPR
 * @returns {string} Formatted price
 */
export const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-NP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
};

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-NP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncate = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

/**
 * Get order status badge color
 * @param {string} status - Order status
 * @returns {string} CSS class
 */
export const getStatusColor = (status) => {
    const colors = {
        pending: 'badge-warning',
        confirmed: 'badge-info',
        processing: 'badge-info',
        shipped: 'badge-info',
        delivered: 'badge-success',
        cancelled: 'badge-error',
    };
    return colors[status] || 'badge-secondary';
};

/**
 * Get payment status badge color
 * @param {string} status - Payment status
 * @returns {string} CSS class
 */
export const getPaymentStatusColor = (status) => {
    const colors = {
        pending: 'badge-warning',
        paid: 'badge-success',
        failed: 'badge-error',
        refunded: 'badge-info',
    };
    return colors[status] || 'badge-secondary';
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} salePrice - Sale price
 * @returns {number} Discount percentage
 */
export const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Nepal provinces
 */
export const PROVINCES = [
    { id: 1, name: 'Province 1 (Koshi)' },
    { id: 2, name: 'Province 2 (Madhesh)' },
    { id: 3, name: 'Province 3 (Bagmati)' },
    { id: 4, name: 'Province 4 (Gandaki)' },
    { id: 5, name: 'Province 5 (Lumbini)' },
    { id: 6, name: 'Province 6 (Karnali)' },
    { id: 7, name: 'Province 7 (Sudurpashchim)' },
];
