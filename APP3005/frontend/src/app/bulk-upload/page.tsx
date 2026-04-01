import React, { useEffect, useState } from 'react';
import { Upload, Package, XCircle, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { getDashboardMetrics } from '@/lib/api';

interface ProductFormData {
    title: string;
    category: string;
    description: string;
    price_cents: number;
    occasions: string[];
    body_shapes: string[];
    skin_tones: string[];
    sizes: string[];
    image_file: File | null;
    image_preview: string;
}

const occasions = ['Formal', 'Party', 'Wedding', 'Casual luxury', 'Resort'];
const bodyShapes = ['Rectangle', 'Hourglass', 'Pear Shape', 'Apple Shape', 'Inverted Triangle'];
const skinTones = ['Light', 'Medium', 'Dusky', 'Deep'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const categories = ['Dress', 'Shirt', 'Pants', 'Skirt', 'Jacket', 'Accessories'];
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const MAX_PRODUCTS_PER_BULK_UPLOAD = 10;
const DEFAULT_CREATOR_PRODUCT_LIMIT = 30;

const BulkUploadPage: React.FC = () => {
    const [products, setProducts] = useState<ProductFormData[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);
    const [remainingSlots, setRemainingSlots] = useState(DEFAULT_CREATOR_PRODUCT_LIMIT);
    const [productLimit, setProductLimit] = useState(DEFAULT_CREATOR_PRODUCT_LIMIT);
    const [capacityLoading, setCapacityLoading] = useState(true);

    const maxProductsThisUpload = Math.min(MAX_PRODUCTS_PER_BULK_UPLOAD, Math.max(remainingSlots, 0));
    const hasReachedCreatorLimit = remainingSlots <= 0;

    useEffect(() => {
        void loadCreatorCapacity();
    }, []);

    const loadCreatorCapacity = async () => {
        try {
            const metrics = await getDashboardMetrics();
            const nextProductLimit = typeof metrics.productLimit === 'number'
                ? metrics.productLimit
                : DEFAULT_CREATOR_PRODUCT_LIMIT;
            const nextRemainingSlots = typeof metrics.remainingSlots === 'number'
                ? Math.max(metrics.remainingSlots, 0)
                : DEFAULT_CREATOR_PRODUCT_LIMIT;

            setProductLimit(nextProductLimit);
            setRemainingSlots(nextRemainingSlots);
        } catch (error) {
            console.error('Failed to load creator capacity:', error);
        } finally {
            setCapacityLoading(false);
        }
    };

    const handleAddProduct = () => {
        if (hasReachedCreatorLimit) {
            alert(`You have already used all ${productLimit} collection slots for your creator account.`);
            return;
        }

        if (products.length >= maxProductsThisUpload) {
            if (remainingSlots < MAX_PRODUCTS_PER_BULK_UPLOAD) {
                alert(`You only have ${remainingSlots} collection slot${remainingSlots === 1 ? '' : 's'} remaining out of ${productLimit}.`);
            } else {
                alert(`Maximum ${MAX_PRODUCTS_PER_BULK_UPLOAD} products allowed per bulk upload`);
            }
            return;
        }

        setProducts([
            ...products,
            {
                title: '',
                category: 'Dress',
                description: '',
                price_cents: 5999,
                occasions: [],
                body_shapes: [],
                skin_tones: [],
                sizes: [],
                image_file: null,
                image_preview: '',
            },
        ]);
    };

    const handleRemoveProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleImageSelect = (index: number, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const updatedProducts = [...products];
            updatedProducts[index].image_file = file;
            updatedProducts[index].image_preview = reader.result as string;
            setProducts(updatedProducts);
        };
        reader.readAsDataURL(file);
    };

    const handleFieldChange = (index: number, field: keyof ProductFormData, value: any) => {
        const updatedProducts = [...products];
        updatedProducts[index] = { ...updatedProducts[index], [field]: value };
        setProducts(updatedProducts);
    };

    const toggleArrayField = (index: number, field: 'occasions' | 'body_shapes' | 'skin_tones' | 'sizes', value: string) => {
        const updatedProducts = [...products];
        const currentArray = updatedProducts[index][field];

        if (currentArray.includes(value)) {
            updatedProducts[index][field] = currentArray.filter(v => v !== value);
        } else {
            updatedProducts[index][field] = [...currentArray, value];
        }

        setProducts(updatedProducts);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleBulkUpload = async () => {
        if (hasReachedCreatorLimit) {
            alert(`You have reached your ${productLimit}-item collection limit. Delete an existing item before uploading a new one.`);
            return;
        }

        if (products.length > remainingSlots) {
            alert(`This upload exceeds your remaining ${remainingSlots} collection slot${remainingSlots === 1 ? '' : 's'}.`);
            return;
        }

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (!product.title || !product.image_file) {
                alert(`Product ${i + 1}: Title and image are required`);
                return;
            }
        }

        setUploading(true);
        setUploadResults(null);

        try {
            const productsData = await Promise.all(
                products.map(async (product) => ({
                    title: product.title,
                    category: product.category,
                    description: product.description,
                    price_cents: product.price_cents,
                    image_base64: await fileToBase64(product.image_file!),
                    occasions: product.occasions,
                    body_shapes: product.body_shapes,
                    skin_tones: product.skin_tones,
                    sizes: product.sizes,
                }))
            );

            console.log('Uploading products:', productsData);

            const response = await fetch(`${API_BASE_URL}/api/products/bulk-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({ products: productsData }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', errorText);
                let errorMessage = 'Upload failed';

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorText;
                } catch {
                    errorMessage = errorText;
                }

                alert(`Upload failed: ${errorMessage}`);
                setUploadResults({
                    success_count: 0,
                    fail_count: products.length,
                    errors: [errorMessage],
                    message: 'Upload failed'
                });
                await loadCreatorCapacity();
                return;
            }

            const result = await response.json();
            console.log('Upload result:', result);
            setUploadResults(result);
            await loadCreatorCapacity();

            if (result.success_count > 0) {
                alert(`Successfully uploaded ${result.success_count} products! They are saved as DRAFT and need admin approval.`);
                setProducts([]);
            } else if (result.fail_count > 0) {
                alert(`Upload failed for all products. Check the results below for details.`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Failed to upload products: ${error.message}`);
            setUploadResults({
                success_count: 0,
                fail_count: products.length,
                errors: [error.message],
                message: 'Upload failed due to network error'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Upload className="w-8 h-8 text-luxury-gold" />
                    <h1 className="text-3xl font-serif font-bold text-foreground">
                        Bulk Product Upload
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Upload up to {MAX_PRODUCTS_PER_BULK_UPLOAD} products at once, with a total collection limit of {productLimit} items per creator.
                </p>
            </div>

            <div className="mb-6 rounded-lg border border-luxury-gold/30 bg-luxury-gold/5 p-4">
                <p className="text-sm font-medium text-foreground">
                    {capacityLoading
                        ? 'Checking creator upload capacity...'
                        : `Collection capacity: ${productLimit - remainingSlots}/${productLimit} used. ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} remaining.`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {hasReachedCreatorLimit
                        ? 'You cannot add more collection items until one of your existing products is removed.'
                        : `You can add up to ${maxProductsThisUpload} product${maxProductsThisUpload === 1 ? '' : 's'} in this bulk upload.`}
                </p>
            </div>

            {/* Add Product Button */}
            <div className="mb-6">
                <button
                    onClick={handleAddProduct}
                    disabled={capacityLoading || hasReachedCreatorLimit || products.length >= maxProductsThisUpload}
                    className="px-6 py-3 bg-luxury-gold text-luxury-black rounded-lg font-medium hover:bg-luxury-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Product ({products.length}/{maxProductsThisUpload})
                </button>
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                    <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                        No Products Added Yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        Click "Add Product" above to start adding products for bulk upload
                    </p>
                    <button
                        onClick={handleAddProduct}
                        disabled={capacityLoading || hasReachedCreatorLimit}
                        className="px-6 py-3 bg-luxury-gold text-luxury-black rounded-lg font-medium hover:bg-luxury-gold/90 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First Product
                    </button>
                </div>
            )}

            {/* Products List */}
            <div className="space-y-6">
                {products.map((product, index) => (
                    <div key={index} className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                <Package className="w-5 h-5 text-luxury-gold" />
                                Product {index + 1}
                            </h3>
                            <button
                                onClick={() => handleRemoveProduct(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Image */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Product Image *
                                </label>
                                <div className="relative">
                                    {product.image_preview ? (
                                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-luxury-gold/30">
                                            <img
                                                src={product.image_preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updatedProducts = [...products];
                                                    updatedProducts[index].image_file = null;
                                                    updatedProducts[index].image_preview = '';
                                                    setProducts(updatedProducts);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-luxury-gold/40 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors bg-muted/30">
                                            <ImageIcon className="w-12 h-12 text-luxury-gold/50 mb-2" />
                                            <span className="text-sm text-muted-foreground">Click to upload image</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageSelect(index, file);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Details */}
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={product.title}
                                        onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:border-luxury-gold outline-none"
                                        placeholder="Product title"
                                    />
                                </div>

                                {/* Category & Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={product.category}
                                            onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:border-luxury-gold outline-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={product.price_cents / 100}
                                            onChange={(e) => handleFieldChange(index, 'price_cents', parseFloat(e.target.value) * 100)}
                                            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:border-luxury-gold outline-none"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={product.description}
                                        onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:border-luxury-gold outline-none resize-none"
                                        rows={3}
                                        placeholder="Product description"
                                    />
                                </div>

                                {/* Occasions */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Occasions
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {occasions.map(occasion => (
                                            <button
                                                key={occasion}
                                                type="button"
                                                onClick={() => toggleArrayField(index, 'occasions', occasion)}
                                                className={`px-3 py-1 rounded-full text-sm transition-colors ${product.occasions.includes(occasion)
                                                    ? 'bg-luxury-gold text-luxury-black'
                                                    : 'bg-muted border border-border text-foreground hover:border-luxury-gold'
                                                    }`}
                                            >
                                                {occasion}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Sizes
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map(size => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => toggleArrayField(index, 'sizes', size)}
                                                className={`px-3 py-1 rounded-full text-sm transition-colors ${product.sizes.includes(size)
                                                    ? 'bg-luxury-gold text-luxury-black'
                                                    : 'bg-muted border border-border text-foreground hover:border-luxury-gold'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Button */}
            {products.length > 0 && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleBulkUpload}
                        disabled={uploading || hasReachedCreatorLimit || products.length > remainingSlots}
                        className="px-8 py-4 bg-luxury-gold text-luxury-black rounded-lg font-medium text-lg hover:bg-luxury-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload {products.length} Product{products.length > 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
                <div className="mt-8 bg-card border border-border rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                        Upload Results
                    </h3>
                    <div className="space-y-2">
                        <p className="text-foreground">
                            <span className="font-semibold text-green-600">Success:</span> {uploadResults.success_count} products
                        </p>
                        {uploadResults.fail_count > 0 && (
                            <p className="text-foreground">
                                <span className="font-semibold text-red-600">Failed:</span> {uploadResults.fail_count} products
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-4">
                            {uploadResults.message}
                        </p>

                        {/* Show errors if any */}
                        {uploadResults.errors && uploadResults.errors.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="font-semibold text-red-800 mb-2">Errors:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {uploadResults.errors.map((error: string, index: number) => (
                                        <li key={index} className="text-sm text-red-700">{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Show product IDs if successful */}
                        {uploadResults.product_ids && uploadResults.product_ids.length > 0 && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="font-semibold text-green-800 mb-2">
                                    Created Products (DRAFT - Pending Admin Approval):
                                </p>
                                <p className="text-sm text-green-700">
                                    {uploadResults.product_ids.length} product(s) created successfully
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkUploadPage;
