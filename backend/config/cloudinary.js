/**
 * Cloudinary Configuration
 * Handles image upload, optimization, and delivery
 * 
 * Features used:
 * - Automatic format optimization (f_auto)
 * - Quality optimization (q_auto)
 * - Responsive transformations
 */
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Use HTTPS
});

/**
 * Storage configuration for product images
 * - Stored in 'bivanhandicraft/products' folder
 * - Automatically optimized for web delivery
 */
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bivanhandicraft/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
            { quality: 'auto', fetch_format: 'auto' }, // Auto optimize
        ],
    },
});

/**
 * Storage configuration for user avatars
 * - Stored in 'bivanhandicraft/avatars' folder
 * - Cropped to square with face detection
 */
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bivanhandicraft/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    },
});

/**
 * Storage configuration for category images
 */
const categoryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bivanhandicraft/categories',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    },
});

// Multer upload instances
const uploadProductImages = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

const uploadCategoryImage = multer({
    storage: categoryStorage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

/**
 * Delete image from Cloudinary by public ID
 * @param {string} publicId - The public ID of the image
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

/**
 * Get optimized URL for an image
 * Uses Cloudinary's automatic optimization features
 * @param {string} publicId - The public ID of the image
 * @param {object} options - Transformation options
 */
const getOptimizedUrl = (publicId, options = {}) => {
    const defaultOptions = {
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
    };
    return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
    cloudinary,
    uploadProductImages,
    uploadAvatar,
    uploadCategoryImage,
    deleteImage,
    getOptimizedUrl,
};
