import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Upload, Package, CheckCircle, XCircle, Loader2, Plus, Image as ImageIcon } from 'lucide-react';

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

const BulkUploadPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<ProductFormData[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);

    const handleAddProduct = () => {
        if (products.length >= 10) {
            alert('Maximum 10 products allowed per bulk upload');
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
        // Validation
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
            // Convert images to base64
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

            const response = await fetch(`${API_BASE_URL}/api/products/bulk-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ products: productsData }),
            });

            const result = await response.json();
            setUploadResults(result);

            if (result.success_count > 0) {
                alert(`Successfully uploaded ${result.success_count} products!`);
                setProducts([]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload products. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F0E6 0%, #FFF8E7 50%, #F5F0E6 100%)' }}>
            <Navbar />

            <main className="pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Upload className="w-10 h-10 text-gold" />
                            <h1 className="text-4xl font-serif font-bold text-charcoal">
                                Bulk Product Upload
                            </h1>
                        </div>
                        <p className="text-lg text-charcoal/70">
                            Upload up to 10 products at once. All products will be saved as drafts for admin approval.
                        </p>
                    </div>

                    {/* Add Product Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleAddProduct}
                            disabled={products.length >= 10}
                            className="btn-gold-glow flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Product ({products.length}/10)
                        </button>
                    </div>

                    {/* Products List */}
                    <div className="space-y-6">
                        {products.map((product, index) => (
                            <div key={index} className="glass-panel rounded-2xl p-6 border-2 border-gold/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                                        <Package className="w-5 h-5 text-gold" />
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
                                        <label className="block text-sm font-medium text-charcoal mb-2">
                                            Product Image *
                                        </label>
                                        <div className="relative">
                                            {product.image_preview ? (
                                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gold/30">
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
                                                <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-gold/40 rounded-lg cursor-pointer hover:border-gold transition-colors bg-ivory/30">
                                                    <ImageIcon className="w-12 h-12 text-gold/50 mb-2" />
                                                    <span className="text-sm text-charcoal/60">Click to upload image</span>
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
                                            <label className="block text-sm font-medium text-charcoal mb-1">
                                                Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={product.title}
                                                onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gold/20 focus:border-gold outline-none"
                                                placeholder="Product title"
                                            />
                                        </div>

                                        {/* Category & Price */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal mb-1">
                                                    Category
                                                </label>
                                                <select
                                                    value={product.category}
                                                    onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border-2 border-gold/20 focus:border-gold outline-none"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal mb-1">
                                                    Price (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={product.price_cents / 100}
                                                    onChange={(e) => handleFieldChange(index, 'price_cents', parseFloat(e.target.value) * 100)}
                                                    className="w-full px-4 py-2 rounded-lg border-2 border-gold/20 focus:border-gold outline-none"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={product.description}
                                                onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gold/20 focus:border-gold outline-none resize-none"
                                                rows={3}
                                                placeholder="Product description"
                                            />
                                        </div>

                                        {/* Occasions */}
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-2">
                                                Occasions
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {occasions.map(occasion => (
                                                    <button
                                                        key={occasion}
                                                        type="button"
                                                        onClick={() => toggleArrayField(index, 'occasions', occasion)}
                                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${product.occasions.includes(occasion)
                                                                ? 'bg-gold text-white'
                                                                : 'bg-ivory border border-gold/30 text-charcoal hover:border-gold'
                                                            }`}
                                                    >
                                                        {occasion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sizes */}
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-2">
                                                Sizes
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {sizes.map(size => (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() => toggleArrayField(index, 'sizes', size)}
                                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${product.sizes.includes(size)
                                                                ? 'bg-gold text-white'
                                                                : 'bg-ivory border border-gold/30 text-charcoal hover:border-gold'
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
                                disabled={uploading}
                                className="btn-gold-glow flex items-center gap-2 px-8 py-4 text-lg"
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
                        <div className="mt-8 glass-panel rounded-2xl p-6 border-2 border-gold/30">
                            <h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                Upload Results
                            </h3>
                            <div className="space-y-2">
                                <p className="text-charcoal">
                                    <span className="font-semibold text-green-600">Success:</span> {uploadResults.success_count} products
                                </p>
                                {uploadResults.fail_count > 0 && (
                                    <p className="text-charcoal">
                                        <span className="font-semibold text-red-600">Failed:</span> {uploadResults.fail_count} products
                                    </p>
                                )}
                                <p className="text-sm text-charcoal/70 mt-4">
                                    {uploadResults.message}
                                </p>
                                {uploadResults.errors && uploadResults.errors.length > 0 && (
                                    <div className="mt-4">
                                        <p className="font-semibold text-red-600 mb-2">Errors:</p>
                                        <ul className="list-disc list-inside text-sm text-charcoal/70">
                                            {uploadResults.errors.map((error: string, i: number) => (
                                                <li key={i}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BulkUploadPage;
