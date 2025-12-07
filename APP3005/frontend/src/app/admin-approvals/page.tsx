import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { ApprovalCard } from '@/components/admin/atelier/ApprovalCard';
import { InspectionModal } from '@/components/admin/atelier/InspectionModal';
import { EmptyState } from '@/components/admin/atelier/EmptyState';
import { usePendingProducts, PendingProduct } from '@/hooks/useApprovals';
import { typography } from '@/constants/theme';

/**
 * Atelier Approval Page
 * Gallery-style masonry grid for reviewing pending products
 */
function AtelierApprovalPage() {
    const { data: products, isLoading, error } = usePendingProducts();
    const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (product: PendingProduct) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            <Sidebar />

            <main className="flex-1 ml-[280px] p-8">
                <div className="max-w-[1800px] mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1
                            className="text-4xl font-bold text-neutral-100 mb-2"
                            style={{ fontFamily: typography.fontSerif }}
                        >
                            Atelier Approval
                        </h1>
                        <p className="text-neutral-400">
                            Review and curate products for the collection
                        </p>
                    </motion.div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20">
                            <p className="text-red-400">Failed to load pending products</p>
                            <p className="text-neutral-500 text-sm mt-2">
                                {error instanceof Error ? error.message : 'Unknown error'}
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && products && products.length === 0 && (
                        <EmptyState />
                    )}

                    {!isLoading && !error && products && products.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {products.map((product, index) => (
                                <motion.div
                                    key={product.product_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <ApprovalCard
                                        product={product}
                                        onClick={() => handleCardClick(product)}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {!isLoading && products && products.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-center text-sm text-neutral-500"
                        >
                            {products.length} {products.length === 1 ? 'product' : 'products'} awaiting review
                        </motion.div>
                    )}
                </div>
            </main>

            <InspectionModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}

export default AtelierApprovalPage;
