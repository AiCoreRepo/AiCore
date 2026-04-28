import { useState, useMemo } from "react";
import { Filter, ArrowUpDown, Check } from "lucide-react";
import ProductCard from "./ProductCard";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UploadsGridProps {
    uploads: any[];
    onEdit: (product: any) => void;
    onDelete: (product: any) => void;
    onPublish?: (productId: string) => void;
}

type FilterStatus = 'all' | 'active' | 'pending' | 'draft' | 'rejected';
type SortOrder = 'newest' | 'oldest' | 'price-high' | 'price-low';

const UploadsGrid = ({ uploads, onEdit, onDelete, onPublish }: UploadsGridProps) => {
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

    const filteredAndSortedUploads = useMemo(() => {
        let result = [...uploads];

        // Filter
        if (filterStatus !== 'all') {
            result = result.filter(item => {
                switch (filterStatus) {
                    case 'active':
                        return item.status === 'Active';
                    case 'pending':
                        return item.status === 'Pending';
                    case 'draft':
                        return item.status === 'Draft';
                    case 'rejected':
                        return item.status === 'Rejected';
                    default:
                        return true;
                }
            });
        }

        // Sort
        result.sort((a, b) => {
            switch (sortOrder) {
                case 'price-high':
                    return (parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0) - (parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0);
                case 'price-low':
                    return (parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0) - (parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0);
                case 'oldest':
                    // Assuming items have an id or date, if not, relying on index (which is stable for original array)
                    // If backend sends date, use it. For now, assuming original order is "newest" or "oldest" based on API.
                    // If API returns newest first (common), then reversing gives oldest first.
                    // However, we don't have a reliable date field in the mapped props shown in page.tsx.
                    // We'll assume the input array is "newest first" by default.
                    return 1; // Reverse order for oldest
                case 'newest':
                default:
                    return -1; // Keep original order (assuming newest first)
            }
        });

        // Fix for simple reverse if no date field:
        if (sortOrder === 'oldest') {
            return result.reverse();
        }

        return result;
    }, [uploads, filterStatus, sortOrder]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">Uploads</h3>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={`flex items-center gap-2 hover:text-foreground ${filterStatus !== 'all' ? 'text-luxury-gold' : 'text-muted-foreground'}`}>
                                <span>Collection Gallery</span>
                                <div className="relative">
                                    <Filter size={18} />
                                    {filterStatus !== 'all' && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-luxury-gold rounded-full" />
                                    )}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            side="bottom"
                            collisionPadding={10}
                            className="w-56 bg-[#1c1917] backdrop-blur-sm border border-luxury-gold/20 shadow-xl rounded-xl p-1"
                        >
                            <DropdownMenuItem
                                onClick={() => {
                                    setFilterStatus('all');
                                    setSortOrder('newest');
                                }}
                                className="text-stone-400 hover:text-stone-200 focus:text-stone-200 focus:bg-white/5 cursor-pointer rounded-lg my-0.5"
                            >
                                Reset Filters
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-luxury-gold/10 my-1" />
                            <DropdownMenuLabel className="text-luxury-gold text-xs uppercase tracking-wider font-medium px-2 py-1.5">Filter by Status</DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus('all')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    All {filterStatus === 'all' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus(prev => prev === 'active' ? 'all' : 'active')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Active {filterStatus === 'active' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus(prev => prev === 'pending' ? 'all' : 'pending')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Pending {filterStatus === 'pending' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus(prev => prev === 'draft' ? 'all' : 'draft')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Draft {filterStatus === 'draft' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus(prev => prev === 'rejected' ? 'all' : 'rejected')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Rejected {filterStatus === 'rejected' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-luxury-gold/10 my-1" />
                            <DropdownMenuLabel className="text-luxury-gold text-xs uppercase tracking-wider font-medium px-2 py-1.5">Sort by</DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={() => setSortOrder('newest')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Newest First {sortOrder === 'newest' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortOrder('oldest')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Oldest First {sortOrder === 'oldest' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortOrder('price-high')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Price: High to Low {sortOrder === 'price-high' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortOrder('price-low')}
                                    className="justify-between cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                                >
                                    Price: Low to High {sortOrder === 'price-low' && <Check size={14} className="text-luxury-gold" />}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                {filteredAndSortedUploads.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No products found matching your filter.
                    </div>
                ) : (
                    filteredAndSortedUploads.map((product) => (
                        <ProductCard
                            key={product.product_id || product.id}
                            product_id={product.product_id}
                            image={product.image}
                            images={product.images}
                            title={product.name}
                            description={product.description}
                            tags={product.tags}
                            revenue={product.price}
                            status={product.status}
                            isNew={product.isNew}
                            stats={product.stats}
                            onEdit={() => onEdit(product)}
                            onDelete={() => onDelete(product)}
                            onPublish={onPublish ? () => onPublish(product.product_id) : undefined}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default UploadsGrid;
