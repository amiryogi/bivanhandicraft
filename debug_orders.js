const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Register models
const User = require(path.join(__dirname, 'backend', 'models', 'User.js'));
const Product = require(path.join(__dirname, 'backend', 'models', 'Product.js'));
const Order = require(path.join(__dirname, 'backend', 'models', 'Order.js'));

const debugOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const orders = await Order.find({});
        console.log(`Total Orders: ${orders.length}`);

        orders.forEach(o => {
            console.log(`Order: ${o.orderNumber} | Status: ${o.status} | Payment: ${o.payment?.status} | Total: ${o.pricing?.total}`);
        });

        // Run the specific aggregation
        const revenue = await Order.aggregate([
            { 
                $match: { 
                    status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
                } 
            },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } },
        ]);
        console.log('Aggregation Result:', JSON.stringify(revenue, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

debugOrders();
