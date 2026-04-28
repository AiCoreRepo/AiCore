import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Package, Search, Loader2, ChevronLeft, ChevronRight, Edit, AlertTriangle, CheckCircle, PackageOpen, PackageX, Settings2, Save } from 'lucide-react';
import { typography } from '@/constants/theme';
import { useAdminInventoryDashboard } from '@/hooks/useAdminInventory';
import { useAdminCreators } from '@/hooks/useAdminCreators';
import { StockEditModal } from '@/components/admin/inventory/StockEditModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_LOW_STOCK_THRESHOLD, DEFAULT_HIGH_STOCK_THRESHOLD } from '@/constants/inventory';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Map status to visual configs
const STATUS_CONFIGS: Record<string, { color: string; bg: string; icon: any; border: string }> = {
    'OUT_OF_STOCK': { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: PackageX },
    'LOW': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle },
    'OK': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle },
    'HIGH': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: PackageOpen },
};

function AdminInventoryPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [creatorFilter, setCreatorFilter] = useState('ALL');
    const { toast } = useToast();
    
    // Threshold config from local storage or fallback to constants
    const [lowThreshold, setLowThreshold] = useState(() => localStorage.getItem('inventoryLowThreshold') || DEFAULT_LOW_STOCK_THRESHOLD.toString());
    const [highThreshold, setHighThreshold] = useState(() => localStorage.getItem('inventoryHighThreshold') || DEFAULT_HIGH_STOCK_THRESHOLD.toString());

    const handleSaveThresholds = () => {
        localStorage.setItem('inventoryLowThreshold', lowThreshold);
        localStorage.setItem('inventoryHighThreshold', highThreshold);
        toast({
            title: 'Thresholds Saved',
            description: 'Your custom stock thresholds have been saved locally.',
        });
    };

    const [editStockModal, setEditStockModal] = useState<any | null>(null);

    const { data, isLoading, error } = useAdminInventoryDashboard({
        page,
        limit: 15,
        search: searchQuery || undefined,
        stock_status: statusFilter === 'ALL' ? undefined : statusFilter,
        creator_id: creatorFilter === 'ALL' ? undefined : creatorFilter,
        low_threshold: parseInt(lowThreshold) || DEFAULT_LOW_STOCK_THRESHOLD,
        high_threshold: parseInt(highThreshold) || DEFAULT_HIGH_STOCK_THRESHOLD,
    });

    const { data: creatorsData } = useAdminCreators({ limit: 100 });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPage(1);
    };

    const StockBadge = ({ label, isOverride }: { label: string, isOverride?: boolean }) => {
        const config = STATUS_CONFIGS[label] || STATUS_CONFIGS['OK'];
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${config.bg} ${config.color} ${config.border}`}>
                <Icon className="w-3.5 h-3.5" />
                {label.replace('_', ' ')}
                {isOverride && <span title="Manually Overridden"><Settings2 className="w-3 h-3 ml-1 opacity-70" /></span>}
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
                                    Inventory Management
                                </h1>
                            </div>
                            <p className="text-sm md:text-base text-neutral-400">
                                Monitor product stock levels, set custom thresholds, and prevent stockouts.
                            </p>
                        </div>
                    </div>

                    {/* Summary Stats Grid */}
                    {data?.summary && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            <div className="bg-neutral-950 p-5 rounded-2xl border border-white/5 shadow-lg">
                                <p className="text-neutral-500 text-sm font-medium mb-1">Total Products</p>
                                <p className="text-2xl font-bold text-white mb-2">{data.summary.total}</p>
                            </div>
                            <div className="bg-neutral-950 p-5 rounded-2xl border border-red-500/20 shadow-lg">
                                <p className="text-red-400/80 text-sm font-medium mb-1 flex items-center gap-2"><PackageX className="w-4 h-4"/> Out of Stock</p>
                                <p className="text-2xl font-bold text-red-500 mb-2">{data.summary.out_of_stock}</p>
                            </div>
                            <div className="bg-neutral-950 p-5 rounded-2xl border border-orange-500/20 shadow-lg">
                                <p className="text-orange-400/80 text-sm font-medium mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Low Stock</p>
                                <p className="text-2xl font-bold text-orange-400 mb-2">{data.summary.low}</p>
                            </div>
                            <div className="bg-neutral-950 p-5 rounded-2xl border border-green-500/20 shadow-lg">
                                <p className="text-green-400/80 text-sm font-medium mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Healthy Stock</p>
                                <p className="text-2xl font-bold text-green-400 mb-2">{data.summary.ok}</p>
                            </div>
                            <div className="bg-neutral-950 p-5 rounded-2xl border border-blue-500/20 shadow-lg hidden lg:block">
                                <p className="text-blue-400/80 text-sm font-medium mb-1 flex items-center gap-2"><PackageOpen className="w-4 h-4"/> High Stock</p>
                                <p className="text-2xl font-bold text-blue-400 mb-2">{data.summary.high}</p>
                            </div>
                        </div>
                    )}

                    {/* Filters & Search */}
                    <div className="bg-neutral-950 p-6 rounded-2xl border border-white/5 shadow-2xl mb-6">
                        <div className="flex flex-col xl:flex-row gap-6">
                            <div className="flex-1 flex flex-col md:flex-row gap-4">
                                <form onSubmit={handleSearch} className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                        <input
                                            type="text"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Search products or creators..."
                                            className="w-full pl-12 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                        />
                                    </div>
                                </form>
                                
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[160px] h-11 bg-neutral-900 border-white/10 text-white focus:ring-[#D4AF37] focus:ring-1 focus:ring-offset-0">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                            <SelectItem value="ALL">All Status</SelectItem>
                                            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                                            <SelectItem value="LOW">Low Stock</SelectItem>
                                            <SelectItem value="OK">Healthy Stock</SelectItem>
                                            <SelectItem value="HIGH">High Stock</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={creatorFilter} onValueChange={(v) => { setCreatorFilter(v); setPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[180px] h-11 bg-neutral-900 border-white/10 text-white focus:ring-[#D4AF37] focus:ring-1 focus:ring-offset-0">
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
                            
                            {/* Dynamic Threshold Configuration */}
                            <div className="flex flex-wrap gap-4 items-end bg-neutral-900/50 p-3 rounded-xl border border-white/5">
                                <div>
                                    <Label className="text-xs text-neutral-400 mb-1 block">Low Stock (≤)</Label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={lowThreshold} 
                                        onChange={(e) => setLowThreshold(e.target.value)}
                                        className="h-10 w-20 bg-neutral-900 border-white/10 !text-white focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                                    />
                                </div>
                                <div className="hidden sm:block text-neutral-600 pb-2">-</div>
                                <div>
                                    <Label className="text-xs text-neutral-400 mb-1 block">High Stock (≥)</Label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={highThreshold} 
                                        onChange={(e) => setHighThreshold(e.target.value)}
                                        className="h-10 w-20 bg-neutral-900 border-white/10 !text-white focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                                    />
                                </div>
                                <Button 
                                    onClick={handleSaveThresholds}
                                    variant="outline" 
                                    size="icon" 
                                    className="h-10 w-10 bg-neutral-950 border-white/10 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 text-white transition-all ml-2"
                                    title="Save set limits"
                                >
                                    <Save className="w-4 h-4" />
                                </Button>
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
                            <p className="text-red-500 mb-4">{(error as any).message || 'Failed to load inventory'}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-[#D4AF37] text-neutral-950 rounded-lg font-semibold hover:bg-[#F4D03F] transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Inventory Table */}
                    {!isLoading && !error && data?.products && (
                        <div className="bg-neutral-950 rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-900 border-b border-white/5">
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">Product</th>
                                            <th className="hidden md:table-cell px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">Creator</th>
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-right">Available Stock</th>
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-center">Status Label</th>
                                            <th className="px-4 md:px-6 py-4 text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.products.map((product: any) => (
                                            <tr key={product.product_id} className="hover:bg-white/[0.02] transition-colors group">
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
                                                            <p className="text-neutral-200 font-medium truncate max-w-[120px] md:max-w-[250px]">{product.title}</p>
                                                            <p className="md:hidden text-neutral-400 text-xs truncate max-w-[120px] mt-0.5">By {product.creator?.store_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <div className="text-neutral-300 text-sm">{product.creator?.store_name}</div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    <div className="text-neutral-100 font-mono font-bold text-lg">{product.inventory_count}</div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-center">
                                                    <StockBadge label={product.stock_label} isOverride={!!product.stock_label_override} />
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setEditStockModal(product)}
                                                        className="p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                                                        title="Update Stock"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {data.products.length === 0 && (
                                <div className="p-12 flex flex-col items-center justify-center text-center text-neutral-500">
                                    <PackageX className="w-12 h-12 mb-3 text-neutral-600 opacity-50" />
                                    <p>No products found matching the current filters.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {data?.pagination && data.pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-neutral-400 text-sm text-center sm:text-left">
                                Page {data.pagination.page} of {data.pagination.totalPages}
                                <span className="ml-2 block sm:inline">({data.pagination.total} items)</span>
                            </span>
                            
                            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-neutral-950 border border-white/5 rounded-lg text-neutral-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Prev
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

            <StockEditModal
                isOpen={!!editStockModal}
                onClose={() => setEditStockModal(null)}
                product={editStockModal}
            />
        </div>
    );
}

export default AdminInventoryPage;
