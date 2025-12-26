/**
 * COD (Cash on Delivery) Gateway
 * Implementation of IPaymentGateway for Cash on Delivery
 * 
 * COD is always "successful" at initiation since payment
 * is collected on delivery. Payment is marked complete
 * when order is delivered.
 */
const IPaymentGateway = require('./IPaymentGateway');

class CODGateway extends IPaymentGateway {
    constructor() {
        super('cod');
    }

    /**
     * Initiate COD payment
     * COD is always successful at initiation
     */
    async initiate(order, userData) {
        // Generate a reference ID for tracking
        const transactionId = `COD-${order.orderNumber}-${Date.now()}`;

        return {
            success: true,
            transactionId,
            status: 'pending', // Will be 'completed' when delivered
            message: 'Pay cash on delivery',
            requiresRedirect: false,
            // COD doesn't need redirect URL
        };
    }

    /**
     * Verify COD payment
     * COD verification is manual (delivery agent marks it)
     */
    async verify(transactionId, callbackData) {
        // For COD, verification is done manually
        // This would be called when delivery agent confirms payment
        return {
            verified: true,
            status: 'pending', // Still pending until delivery
            transactionId,
            rawResponse: { method: 'cod', manual: true },
        };
    }

    /**
     * Handle callback
     * COD doesn't have external callbacks
     */
    async handleCallback(data) {
        return {
            success: true,
            orderId: data.orderId,
            transactionId: data.transactionId,
            status: 'pending',
        };
    }

    /**
     * Mark COD as collected (called on delivery)
     * @param {string} orderId - Order ID
     * @param {string} collectedAmount - Amount collected
     */
    async markCollected(orderId, collectedAmount) {
        return {
            success: true,
            status: 'completed',
            message: `NPR ${collectedAmount} collected on delivery`,
        };
    }

    /**
     * Refund for COD
     * Not applicable - no payment was made
     */
    async refund(transactionId, amount) {
        return {
            success: false,
            message: 'Refund not applicable for COD orders',
        };
    }
}

module.exports = CODGateway;
