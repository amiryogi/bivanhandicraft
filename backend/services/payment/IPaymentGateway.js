/**
 * Payment Gateway Interface
 * Abstract class defining the contract for all payment gateways
 * 
 * All payment gateways must implement these methods.
 * This follows the Strategy Pattern for pluggable payment systems.
 */

class IPaymentGateway {
    constructor(name) {
        if (this.constructor === IPaymentGateway) {
            throw new Error('IPaymentGateway is abstract and cannot be instantiated');
        }
        this.name = name;
    }

    /**
     * Initiate a payment
     * @param {object} order - Order document
     * @param {object} userData - User data (for pre-filling forms)
     * @returns {Promise<object>} { success, redirectUrl?, transactionId, status, message }
     */
    async initiate(order, userData) {
        throw new Error('initiate() must be implemented');
    }

    /**
     * Verify a payment after gateway callback
     * @param {string} transactionId - Transaction ID from gateway
     * @param {object} callbackData - Data received from gateway callback
     * @returns {Promise<object>} { verified, status, transactionId, rawResponse }
     */
    async verify(transactionId, callbackData) {
        throw new Error('verify() must be implemented');
    }

    /**
     * Handle callback from payment gateway
     * @param {object} data - Callback data from gateway
     * @returns {Promise<object>} { success, orderId, transactionId, status }
     */
    async handleCallback(data) {
        throw new Error('handleCallback() must be implemented');
    }

    /**
     * Process refund (optional)
     * @param {string} transactionId - Original transaction ID
     * @param {number} amount - Amount to refund
     * @returns {Promise<object>} { success, refundId, message }
     */
    async refund(transactionId, amount) {
        throw new Error('refund() is not implemented for this gateway');
    }

    /**
     * Get gateway name
     * @returns {string}
     */
    getName() {
        return this.name;
    }
}

module.exports = IPaymentGateway;
