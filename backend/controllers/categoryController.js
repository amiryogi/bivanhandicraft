/**
 * Category Controller
 * Handles HTTP requests for categories
 */
const categoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all categories (tree structure)
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getCategories();

    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: { categories },
    });
});

/**
 * @desc    Get all categories (flat list)
 * @route   GET /api/v1/categories/all
 * @access  Public
 */
const getAllCategoriesFlat = asyncHandler(async (req, res) => {
    const categories = await categoryService.getAllCategoriesFlat();

    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: { categories },
    });
});

/**
 * @desc    Get single category
 * @route   GET /api/v1/categories/:slug
 * @access  Public
 */
const getCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);

    res.status(200).json({
        status: 'success',
        data: { category },
    });
});

/**
 * @desc    Create category (Admin)
 * @route   POST /api/v1/admin/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: { category },
    });
});

/**
 * @desc    Update category (Admin)
 * @route   PUT /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);

    res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: { category },
    });
});

/**
 * @desc    Delete category (Admin)
 * @route   DELETE /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);

    res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully',
    });
});

module.exports = {
    getCategories,
    getAllCategoriesFlat,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
};
