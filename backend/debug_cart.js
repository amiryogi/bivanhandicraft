const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cartService = require('./services/cartService');
const { User, Product } = require('./models');

dotenv.config();

const debugCart = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'debugtest@example.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return;
        }
        console.log('User found:', user._id);

        // Find a product
        const product = await Product.findOne({ isActive: true });
        if (!product) {
            console.log('No active products found');
            return;
        }
        console.log('Product found:', product._id, product.name);

        console.log('Adding to cart...');
        const cart = await cartService.addToCart(user._id, product._id, 1, []);
        
        if (cart.items.length === 0) {
            console.log('ANTIGRAVITY_RESULT: FAIL - Cart is empty');
        } else {
            const item = cart.items[0];
            const isPopulated = !!item.product && !!item.product.name;
            console.log(`ANTIGRAVITY_RESULT: SUCCESS - Cart has ${cart.items.length} items. Populated: ${isPopulated}`);
            if (isPopulated) {
                console.log('ANTIGRAVITY_RESULT: Product Name:', item.product.name);
            }
        }

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

debugCart();
