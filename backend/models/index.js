/**
 * Models Index
 * Exports all models from a single entry point
 */

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');
const Payment = require('./Payment');
const Review = require('./Review');

module.exports = {
    User,
    Category,
    Product,
    Cart,
    Order,
    Payment,
    Review,
};
