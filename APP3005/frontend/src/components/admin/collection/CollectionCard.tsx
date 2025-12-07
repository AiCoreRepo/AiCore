import React, { useState } from 'react';
import { Star, Package, Eye, BadgeCheck, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApprovedProduct } from '@/hooks/useApprovedProducts';
import { useFeatureToggle, useStockUpdate, useProductDelete } from '@/hooks/useInventoryManagement';

interface CollectionCardProps {
    product: ApprovedProduct;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ product }) => {
    const [showStockEdit, setShowStockEdit] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [stockValue, setStockValue] = useState(product.inventory_count.toString());

    const featureToggle = useFeatureToggle();
    const stockUpdate = useStockUpdate();
    const productDelete = useProductDelete();

    const formatPrice = (cents: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(cents / 100);
    };

    const getStockStatus = () => {
        if (product.inventory_count === 0) return { label: 'Out of Stock', color: 'bg-red-500', width: '0%' };
        if (product.inventory_count < 5) return { label: 'Low Stock', color: 'bg-yellow-500', width: '33%' };
        if (product.inventory_count < 10) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
        return { label: 'In Stock', color: 'bg-green-500', width: '100%' };
    };

    const stockStatus = getStockStatus();

    const handleFeatureToggle = () => {
        featureToggle.mutate({
            productId: product.product_id,
            isFeatured: !product.is_featured,
        });
    };

    const handleStockUpdate = () => {
        const newStock = parseInt(stockValue, 10);
        if (!isNaN(newStock) && newStock >= 0) {
            stockUpdate.mutate({
                productId: product.product_id,
                inventoryCount: newStock,
            });
            setShowStockEdit(false);
        }
    };

    const handleDelete = () => {
        productDelete.mutate(product.product_id);
        setShowDeleteConfirm(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-800/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all duration-300"
        >
            {/* Image Section */}
            <div className="aspect-[3/4] bg-neutral-800 relative overflow-hidden group">
                {product.thumbnail ? (
                    <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-neutral-700" />
                    </div>
                )}

                {/* Featured Badge */}
                {product.is_featured && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#D4AF37] rounded-full flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-neutral-950 fill-neutral-950" />
                        <span className="text-xs font-bold text-neutral-950 uppercase">Featured</span>
                    </div>
                )}

                {/* No Stock Badge */}
                {product.inventory_count === 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-neutral-800 rounded-full">
                        <span className="text-xs font-bold text-neutral-400 uppercase">No Stock</span>
                    </div>
                )}

                {/* Stock Edit Popover */}
                {showStockEdit && (
                    <div className="absolute bottom-3 right-3 bg-neutral-900 border border-white/20 rounded-xl p-3 shadow-xl z-10">
                        <p className="text-xs text-neutral-400 mb-2">Update Stock</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={stockValue}
                                onChange={(e) => setStockValue(e.target.value)}
                                min="0"
                                className="w-20 px-2 py-1 bg-black/50 border border-white/10 rounded text-neutral-200 text-sm focus:outline-none focus:border-[#D4AF37]"
                            />
                            <button
                                onClick={handleStockUpdate}
                                disabled={stockUpdate.isPending}
                                className="px-3 py-1 bg-[#D4AF37] hover:bg-[#F4D03F] text-neutral-950 rounded text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="bg-neutral-900 border border-white/20 rounded-xl p-4 max-w-xs mx-4">
                            <h4 className="text-white font-bold mb-2">Remove Product?</h4>
                            <p className="text-neutral-400 text-sm mb-4">
                                This will remove "{product.title}" from The Collection.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-neutral-300 rounded text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={productDelete.isPending}
                                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                    {productDelete.isPending ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-3">
                {/* Title */}
                <h3 className="text-sm font-bold text-neutral-100 line-clamp-1 mb-1.5">
                    {product.title}
                </h3>

                {/* Price */}
                <p className="text-xl font-bold text-[#D4AF37] mb-2">
                    {formatPrice(product.price_cents, product.currency)}
                </p>

                {/* Stock Progress Bar */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-400">Stock: {product.inventory_count}</span>
                        <span className={`text-xs font-medium ${product.inventory_count === 0 ? 'text-red-500' :
                            product.inventory_count < 5 ? 'text-yellow-500' :
                                'text-green-500'
                            }`}>
                            {stockStatus.label}
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${stockStatus.color} transition-all duration-300`}
                            style={{ width: stockStatus.width }}
                        />
                    </div>
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-neutral-950 font-bold text-xs">
                        {product.creator.store_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                        {product.creator.store_name}
                        {product.creator.verified && (
                            <BadgeCheck className="w-3 h-3 text-[#D4AF37]" />
                        )}
                    </span>
                </div>

                {/* Category & Views */}
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                    <span>{product.category || 'Uncategorized'}</span>
                    <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {product.views}
                    </span>
                </div>

                {/* Action Buttons Bar */}
                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    {/* Feature Toggle */}
                    <button
                        onClick={handleFeatureToggle}
                        disabled={featureToggle.isPending}
                        className={`flex-1 px-2.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-medium ${product.is_featured
                            ? 'bg-[#D4AF37] hover:bg-[#F4D03F] text-neutral-950'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
                            }`}
                    >
                        <Star className={`w-3.5 h-3.5 ${product.is_featured ? 'fill-neutral-950' : ''}`} />
                        <span className="hidden sm:inline">{product.is_featured ? 'Featured' : 'Feature'}</span>
                    </button>

                    {/* Stock Edit */}
                    <button
                        onClick={() => setShowStockEdit(!showStockEdit)}
                        className="px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition-all"
                        title="Edit Stock"
                    >
                        <Package className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-2.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all"
                        title="Remove"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
