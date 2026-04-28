import React, { memo, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Package,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
} from 'lucide-react';
import { useAdminCreatorProducts } from '@/hooks/useAdminCreators';
import { CreatorProduct } from '@/api/admin-creators.api';
import { PRODUCT_STATUS_BADGE } from '@/constants/creator-management.constants';
import { ProductPreviewModal } from '@/components/admin/creators/ProductPreviewModal';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/cn';

interface Props {
  creatorId: string;
}

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'ARCHIVED', label: 'Archived' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'price_asc', label: 'Price: Low → High' },
  { key: 'revenue_desc', label: 'Revenue: High → Low' },
];

const PAGE_SIZES = [10, 20, 50];

const formatINR = (cents: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100);

// ── Product Row ───────────────────────────────────────────────────────────────

const ProductRow = memo(({
  product,
  onView,
}: {
  product: CreatorProduct;
  onView: (p: CreatorProduct) => void;
}) => {
  const badge = PRODUCT_STATUS_BADGE[product.status as keyof typeof PRODUCT_STATUS_BADGE];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onView(product)}
      className="flex items-center gap-3 bg-black/20 rounded-xl border border-white/10 p-3 hover:border-[#D4AF37]/40 hover:bg-white/[0.03] cursor-pointer transition-all group"
    >
      {/* Thumbnail */}
      {product.thumbnail ? (
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10">
          <Package className="w-5 h-5 text-neutral-600" />
        </div>
      )}

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-100 truncate group-hover:text-[#D4AF37] transition-colors">
          {product.title}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">
          {product.category ?? 'Uncategorized'} &middot; {formatINR(product.price_cents)}
        </p>
        <p className="text-xs text-neutral-600 mt-0.5">
          Stock: {product.inventory_count}
        </p>
      </div>

      {/* Revenue — hidden on mobile */}
      <div className="hidden sm:flex flex-col items-end flex-shrink-0 pr-4 border-r border-white/10 min-w-[90px]">
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-0.5">
          Revenue
        </span>
        <span className="text-sm font-bold text-emerald-400">
          {product.sales?.revenue_formatted ?? formatINR(product.sales?.revenue_generated || 0)}
        </span>
        <span className="text-xs text-neutral-500">
          {product.sales?.units_sold || 0} {product.sales?.units_sold === 1 ? 'unit' : 'units'}
        </span>
      </div>

      {/* Status + Meta */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {badge && (
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', badge.className)}>
            {badge.label}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-neutral-500">
          <Eye className="w-3 h-3" />
          <span className="text-[10px]">{product.views}</span>
          {product.is_featured && <Star className="w-3 h-3 text-[#D4AF37]" />}
        </div>
      </div>
    </motion.div>
  );
});
ProductRow.displayName = 'ProductRow';

// ── Panel ─────────────────────────────────────────────────────────────────────

export const CreatorProductsPanel = memo<Props>(({ creatorId }) => {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<CreatorProduct | null>(null);

  const debouncedSearch = useDebounce(searchInput, 350);

  const { data, isLoading, isFetching, error } = useAdminCreatorProducts(creatorId, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit: pageSize,
  });

  const products = useMemo(() => {
    if (!data?.products) return [];
    let list = [...data.products];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }

    switch (sortKey) {
      case 'oldest':
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_desc':
        list.sort((a, b) => b.price_cents - a.price_cents);
        break;
      case 'price_asc':
        list.sort((a, b) => a.price_cents - b.price_cents);
        break;
      case 'revenue_desc':
        list.sort((a, b) => (b.sales?.revenue_generated ?? 0) - (a.sales?.revenue_generated ?? 0));
        break;
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [data?.products, debouncedSearch, sortKey]);

  const handleStatusChange = useCallback((s: string) => {
    setStatusFilter(s);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((s: number) => {
    setPageSize(s);
    setPage(1);
  }, []);

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-4">

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, category or description…"
          className="w-full pl-10 pr-9 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Filters Row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <SlidersHorizontal className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleStatusChange(f.key)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200',
                statusFilter === f.key
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                  : 'text-neutral-400 border-white/10 hover:border-white/20 hover:text-neutral-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort + Page size */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-300 px-3 py-1.5 focus:outline-none focus:border-[#D4AF37]/40 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-300 px-3 py-1.5 focus:outline-none focus:border-[#D4AF37]/40 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Meta info ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {isFetching ? 'Refreshing…' : `${products.length} product${products.length !== 1 ? 's' : ''} shown`}
          {debouncedSearch && ` for "${debouncedSearch}"`}
        </span>
        {pagination && (
          <span>Page {page} of {totalPages} &middot; {pagination.total} total</span>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-red-500/5 rounded-2xl border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load products.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-black/20 rounded-2xl border border-white/10">
          <Package className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">No products found</p>
          <p className="text-neutral-600 text-sm mt-1">
            {debouncedSearch ? 'Try a different search term.' : 'Adjust the status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductRow key={product.product_id} product={product} onView={setSelected} />
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-xs text-neutral-500">
            Showing{' '}
            <span className="text-neutral-300 font-medium">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, pagination.total)}
            </span>{' '}
            of{' '}
            <span className="text-neutral-300 font-medium">{pagination.total}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-white/10 text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-semibold border transition-all',
                    p === page
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                      : 'text-neutral-400 border-white/10 hover:border-white/20 hover:text-neutral-200',
                  )}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={!pagination.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-white/10 text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Preview Modal */}
      <ProductPreviewModal
        product={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
});
CreatorProductsPanel.displayName = 'CreatorProductsPanel';
