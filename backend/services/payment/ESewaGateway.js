/**
 * eSewa Gateway
 * Implementation of IPaymentGateway for eSewa (Nepal)
 * 
 * eSewa is Nepal's most popular digital wallet.
 * Flow:
 * 1. Generate payment URL with signature
 * 2. Redirect user to eSewa
 * 3. User completes payment
 * 4. eSewa redirects to success/failure URL
 * 5. Verify transaction using eSewa API
 * 
 * @see https://developer.esewa.com.np/
 */
const IPaymentGateway = require('./IPaymentGateway');
const crypto = require('crypto');
const axios = require('axios');

class ESewaGateway extends IPaymentGateway {
    constructor() {
        super('esewa');

        // eSewa endpoints
        this.isProduction = process.env.NODE_ENV === 'production';
        this.baseUrl = this.isProduction
            ? 'https://esewa.com.np'
            : 'https://rc-epay.esewa.com.np'; // Sandbox/RC (Release Candidate)

        this.paymentUrl = `${this.baseUrl}/api/epay/main/v2/form`;
        this.verifyUrl = `${this.baseUrl}/api/epay/transaction/status/`;

        // Merchant credentials from environment
        this.merchantCode = process.env.ESEWA_MERCHANT_CODE;
        this.secretKey = process.env.ESEWA_SECRET_KEY;
    }

    /**
     * Generate HMAC signature for eSewa
     * @param {string} message - Message to sign
     * @returns {string} Base64 encoded signature
     */
    generateSignature(message) {
        const hmac = crypto.createHmac('sha256', this.secretKey);
        hmac.update(message);
        return hmac.digest('base64');
    }

    /**
     * Initiate eSewa payment
     * Returns URL to redirect user to eSewa payment page
     */
    async initiate(order, userData) {
        try {
            const amount = order.pricing.total;
            const taxAmount = order.pricing.tax || 0;
            const productServiceCharge = 0;
            const productDeliveryCharge = order.pricing.shippingCost || 0;
            const totalAmount = amount;

            // Create unique transaction UUID
            const transactionUuid = `${order.orderNumber}-${Date.now()}`;

            // Signature message format: total_amount,transaction_uuid,product_code
            const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${this.merchantCode}`;
            const signature = this.generateSignature(signatureMessage);

            // Success and failure callback URLs
            const successUrl = `${process.env.BACKEND_URL}/api/v1/payments/esewa/success`;
            const failureUrl = `${process.env.BACKEND_URL}/api/v1/payments/esewa/failure`;

            // Form data for eSewa
            const formData = {
                amount: amount - taxAmount - productServiceCharge - productDeliveryCharge,
                tax_amount: taxAmount,
                product_service_charge: productServiceCharge,
                product_delivery_charge: productDeliveryCharge,
                total_amount: totalAmount,
                transaction_uuid: transactionUuid,
                product_code: this.merchantCode,
                success_url: successUrl,
                failure_url: failureUrl,
                signed_field_names: 'total_amount,transaction_uuid,product_code',
                signature: signature,
            };

            return {
                success: true,
                transactionId: transactionUuid,
                status: 'initiated',
                requiresRedirect: true,
                redirectUrl: this.paymentUrl,
                formData: formData, // Form data to POST to eSewa
                method: 'POST',
                message: 'Redirecting to eSewa...',
            };
        } catch (error) {
            console.error('eSewa initiate error:', error);
            return {
                success: false,
                status: 'failed',
                message: 'Failed to initiate eSewa payment',
                error: error.message,
            };
        }
    }

    /**
     * Verify eSewa payment using transaction lookup API
     */
    async verify(transactionId, callbackData) {
        try {
            // eSewa returns encoded data in the callback
            const { data } = callbackData;

            if (!data) {
                return {
                    verified: false,
                    status: 'failed',
                    message: 'No callback data received',
                };
            }

            // Decode base64 data from eSewa
            const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

            const {
                transaction_code,
                status,
                total_amount,
                transaction_uuid,
                product_code,
                signed_field_names,
                signature,
            } = decodedData;

            // Verify signature
            const signatureMessage = `transaction_code=${transaction_code},status=${status},total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code},signed_field_names=${signed_field_names}`;
            const expectedSignature = this.generateSignature(signatureMessage);

            if (signature !== expectedSignature) {
                console.error('eSewa signature mismatch');
                return {
                    verified: false,
                    status: 'failed',
                    message: 'Invalid signature',
                };
            }

            // Additional verification with eSewa API
            const verifyResponse = await axios.get(this.verifyUrl, {
                params: {
                    product_code: this.merchantCode,
                    total_amount: total_amount,
                    transaction_uuid: transaction_uuid,
                },
            });

            if (verifyResponse.data.status === 'COMPLETE') {
                return {
                    verified: true,
                    status: 'completed',
                    transactionId: transaction_code,
                    referenceId: transaction_uuid,
                    amount: total_amount,
                    rawResponse: verifyResponse.data,
                };
            }

            return {
                verified: false,
                status: 'failed',
                message: `Payment status: ${verifyResponse.data.status}`,
                rawResponse: verifyResponse.data,
            };
        } catch (error) {
            console.error('eSewa verify error:', error);
            return {
                verified: false,
                status: 'failed',
                message: 'Verification failed',
                error: error.message,
            };
        }
    }

    /**
     * Handle eSewa callback
     */
    async handleCallback(data) {
        try {
            // Decode the response data
            const decodedData = JSON.parse(Buffer.from(data.data, 'base64').toString('utf-8'));

            const orderId = decodedData.transaction_uuid.split('-')[0]; // Extract order number

            if (decodedData.status === 'COMPLETE') {
                return {
                    success: true,
                    orderId,
                    transactionId: decodedData.transaction_code,
                    status: 'completed',
                    amount: decodedData.total_amount,
                };
            }

            return {
                success: false,
                orderId,
                status: 'failed',
                message: `Payment failed with status: ${decodedData.status}`,
            };
        } catch (error) {
            console.error('eSewa callback error:', error);
            return {
                success: false,
                status: 'failed',
                message: 'Failed to process callback',
                error: error.message,
            };
        }
    }

    /**
     * Refund eSewa payment
     * Note: eSewa refunds are typically handled manually through merchant dashboard
     */
    async refund(transactionId, amount) {
        // eSewa doesn't provide a direct refund API for most merchants
        // Refunds are processed through the eSewa merchant portal
        return {
            success: false,
            message: 'eSewa refunds must be processed through the merchant portal',
            transactionId,
            amount,
        };
    }
}

module.exports = ESewaGateway;
