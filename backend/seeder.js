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
                { name: 'Nevan Collection', slug: 'nevan-collection', description: 'Exclusive handcrafted collection.', isActive: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Nevan Sprouts', slug: 'nevan-sprouts', description: 'Adorable items for the little ones.', isActive: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
            ]);
            console.log('   Created 2 categories');

            // Get category IDs
            const categories = await Category.find({});
            const catMap = {};
            categories.forEach(c => { catMap[c.name] = c._id; });

            // Create products
            console.log('📦 Creating products...');
            await Product.collection.insertMany([
                // --- Nevan Collection ---
                {
                    name: 'Handwoven Hemp Backpack',
                    slug: 'handwoven-hemp-backpack',
                    description: 'Durable and eco-friendly backpack made from pure Himalayan hemp.',
                    price: 2800,
                    comparePrice: 3500,
                    category: catMap['Nevan Collection'],
                    stock: 50,
                    sku: 'NC-HMP-001',
                    isFeatured: true,
                    isActive: true,
                    images: [
                        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', isPrimary: true },
                        { url: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600', isPrimary: false }
                    ],
                    variants: [
                        {
                            name: 'Size',
                            options: [
                                { value: 'Large Size (4-6 yrs)', priceModifier: 0, stock: 25 },
                                { value: 'XL Size (6-8 yrs)', priceModifier: 200, stock: 25 }
                            ]
                        },
                        {
                            name: 'Color',
                            options: [
                                { value: 'Natural', priceModifier: 0, stock: 25, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600' },
                                { value: 'Olive', priceModifier: 100, stock: 25, image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600' }
                            ]
                        }
                    ],
                    ratings: { average: 4.8, count: 12 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Traditional Pashmina Shawl',
                    slug: 'traditional-pashmina-shawl',
                    description: 'Luxurious authentic pashmina shawl.',
                    price: 5500,
                    comparePrice: 6500,
                    category: catMap['Nevan Collection'],
                    stock: 30,
                    sku: 'NC-PSH-002',
                    isFeatured: true,
                    isActive: true,
                    images: [
                        { url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600', isPrimary: true },
                        { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', isPrimary: false }
                    ],
                    variants: [
                        {
                            name: 'Size',
                            options: [
                                { value: 'Standard Size', priceModifier: 0, stock: 30 }
                            ]
                        },
                        {
                            name: 'Color',
                            options: [
                                { value: 'Cream', priceModifier: 0, stock: 15, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600' },
                                { value: 'Brown', priceModifier: 0, stock: 15, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600' }
                            ]
                        }
                    ],
                    ratings: { average: 5.0, count: 5 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },

                // --- Nevan Sprouts ---
                {
                    name: 'Organic Baby Jumpsuit',
                    slug: 'organic-baby-jumpsuit',
                    description: 'Softest organic cotton jumpsuit for your little one.',
                    price: 1500,
                    comparePrice: 1800,
                    category: catMap['Nevan Sprouts'],
                    stock: 60,
                    sku: 'NS-JMP-001',
                    isFeatured: true,
                    isActive: true,
                    images: [
                        { url: 'https://images.unsplash.com/photo-1522771753035-1a5b6562f3ba?w=600', isPrimary: true },
                        { url: 'https://images.unsplash.com/photo-1519238263496-6361937a42d8?w=600', isPrimary: false }
                    ],
                    variants: [
                        {
                            name: 'Size',
                            options: [
                                { value: 'Small Size (0-1 yrs)', priceModifier: 0, stock: 20 },
                                { value: 'Medium Size (1-4 yrs)', priceModifier: 150, stock: 20 },
                                { value: 'Large Size (4-6 yrs)', priceModifier: 300, stock: 20 }
                            ]
                        },
                        {
                            name: 'Color',
                            options: [
                                { value: 'White', priceModifier: 0, stock: 30, image: 'https://images.unsplash.com/photo-1522771753035-1a5b6562f3ba?w=600' },
                                { value: 'Blue', priceModifier: 50, stock: 30, image: 'https://images.unsplash.com/photo-1519238263496-6361937a42d8?w=600' }
                            ]
                        }
                    ],
                    ratings: { average: 4.6, count: 18 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Cozy Woolen Booties',
                    slug: 'cozy-woolen-booties',
                    description: 'Hand-knit woolen booties to keep tiny feet warm.',
                    price: 950,
                    comparePrice: 1200,
                    category: catMap['Nevan Sprouts'],
                    stock: 45,
                    sku: 'NS-BT-002',
                    isFeatured: true,
                    isActive: true,
                    images: [
                        { url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=600', isPrimary: true },
                        { url: 'https://images.unsplash.com/photo-1515488042361-25f4682f087e?w=600', isPrimary: false }
                    ],
                    variants: [
                        {
                            name: 'Size',
                            options: [
                                { value: 'Small Size (0-1 yrs)', priceModifier: 0, stock: 25 },
                                { value: 'Medium Size (1-4 yrs)', priceModifier: 100, stock: 20 }
                            ]
                        },
                        {
                            name: 'Color',
                            options: [
                                { value: 'Beige', priceModifier: 0, stock: 25, image: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=600' },
                                { value: 'Red', priceModifier: 0, stock: 20, image: 'https://images.unsplash.com/photo-1515488042361-25f4682f087e?w=600' }
                            ]
                        }
                    ],
                    ratings: { average: 4.9, count: 10 },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            ]);
            console.log('   Created 9 products');

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
