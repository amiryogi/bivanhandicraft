/**
 * Database Seeder
 * Seeds the database with sample data for development/testing
 *
 * Usage:
 *   node seeder.js --import   # Import sample data
 *   node seeder.js --destroy  # Delete all data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to Database first
const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Import models after connection
        const User = require('./models/User');
        const Category = require('./models/Category');
        const Product = require('./models/Product');
        const Cart = require('./models/Cart');
        const Order = require('./models/Order');
        const Payment = require('./models/Payment');
        const Review = require('./models/Review');

        const arg = process.argv[2];

        if (arg === '--import' || arg === '-i') {
            // Clear existing data
            console.log('🗑️  Clearing existing data...');
            await User.deleteMany({});
            await Category.deleteMany({});
            await Product.deleteMany({});
            await Cart.deleteMany({});
            await Order.deleteMany({});
            await Payment.deleteMany({});
            await Review.deleteMany({});
            console.log('   Data cleared');

            // Create admin user with pre-hashed password
            console.log('👤 Creating users...');
            const hashedPassword1 = await bcrypt.hash('Bivan@2036', 12);
            const hashedPassword2 = await bcrypt.hash('Bimala@2036', 12);

            await User.collection.insertMany([
                {
                    name: 'Amir Shrestha',
                    email: 'amir@svi.edu.np',
                    password: hashedPassword1,
                    phone: '9861158271',
                    role: 'admin',
                    isActive: true,
                    addresses: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Bimala Customer',
                    email: 'bimala@svi.edu.np',
                    password: hashedPassword2,
                    phone: '9861158272',
                    role: 'customer',
                    isActive: true,
                    addresses: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            console.log('   Created 2 users');

            // Create categories directly
            console.log('📁 Creating categories...');
            const categoryDocs = await Category.collection.insertMany([
                { name: 'Pashmina', slug: 'pashmina', description: 'Luxurious Nepali pashmina shawls and scarves.', isActive: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Thangka Paintings', slug: 'thangka-paintings', description: 'Traditional Buddhist scroll paintings.', isActive: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Singing Bowls', slug: 'singing-bowls', description: 'Handcrafted meditation singing bowls.', isActive: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Metal Crafts', slug: 'metal-crafts', description: 'Handmade brass and copper items.', isActive: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Felt Products', slug: 'felt-products', description: 'Colorful handmade felt items.', isActive: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Hemp Products', slug: 'hemp-products', description: 'Eco-friendly hemp bags and accessories.', isActive: true, order: 6, createdAt: new Date(), updatedAt: new Date() },
            ]);
            console.log('   Created 6 categories');

            // Get category IDs
            const categories = await Category.find({});
            const catMap = {};
            categories.forEach(c => { catMap[c.name] = c._id; });

            // Create products
            console.log('📦 Creating products...');
            await Product.collection.insertMany([
                {
                    name: 'Classic Pashmina Shawl',
                    slug: 'classic-pashmina-shawl',
                    description: 'Authentic Nepali pashmina shawl in natural cream color.',
                    price: 4500,
                    comparePrice: 5500,
                    category: catMap['Pashmina'],
                    stock: 25,
                    sku: 'PSH-001',
                    isFeatured: true,
                    isActive: true,
                    images: [{ url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600', isPrimary: true }],
                    ratings: { average: 0, count: 0 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Buddha Thangka Painting',
                    slug: 'buddha-thangka-painting',
                    description: 'Hand-painted Shakyamuni Buddha thangka on cotton canvas.',
                    price: 15000,
                    comparePrice: 18000,
                    category: catMap['Thangka Paintings'],
                    stock: 8,
                    sku: 'THK-001',
                    isFeatured: true,
                    isActive: true,
                    images: [{ url: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=600', isPrimary: true }],
                    ratings: { average: 0, count: 0 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Tibetan Singing Bowl',
                    slug: 'tibetan-singing-bowl',
                    description: 'Handcrafted singing bowl made from seven metals.',
                    price: 3200,
                    comparePrice: 3800,
                    category: catMap['Singing Bowls'],
                    stock: 40,
                    sku: 'SNG-001',
                    isFeatured: true,
                    isActive: true,
                    images: [{ url: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=600', isPrimary: true }],
                    ratings: { average: 0, count: 0 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Brass Buddha Statue',
                    slug: 'brass-buddha-statue',
                    description: 'Beautifully crafted brass Buddha statue in meditation pose.',
                    price: 8500,
                    comparePrice: 9500,
                    category: catMap['Metal Crafts'],
                    stock: 12,
                    sku: 'MTL-001',
                    isFeatured: true,
                    isActive: true,
                    images: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', isPrimary: true }],
                    ratings: { average: 0, count: 0 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Felt Flower Handbag',
                    slug: 'felt-flower-handbag',
                    description: 'Colorful handmade felt bag decorated with flowers.',
                    price: 1800,
                    comparePrice: 2200,
                    category: catMap['Felt Products'],
                    stock: 35,
                    sku: 'FLT-001',
                    isFeatured: true,
                    isActive: true,
                    images: [{ url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600', isPrimary: true }],
                    ratings: { average: 0, count: 0 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Hemp Backpack',
                    slug: 'hemp-backpack',
                    description: 'Durable and eco-friendly backpack made from Nepali hemp.',
                    price: 2500,
                    comparePrice: 3000,
                    category: catMap['Hemp Products'],
                    stock: 30,
                    sku: 'HMP-001',
                    isFeatured: true,
                    isActive: true,
                    images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', isPrimary: true }],
                    ratings: { average: 0, count: 0 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            console.log('   Created 6 products');

            console.log('\n✨ Data imported successfully!\n');
            console.log('🔐 Admin: amir@svi.edu.np / Bivan@2036');
            console.log('👤 Customer: bimala@svi.edu.np / Bimala@2036\n');

        } else if (arg === '--destroy' || arg === '-d') {
            console.log('🗑️  Deleting all data...');
            await User.deleteMany({});
            await Category.deleteMany({});
            await Product.deleteMany({});
            await Cart.deleteMany({});
            await Order.deleteMany({});
            await Payment.deleteMany({});
            await Review.deleteMany({});
            console.log('✅ All data destroyed!');
        } else {
            console.log('\n📦 BivanHandicraft Database Seeder\n');
            console.log('Usage:');
            console.log('  node seeder.js --import   Import sample data');
            console.log('  node seeder.js --destroy  Delete all data\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

run();
