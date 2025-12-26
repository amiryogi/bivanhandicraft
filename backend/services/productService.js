/**
 * Product Service
 * Handles product business logic
 */
const { Product, Category } = require('../models');
const { paginate } = require('../utils/helpers');
const AppError = require('../utils/AppError');
const { deleteImage } = require('../config/cloudinary');

/**
 * Get all products with filters and pagination
 */
const getProducts = async (options = {}) => {
    const {
        page = 1,
        limit = 12,
        category,
        search,
        minPrice,
        maxPrice,
        isFeatured,
        sort = '-createdAt',
    } = options;

    // Build filter
    const filter = { isActive: true };

    if (category) {
        // Find category by slug or ID
        const cat = await Category.findOne({
            $or: [{ slug: category }, { _id: category }],
        });
        if (cat) {
            filter.category = cat._id;
        }
    }

    if (search) {
        filter.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (isFeatured !== undefined) {
        filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    // Count total
    const total = await Product.countDocuments(filter);
    const pagination = paginate(page, limit, total);

    // Get products
    const products = await Product.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.itemsPerPage)
        .populate('category', 'name slug')
        .lean();

    return { products, pagination };
};

/**
 * Get single product by slug or ID
 */
const getProductBySlug = async (slugOrId) => {
    const product = await Product.findOne({
        $or: [{ slug: slugOrId }, { _id: slugOrId }],
        isActive: true,
    }).populate('category', 'name slug');

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    return product;
};

/**
 * Get featured products
 */
const getFeaturedProducts = async (limit = 8) => {
    return Product.getFeatured(limit);
};

/**
 * Create product (Admin)
 */
const createProduct = async (productData) => {
    // Verify category exists
    const category = await Category.findById(productData.category);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    const product = await Product.create(productData);
    return product;
};

/**
 * Update product (Admin)
 */
const updateProduct = async (productId, updateData) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // If category is being updated, verify it exists
    if (updateData.category) {
        const category = await Category.findById(updateData.category);
        if (!category) {
            throw new AppError('Category not found', 404);
        }
    }

    Object.assign(product, updateData);
    await product.save();

    return product;
};

/**
 * Delete product (Admin)
 */
const deleteProduct = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
        if (image.publicId) {
            await deleteImage(image.publicId);
        }
    }

    await product.deleteOne();
    return { message: 'Product deleted successfully' };
};

/**
 * Add images to product (Admin)
 */
const addProductImages = async (productId, files) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const newImages = files.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        isPrimary: product.images.length === 0 && index === 0,
    }));

    product.images.push(...newImages);
    await product.save();

    return product;
};

/**
 * Delete product image (Admin)
 */
const deleteProductImage = async (productId, imageId) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const image = product.images.id(imageId);
    if (!image) {
        throw new AppError('Image not found', 404);
    }

    // Delete from Cloudinary
    if (image.publicId) {
        await deleteImage(image.publicId);
    }

    image.deleteOne();
    await product.save();

    return product;
};

module.exports = {
    getProducts,
    getProductBySlug,
    getFeaturedProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductImages,
    deleteProductImage,
};
