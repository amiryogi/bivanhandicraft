const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const { Category } = require('./models');

const run = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('Attempting to create category...');
        const categoryData = {
            name: 'Test Category ' + Date.now(),
            description: 'Test Description',
            parent: null,
            order: 0,
            isActive: true
        };

        const category = await Category.create(categoryData);
        console.log('Category created successfully:', category);

    } catch (error) {
        const fs = require('fs');
        fs.writeFileSync('debug_error.log', error.stack || error.toString());
        console.error('ERROR OCCURRED (written to debug_error.log)');
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

run();
