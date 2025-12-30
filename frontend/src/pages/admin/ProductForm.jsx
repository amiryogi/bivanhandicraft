/**
 * ProductForm Component
 * Create/Edit product form with variants and image management
 */
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { ImageUploader } from '../../components/admin';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductForm = ({ product, categories, onSuccess, onCancel }) => {
    const isEdit = Boolean(product);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        shortDescription: '',
        price: '',
        comparePrice: '',
        category: '',
        stock: '',
        sku: '',
        isFeatured: false,
        isActive: true,
        metaTitle: '',
        metaDescription: '',
    });

    // Size options preset
    const SIZE_OPTIONS = [
        'Small Size (0-1 yrs)',
        'Medium Size (1-4 yrs)',
        'Large Size (4-6 yrs)',
        'XL Size (6-8 yrs)',
        'XXL Size (8-10 yrs)',
    ];

    // Variants state
    const [hasVariants, setHasVariants] = useState(false);
    const [variants, setVariants] = useState([]);

    // ... (rest of simple states)

    // Initialize form with product data
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                shortDescription: product.shortDescription || '',
                price: product.price || '',
                comparePrice: product.comparePrice || '',
                category: product.category?._id || product.category || '',
                stock: product.stock || '',
                sku: product.sku || '',
                isFeatured: product.isFeatured || false,
                isActive: product.isActive !== false,
                metaTitle: product.metaTitle || '',
                metaDescription: product.metaDescription || '',
            });
            setVariants(product.variants || []);
            setExistingImages(product.images || []);
            // Sync hasVariants toggle with actual data
            setHasVariants(product.variants?.length > 0);
        }
    }, [product]);
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Form state
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});



    // Toggle Variants
    const handleHasVariantsChange = (checked) => {
        setHasVariants(checked);
        if (checked && variants.length === 0) {
            // Add default Size variant if checking
            handleAddVariant();
        }
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    // Validate form
    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (variants.length === 0 && (!formData.stock || parseInt(formData.stock) < 0)) {
            newErrors.stock = 'Stock is required when no variants';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Add new variant (flat structure)
    const handleAddVariant = () => {
        setVariants((prev) => [
            ...prev,
            {
                _id: `temp-${Date.now()}`,
                size: '',
                color: '',
                price: formData.price || 0,
                stock: 0,
                image: '',
            },
        ]);
    };

    // Update variant field
    const handleVariantChange = (index, field, value) => {
        setVariants((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: field === 'price' || field === 'stock' ? parseFloat(value) || 0 : value,
            };
            return updated;
        });
    };

    // Remove variant
    const handleRemoveVariant = (index) => {
        setVariants((prev) => prev.filter((_, idx) => idx !== index));
    };

    // Initialize/Duplicate variant from another
    const handleDuplicateVariant = (index) => {
        setVariants((prev) => {
            const original = prev[index];
            return [
                ...prev,
                {
                    ...original,
                    _id: `temp-${Date.now()}`,
                    stock: 0, // Reset stock for new variant
                },
            ];
        });
    };

    // Handle variant image upload
    const handleVariantImageUpload = async (index, file) => {
        // Local Preview
        const previewUrl = URL.createObjectURL(file);
        
        // Update local state with preview immediately
        setVariants((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], image: previewUrl, imageFile: file };
            return updated;
        });

        // Use temp ID check
        const variant = variants[index];
        const isNewVariant = variant._id.toString().startsWith('temp-');

        // Only upload immediately if product AND variant exist in DB (Edit Mode)
        if (product?._id && !isNewVariant) {
            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await adminAPI.uploadVariantImage(
                    product._id,
                    variant._id,
                    formData
                );

                const updatedProduct = response.data.data.product;
                const updatedVariant = updatedProduct.variants.find(v => v._id === variant._id);

                if (updatedVariant?.image) {
                     setVariants((prev) => {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], image: updatedVariant.image, imageFile: null };
                        return updated;
                    });
                    toast.success('Variant image uploaded');
                }
            } catch (error) {
                console.error('Variant image upload error:', error);
                toast.error('Failed to upload variant image');
            }
        }
    };

    // Handle new image upload
    const handleImageUpload = (files) => {
        const previews = files.map((file) => ({
            id: `new-${Date.now()}-${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            isPrimary: existingImages.length === 0 && newImages.length === 0,
        }));
        setNewImages((prev) => [...prev, ...previews]);
    };

    // Remove new image before upload
    const handleRemoveNewImage = (id) => {
        setNewImages((prev) => {
            const removed = prev.find((img) => img.id === id);
            if (removed?.preview) {
                URL.revokeObjectURL(removed.preview);
            }
            return prev.filter((img) => img.id !== id);
        });
    };

    // Set primary image
    const handleSetPrimary = (id) => {
        setExistingImages((prev) =>
            prev.map((img) => ({ ...img, isPrimary: img._id === id }))
        );
        setNewImages((prev) =>
            prev.map((img) => ({ ...img, isPrimary: img.id === id }))
        );
    };

    // Delete existing image
    const handleDeleteExistingImage = async (imageId) => {
        if (!product?._id) return;

        try {
            await adminAPI.deleteProductImage(product._id, imageId);
            setExistingImages((prev) => prev.filter((img) => img._id !== imageId));
            toast.success('Image deleted');
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // Prepare product data - clean up empty/undefined values
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock) || 0,
                isFeatured: formData.isFeatured,
                isActive: formData.isActive,
            };

            // Add optional fields only if they have values
            if (formData.shortDescription?.trim()) {
                productData.shortDescription = formData.shortDescription.trim();
            }
            if (formData.comparePrice && parseFloat(formData.comparePrice) > 0) {
                productData.comparePrice = parseFloat(formData.comparePrice);
            }
            if (formData.sku?.trim()) {
                productData.sku = formData.sku.trim();
            }
            if (formData.metaTitle?.trim()) {
                productData.metaTitle = formData.metaTitle.trim();
            }
            if (formData.metaDescription?.trim()) {
                productData.metaDescription = formData.metaDescription.trim();
            }

            // Add variants only if active and valid
            if (hasVariants) {
                const cleanVariants = variants
                    .filter((v) => v.size && v.color && v.price >= 0)
                    .map((v) => ({
                        size: v.size,
                        color: v.color.trim(),
                        price: parseFloat(v.price) || 0,
                        stock: parseInt(v.stock) || 0,
                        // If there is a pending file, don't send the blob URL. Send null.
                        // If no pending file, send existing image URL (or null).
                        image: v.imageFile ? null : (v.image || null),
                    }));

                if (cleanVariants.length > 0) {
                    productData.variants = cleanVariants;
                }
            } else {
                productData.variants = [];
            }

            let savedProduct;
            if (isEdit) {
                const response = await adminAPI.updateProduct(product._id, productData);
                savedProduct = response.data.data.product;
                toast.success('Product updated successfully');
            } else {
                const response = await adminAPI.createProduct(productData);
                savedProduct = response.data.data.product;
                toast.success('Product created successfully');
            }

            // Upload new images if any
            if (newImages.length > 0 && savedProduct._id) {
                setUploadingImages(true);
                const formDataImages = new FormData();
                newImages.forEach((img) => {
                    formDataImages.append('images', img.file);
                });
                await adminAPI.uploadProductImages(savedProduct._id, formDataImages);
            }

            // Upload pending variant images (Create Mode)
            // Filter variants that have a pending imageFile
            const variantsWithPendingImages = variants
                .map((v, index) => ({ ...v, index }))
                .filter(v => v.imageFile);

            if (variantsWithPendingImages.length > 0 && savedProduct._id) {
                const uploadToastId = toast.loading('Uploading variants...');
                
                // Match local variants to saved variants by index (assuming order is preserved)
                const savedVariants = savedProduct.variants || [];

                for (const pendingVar of variantsWithPendingImages) {
                    // Match by size and color string (trim both to be safe)
                    const savedVariant = savedVariants.find(
                        sv => sv.size === pendingVar.size && sv.color === pendingVar.color.trim()
                    );

                    console.log('Uploading image for variant:', pendingVar.size, pendingVar.color);
                    console.log('Matched saved variant:', savedVariant?._id);

                    if (savedVariant?._id) {
                        const formData = new FormData();
                        formData.append('image', pendingVar.imageFile);

                        try {
                            const uploadRes = await adminAPI.uploadVariantImage(
                                savedProduct._id,
                                savedVariant._id,
                                formData
                            );
                            console.log('Upload success:', uploadRes.data);
                        } catch (err) {
                            console.error('Failed to upload variant image', err);
                            toast.error(`Failed to upload image for ${pendingVar.color}`);
                        }
                    } else {
                        console.error('Could not find matching saved variant for:', pendingVar);
                    }
                }
                toast.dismiss(uploadToastId);
            }

            onSuccess();
        } catch (error) {
            console.error('Form error:', error);
            toast.error(error.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
            setUploadingImages(false);
        }
    };

    // Combine images for preview
    const allImages = [
        ...existingImages.map((img) => ({ ...img, id: img._id })),
        ...newImages,
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2">
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`input ${errors.name ? 'border-red-500' : ''}`}
                            placeholder="Enter product name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Short Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Short Description</label>
                        <input
                            type="text"
                            name="shortDescription"
                            value={formData.shortDescription}
                            onChange={handleChange}
                            className="input"
                            placeholder="Brief description for listings"
                            maxLength={200}
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`textarea ${errors.description ? 'border-red-500' : ''}`}
                            placeholder="Detailed product description"
                            rows={4}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2">
                    Pricing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Price (NPR) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className={`input ${errors.price ? 'border-red-500' : ''}`}
                            placeholder="0"
                            min="0"
                            step="0.01"
                        />
                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    {/* Compare Price */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Compare Price (NPR)</label>
                        <input
                            type="number"
                            name="comparePrice"
                            value={formData.comparePrice}
                            onChange={handleChange}
                            className="input"
                            placeholder="Original price (optional)"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-sm font-medium mb-1">SKU</label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            className="input"
                            placeholder="Stock keeping unit"
                        />
                    </div>
                </div>
            </div>

            {/* Organization */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2">
                    Organization
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`select ${errors.category ? 'border-red-500' : ''}`}
                        >
                            <option value="">Select category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.parent ? `${cat.parent.name} → ` : ''}{cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                        )}
                    </div>

                    {/* Stock (only if no variants) */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Stock {variants.length === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            className={`input ${errors.stock ? 'border-red-500' : ''}`}
                            placeholder={variants.length > 0 ? 'Managed per variant' : '0'}
                            min="0"
                            disabled={variants.length > 0}
                        />
                        {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                        {variants.length > 0 && (
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                Stock is managed per variant option
                            </p>
                        )}
                    </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isFeatured"
                            checked={formData.isFeatured}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                        />
                        <span className="text-sm">Featured Product</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                        />
                        <span className="text-sm">Active</span>
                    </label>
                </div>
            </div>

            {/* Variants */}
            <div className="space-y-4">
            {/* Variants */}
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                    <h3 className="font-semibold text-lg">Variants</h3>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <input
                                type="checkbox"
                                checked={hasVariants}
                                onChange={(e) => handleHasVariantsChange(e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                            />
                            <span className="text-sm font-medium">Enable Variants</span>
                        </label>
                    </div>
                </div>

                {hasVariants && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Headers */}
                        <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-[var(--color-text-muted)] border-b pb-2">
                            <div className="col-span-3">Size <span className="text-red-500">*</span></div>
                            <div className="col-span-3">Color <span className="text-red-500">*</span></div>
                            <div className="col-span-2">Price</div>
                            <div className="col-span-2">Stock</div>
                            <div className="col-span-2">Image</div>
                        </div>

                        {/* Variant List */}
                        {variants.map((variant, index) => (
                            <div
                                key={variant._id || index}
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none bg-gray-50 md:bg-transparent"
                            >
                                {/* Size */}
                                <div className="col-span-3">
                                    <label className="md:hidden text-xs font-medium mb-1 block">Size</label>
                                    <select
                                        value={variant.size}
                                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                        className="select w-full text-sm"
                                        required
                                    >
                                        <option value="">Select Size...</option>
                                        {SIZE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Color */}
                                <div className="col-span-3">
                                    <label className="md:hidden text-xs font-medium mb-1 block">Color</label>
                                    <input
                                        type="text"
                                        value={variant.color}
                                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                        className="input w-full text-sm"
                                        placeholder="Color (e.g. Red)"
                                        required
                                    />
                                </div>

                                {/* Price */}
                                <div className="col-span-2">
                                    <label className="md:hidden text-xs font-medium mb-1 block">Price</label>
                                    <input
                                        type="number"
                                        value={variant.price}
                                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                        className="input w-full text-sm"
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </div>

                                {/* Stock */}
                                <div className="col-span-2">
                                    <label className="md:hidden text-xs font-medium mb-1 block">Stock</label>
                                    <input
                                        type="number"
                                        value={variant.stock}
                                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                        className="input w-full text-sm"
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </div>

                                {/* Image & Actions */}
                                <div className="col-span-2 flex items-center gap-2">
                                    {variant.image ? (
                                        <div className="relative group">
                                            <img
                                                src={variant.image}
                                                alt="Variant"
                                                className="w-10 h-10 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleVariantChange(index, 'image', '')}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <div className="w-10 h-10 border border-dashed border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-gray-500">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleVariantImageUpload(index, file);
                                                }}
                                            />
                                        </label>
                                    )}

                                    <div className="flex ml-auto gap-1">
                                         <button
                                            type="button"
                                            onClick={() => handleDuplicateVariant(index)}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                                            title="Duplicate Variant"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariant(index)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                            title="Remove Variant"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-medium hover:underline mt-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Variant
                        </button>
                    </div>
                )}
            </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2">
                    Images
                </h3>

                <ImageUploader
                    images={allImages}
                    onUpload={handleImageUpload}
                    onDelete={(id) => {
                        // Check if it's an existing image or new
                        if (existingImages.find((img) => img._id === id)) {
                            handleDeleteExistingImage(id);
                        } else {
                            handleRemoveNewImage(id);
                        }
                    }}
                    onSetPrimary={handleSetPrimary}
                    uploading={uploadingImages}
                />
            </div>

            {/* SEO */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2">
                    SEO (Optional)
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Meta Title</label>
                        <input
                            type="text"
                            name="metaTitle"
                            value={formData.metaTitle}
                            onChange={handleChange}
                            className="input"
                            placeholder="Custom title for search engines"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Meta Description</label>
                        <textarea
                            name="metaDescription"
                            value={formData.metaDescription}
                            onChange={handleChange}
                            className="textarea"
                            placeholder="Custom description for search engines"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {uploadingImages ? 'Uploading Images...' : 'Saving...'}
                        </>
                    ) : (
                        <>{isEdit ? 'Update Product' : 'Create Product'}</>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
