/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 * 
 * This factory implements the Strategy Pattern, allowing
 * easy addition of new payment gateways without modifying
 * existing code.
 */
const CODGateway = require('./CODGateway');
const ESewaGateway = require('./ESewaGateway');
const KhaltiGateway = require('./KhaltiGateway');

class PaymentFactory {
    constructor() {
        // Registry of available gateways
        this.gateways = {
            cod: CODGateway,
            esewa: ESewaGateway,
            khalti: KhaltiGateway,
            // Add more gateways here:
            // stripe: StripeGateway,
            // paypal: PayPalGateway,
        };

        // Cache for gateway instances (singleton per gateway)
        this.instances = {};
    }

    /**
     * Get a payment gateway instance
     * @param {string} gatewayName - Name of the gateway (cod, esewa, khalti)
     * @returns {IPaymentGateway} Gateway instance
     */
    getGateway(gatewayName) {
        const name = gatewayName.toLowerCase();

        if (!this.gateways[name]) {
            throw new Error(`Payment gateway '${name}' is not supported`);
        }

        // Return cached instance or create new one
        if (!this.instances[name]) {
            const GatewayClass = this.gateways[name];
            this.instances[name] = new GatewayClass();
        }

        return this.instances[name];
    }

    /**
     * Get list of available gateways
     * @returns {string[]} Array of gateway names
     */
    getAvailableGateways() {
        return Object.keys(this.gateways);
    }

    /**
     * Check if a gateway is supported
     * @param {string} gatewayName - Name of the gateway
     * @returns {boolean}
     */
    isSupported(gatewayName) {
        return this.gateways.hasOwnProperty(gatewayName.toLowerCase());
    }

    /**
     * Register a new gateway
     * @param {string} name - Gateway name
     * @param {class} GatewayClass - Gateway class extending IPaymentGateway
     */
    registerGateway(name, GatewayClass) {
        this.gateways[name.toLowerCase()] = GatewayClass;
    }
}

// Export singleton instance
module.exports = new PaymentFactory();
