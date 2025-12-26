/**
 * Category Service
 * Handles category business logic
 */
const { Category } = require('../models');
const AppError = require('../utils/AppError');
const { deleteImage } = require('../config/cloudinary');

/**
 * Get all categories (tree structure)
 */
const getCategories = async () => {
    return Category.getTree();
};

/**
 * Get all categories (flat list)
 */
const getAllCategoriesFlat = async () => {
    return Category.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .populate('parent', 'name slug');
};

/**
 * Get single category by slug
 */
const getCategoryBySlug = async (slug) => {
    const category = await Category.findBySlug(slug);
    if (!category) {
        throw new AppError('Category not found', 404);
    }
    return category;
};

/**
 * Create category (Admin)
 */
const createCategory = async (categoryData) => {
    // If parent is specified, verify it exists
    if (categoryData.parent) {
        const parent = await Category.findById(categoryData.parent);
        if (!parent) {
            throw new AppError('Parent category not found', 404);
        }
    }

    const category = await Category.create(categoryData);
    return category;
};

/**
 * Update category (Admin)
 */
const updateCategory = async (categoryId, updateData) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // Prevent setting parent to self
    if (updateData.parent && updateData.parent === categoryId) {
        throw new AppError('Category cannot be its own parent', 400);
    }

    // If parent is specified, verify it exists
    if (updateData.parent) {
        const parent = await Category.findById(updateData.parent);
        if (!parent) {
            throw new AppError('Parent category not found', 404);
        }
    }

    Object.assign(category, updateData);
    await category.save();

    return category;
};

/**
 * Delete category (Admin)
 */
const deleteCategory = async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // Delete image from Cloudinary
    if (category.image?.publicId) {
        await deleteImage(category.image.publicId);
    }

    await category.deleteOne();
    return { message: 'Category deleted successfully' };
};

module.exports = {
    getCategories,
    getAllCategoriesFlat,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
};
