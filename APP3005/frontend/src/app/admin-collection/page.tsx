import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { ShoppingBag, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { typography } from '@/constants/theme';
import { useApprovedProducts } from '@/hooks/useApprovedProducts';
import { InventoryStats } from '@/components/admin/collection/InventoryStats';
import { CollectionCard } from '@/components/admin/collection/CollectionCard';
import { motion } from 'framer-motion';

/**
 * The Collection Page
 * Microservice 1 (Consumer): The Showroom
 * Live inventory management for approved products
 */
function CollectionPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const { data, isLoading, error } = useApprovedProducts(page, searchQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        // Auto-search after typing
        if (value.length === 0 || value.length >= 2) {
            setSearchQuery(value);
            setPage(1);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            <Sidebar />

            <main className="flex-1 ml-[280px] p-8">
                <div className="max-w-[1800px] mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <ShoppingBag className="w-10 h-10 text-[#D4AF37]" />
                            <h1
                                className="text-4xl font-bold text-neutral-100"
                                style={{ fontFamily: typography.fontSerif }}
                            >
                                The Collection
                            </h1>
                        </div>
                        <p className="text-neutral-400">
                            Live inventory management • Curate featured items • Monitor stock levels
                        </p>
                    </div>

                    {/* Stats Dashboard */}
                    {data?.stats && <InventoryStats stats={data.stats} isLoading={isLoading} />}

                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search by title, creator, or category..."
                                className="w-full pl-12 pr-24 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#D4AF37] hover:bg-[#F4D03F] text-neutral-950 rounded-lg text-sm font-bold transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-20">
                            <p className="text-red-500 mb-4">Failed to load products</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-[#D4AF37] text-neutral-950 rounded-lg font-semibold hover:bg-[#F4D03F] transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && data?.products.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                <ShoppingBag className="w-12 h-12 text-[#D4AF37]" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-100 mb-3">
                                {searchQuery ? 'No products found' : 'The Collection is Empty'}
                            </h2>
                            <p className="text-neutral-400 max-w-md mx-auto">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Approved products will appear here once creators submit their designs'}
                            </p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!isLoading && !error && data && data.products.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {data.products.map((product) => (
                                    <CollectionCard key={product.product_id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {data.pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-neutral-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>

                                    <span className="text-neutral-400">
                                        Page {page} of {data.pagination.totalPages}
                                    </span>

                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={!data.pagination.hasMore}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-neutral-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default CollectionPage;
