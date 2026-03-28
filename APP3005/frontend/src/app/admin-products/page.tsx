import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Package, Search, Filter, Loader2, ChevronLeft, ChevronRight, Edit, CheckCircle, XCircle } from 'lucide-react';
import { typography } from '@/constants/theme';
import { useAdminProducts, useReviewAdminProduct } from '@/hooks/useAdminProducts';
import { useAdminCreators } from '@/hooks/useAdminCreators';
import { ProductEditModal } from '@/components/admin/products/ProductEditModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function AdminProductsPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [creatorFilter, setCreatorFilter] = useState('ALL');
    
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const [approveModalProduct, setApproveModalProduct] = useState<string | null>(null);
    const [rejectModalProduct, setRejectModalProduct] = useState<string | null>(null);
    const [rejectComment, setRejectComment] = useState('');

    const { data, isLoading, error } = useAdminProducts({
        page,
        limit: 15,
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        creator: creatorFilter === 'ALL' ? undefined : creatorFilter,
    });

    const { data: creatorsData } = useAdminCreators({ limit: 100 });
    const reviewProduct = useReviewAdminProduct();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPage(1);
    };

    const confirmApprove = () => {
        if (approveModalProduct) {
            reviewProduct.mutate(
                { productId: approveModalProduct, action: 'APPROVED' },
                { onSuccess: () => setApproveModalProduct(null) }
            );
        }
    };

    const confirmReject = () => {
        if (rejectModalProduct) {
            reviewProduct.mutate(
                { productId: rejectModalProduct, action: 'REJECTED', comment: rejectComment },
                { 
                    onSuccess: () => {
                        setRejectModalProduct(null);
                        setRejectComment('');
                    } 
                }
            );
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
            PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
            DRAFT: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.DRAFT}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            <Sidebar />

            <main className="flex-1 md:ml-[280px] p-4 pt-24 md:p-8 w-full max-w-[100vw] md:max-w-none overflow-x-hidden">
                <div className="mx-auto max-w-[1800px]">
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="w-8 h-8 md:w-10 md:h-10 text-[#D4AF37]" />
                                <h1
                                    className="text-2xl md:text-4xl font-bold text-neutral-100"
                                    style={{ fontFamily: typography.fontSerif }}
                                >
                                    Products Management
                                </h1>
                            </div>
                            <p className="text-sm md:text-base text-neutral-400">
                                Comprehensive control over all products: edit prices, commissions, and statuses.
                            </p>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-neutral-950 p-6 rounded-2xl border border-white/5 shadow-2xl mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search by title..."
                                        className="w-full pl-12 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    />
                                </div>
                            </form>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                                    <SelectTrigger className="w-full sm:w-[180px] h-11 bg-neutral-900 border-white/10 text-white focus:ring-[#D4AF37] focus:ring-1 focus:ring-offset-0">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={creatorFilter} onValueChange={(v) => { setCreatorFilter(v); setPage(1); }}>
                                    <SelectTrigger className="w-full sm:w-[200px] h-11 bg-neutral-900 border-white/10 text-white focus:ring-[#D4AF37] focus:ring-1 focus:ring-offset-0">
                                        <SelectValue placeholder="All Creators" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white max-h-[300px]">
                                        <SelectItem value="ALL">All Creators</SelectItem>
                                        {creatorsData?.creators.map((c: any) => (
                                            <SelectItem key={c.creator_id} value={c.creator_id}>
                                                {c.store_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-20">
                            <p className="text-red-500 mb-4">{(error as any).message || 'Failed to load products'}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-[#D4AF37] text-neutral-950 rounded-lg font-semibold hover:bg-[#F4D03F] transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Products Table */}
                    {!isLoading && !error && data?.products && (
                        <div className="bg-neutral-950 rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-900 border-b border-white/5">
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">Product</th>
                                            <th className="hidden md:table-cell px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">Creator</th>
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-right">Price</th>
                                            <th className="hidden lg:table-cell px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-right">Commission</th>
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-center">Status</th>
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.products.map((product) => (
                                            <tr key={product.product_id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                                            {product.thumbnail ? (
                                                                <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5 md:w-6 md:h-6 m-auto mt-2.5 md:mt-3 text-neutral-600" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-neutral-200 font-medium truncate max-w-[120px] md:max-w-[200px]">{product.title}</p>
                                                            <p className="text-neutral-500 text-xs md:text-sm truncate max-w-[120px] md:max-w-[200px]">{product.category}</p>
                                                            {/* Show creator info inline on mobile */}
                                                            <p className="md:hidden text-neutral-400 text-xs truncate max-w-[120px] mt-0.5">By {product.creator?.store_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <div className="text-neutral-300 font-medium">{product.creator?.store_name}</div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    <div className="text-neutral-300 font-medium text-sm md:text-base">₹{(product.price_cents / 100).toFixed(2)}</div>
                                                    {/* Show commission inline on mobile/tablet if needed, or hide if complex. Here we hide it natively for space */}
                                                </td>
                                                <td className="hidden lg:table-cell px-6 py-4 text-right">
                                                    <div className="text-neutral-400">{product.commission_percentage || 10}%</div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-center">
                                                    <StatusBadge status={product.status} />
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {product.status !== 'APPROVED' && (
                                                            <button
                                                                onClick={() => setApproveModalProduct(product.product_id)}
                                                                className="p-2 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {product.status !== 'REJECTED' && (
                                                            <button
                                                                onClick={() => {
                                                                    setRejectModalProduct(product.product_id);
                                                                    setRejectComment('');
                                                                }}
                                                                className="p-2 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEditProduct(product)}
                                                            className="p-2 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {data.products.length === 0 && (
                                <div className="p-8 text-center text-neutral-500">
                                    No products found matching filters.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {data?.pagination && data.pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-neutral-400 text-sm text-center sm:text-left">
                                Page {data.pagination.page} of {data.pagination.totalPages}
                                <span className="ml-2 block sm:inline">({data.pagination.total} total products)</span>
                            </span>
                            
                            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-neutral-950 border border-white/5 rounded-lg text-neutral-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!data.pagination.hasMore}
                                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-neutral-950 border border-white/5 rounded-lg text-neutral-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ProductEditModal
                isOpen={!!editProduct}
                onClose={() => setEditProduct(null)}
                product={editProduct}
            />

            {/* Approve Confirmation Modal */}
            <Dialog open={!!approveModalProduct} onOpenChange={() => setApproveModalProduct(null)}>
                <DialogContent className="bg-neutral-900 border-white/10 text-neutral-200 sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-[#D4AF37]">Approve Product</DialogTitle>
                        <DialogDescription className="text-neutral-400 pt-2 text-sm">
                            Are you sure you want to approve this product? It will become visible in the live collection immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button
                            type="button"
                            onClick={() => setApproveModalProduct(null)}
                            className="bg-transparent border border-white/20 hover:bg-white/10 text-white flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmApprove}
                            disabled={reviewProduct.isPending}
                            className="bg-green-500 hover:bg-green-600 text-white flex-1"
                        >
                            {reviewProduct.isPending ? 'Approving...' : 'Yes, Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Confirmation Modal with Comment input */}
            <Dialog open={!!rejectModalProduct} onOpenChange={() => setRejectModalProduct(null)}>
                <DialogContent className="bg-neutral-900 border-white/10 text-neutral-200 sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-red-400">Reject Product</DialogTitle>
                        <DialogDescription className="text-neutral-400 pt-2 text-sm">
                            Please provide a reason for rejecting this product. This feedback will be shared with the creator.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <textarea
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            placeholder="Reason for rejection (required)..."
                            className="w-full h-32 p-3 bg-neutral-950 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/50 resize-none"
                        />
                    </div>
                    <DialogFooter className="mt-4 flex gap-3">
                        <Button
                            type="button"
                            onClick={() => setRejectModalProduct(null)}
                            className="bg-transparent border border-white/20 hover:bg-white/10 text-white flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmReject}
                            disabled={!rejectComment.trim() || reviewProduct.isPending}
                            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex-1"
                        >
                            {reviewProduct.isPending ? 'Rejecting...' : 'Reject Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AdminProductsPage;
