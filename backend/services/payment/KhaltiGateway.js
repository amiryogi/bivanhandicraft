/**
 * Khalti Gateway
 * Implementation of IPaymentGateway for Khalti (Nepal)
 * 
 * Khalti is Nepal's popular digital payment platform.
 * Flow:
 * 1. Initiate payment with Khalti API
 * 2. Redirect user to Khalti payment page
 * 3. User completes payment
 * 4. Khalti redirects to callback URL with pidx
 * 5. Verify payment using Khalti lookup API
 * 
 * @see https://docs.khalti.com/
 */
const IPaymentGateway = require('./IPaymentGateway');
const axios = require('axios');

class KhaltiGateway extends IPaymentGateway {
    constructor() {
        super('khalti');

        // Khalti endpoints
        this.isProduction = process.env.NODE_ENV === 'production';
        this.baseUrl = this.isProduction
            ? 'https://khalti.com/api/v2'
            : 'https://a.khalti.com/api/v2'; // Sandbox

        this.initiateUrl = `${this.baseUrl}/epayment/initiate/`;
        this.lookupUrl = `${this.baseUrl}/epayment/lookup/`;

        // API keys
        this.secretKey = process.env.KHALTI_SECRET_KEY;
        this.publicKey = process.env.KHALTI_PUBLIC_KEY;
    }

    /**
     * Get authorization header
     */
    getAuthHeader() {
        return {
            Authorization: `Key ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Initiate Khalti payment
     * Creates a payment request and returns checkout URL
     */
    async initiate(order, userData) {
        try {
            // Convert to paisa (Khalti requires amount in paisa)
            const amountInPaisa = Math.round(order.pricing.total * 100);

            const payload = {
                return_url: `${process.env.BACKEND_URL}/api/v1/payments/khalti/callback`,
                website_url: process.env.FRONTEND_URL,
                amount: amountInPaisa,
                purchase_order_id: order.orderNumber,
                purchase_order_name: `Order ${order.orderNumber}`,
                customer_info: {
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone || '',
                },
                // Optional: Add product details
                product_details: order.items.map(item => ({
                    identity: item.product.toString(),
                    name: item.name,
                    total_price: item.subtotal * 100, // In paisa
                    quantity: item.quantity,
                    unit_price: item.price * 100, // In paisa
                })),
            };

            const response = await axios.post(this.initiateUrl, payload, {
                headers: this.getAuthHeader(),
            });

            if (response.data && response.data.payment_url) {
                return {
                    success: true,
                    transactionId: response.data.pidx,
                    status: 'initiated',
                    requiresRedirect: true,
                    redirectUrl: response.data.payment_url,
                    pidx: response.data.pidx,
                    message: 'Redirecting to Khalti...',
                };
            }

            return {
                success: false,
                status: 'failed',
                message: 'Failed to get Khalti payment URL',
                rawResponse: response.data,
            };
        } catch (error) {
            console.error('Khalti initiate error:', error.response?.data || error.message);
            return {
                success: false,
                status: 'failed',
                message: error.response?.data?.detail || 'Failed to initiate Khalti payment',
                error: error.message,
            };
        }
    }

    /**
     * Verify Khalti payment using lookup API
     */
    async verify(transactionId, callbackData) {
        try {
            const { pidx } = callbackData;

            if (!pidx) {
                return {
                    verified: false,
                    status: 'failed',
                    message: 'No pidx provided for verification',
                };
            }

            const response = await axios.post(
                this.lookupUrl,
                { pidx },
                { headers: this.getAuthHeader() }
            );

            const { status, total_amount, transaction_id, fee, refunded } = response.data;

            if (status === 'Completed') {
                return {
                    verified: true,
                    status: 'completed',
                    transactionId: transaction_id,
                    referenceId: pidx,
                    amount: total_amount / 100, // Convert from paisa to rupees
                    fee: fee / 100,
                    rawResponse: response.data,
                };
            }

            if (status === 'Pending') {
                return {
                    verified: false,
                    status: 'pending',
                    message: 'Payment is still pending',
                    rawResponse: response.data,
                };
            }

            if (status === 'Refunded' || refunded) {
                return {
                    verified: false,
                    status: 'refunded',
                    message: 'Payment was refunded',
                    rawResponse: response.data,
                };
            }

            return {
                verified: false,
                status: 'failed',
                message: `Payment status: ${status}`,
                rawResponse: response.data,
            };
        } catch (error) {
            console.error('Khalti verify error:', error.response?.data || error.message);
            return {
                verified: false,
                status: 'failed',
                message: 'Verification failed',
                error: error.message,
            };
        }
    }

    /**
     * Handle Khalti callback
     * Khalti redirects to callback URL with pidx and other params
     */
    async handleCallback(data) {
        try {
            const { pidx, status, purchase_order_id, transaction_id, amount } = data;

            if (status === 'Completed') {
                // Verify the payment
                const verification = await this.verify(transaction_id, { pidx });

                return {
                    success: verification.verified,
                    orderId: purchase_order_id,
                    transactionId: transaction_id || pidx,
                    status: verification.status,
                    amount: amount / 100,
                    rawResponse: data,
                };
            }

            return {
                success: false,
                orderId: purchase_order_id,
                status: status?.toLowerCase() || 'failed',
                message: `Payment ${status}`,
                rawResponse: data,
            };
        } catch (error) {
            console.error('Khalti callback error:', error);
            return {
                success: false,
                status: 'failed',
                message: 'Failed to process callback',
                error: error.message,
            };
        }
    }

    /**
     * Refund Khalti payment
     * Note: Khalti refunds require contacting support for most cases
     */
    async refund(transactionId, amount) {
        // Khalti doesn't provide a direct refund API for most merchants
        // Contact Khalti support for refunds
        return {
            success: false,
            message: 'Khalti refunds must be requested through Khalti support',
            transactionId,
            amount,
        };
    }
}

module.exports = KhaltiGateway;
