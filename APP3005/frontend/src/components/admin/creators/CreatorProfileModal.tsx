import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  CheckCircle,
  User,
  Store,
  Clock,
  Eye,
  Star,
  TrendingUp,
  Layers,
  Phone,
} from 'lucide-react';
import { useAdminCreatorById, useAdminCreatorProducts } from '@/hooks/useAdminCreators';
import { CreatorListItem, CreatorProduct } from '@/api/admin-creators.api';
import { CreatorStatusBadge } from './CreatorStatusBadge';
import { ProductPreviewModal } from './ProductPreviewModal';
import { PRODUCT_STATUS_BADGE, ProductStatusFilter } from '@/constants/creator-management.constants';
import { cn } from '@/utils/cn';

interface CreatorProfileModalProps {
  creator: CreatorListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (creator: CreatorListItem) => void;
}

const PRODUCT_TABS = [
  { key: ProductStatusFilter.ALL, label: 'All' },
  { key: ProductStatusFilter.PENDING, label: 'Pending' },
  { key: ProductStatusFilter.APPROVED, label: 'Approved' },
  { key: ProductStatusFilter.REJECTED, label: 'Rejected' },
];

/**
 * CreatorProfileModal – Slide-over drawer with 2 tabs: Overview + Products
 */
export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  creator,
  isOpen,
  onClose,
  onToggleStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');
  const [productFilter, setProductFilter] = useState(ProductStatusFilter.ALL);
  const [selectedProduct, setSelectedProduct] = useState<CreatorProduct | null>(null);

  const { data: detail, isLoading: detailLoading } = useAdminCreatorById(
    creator?.creator_id ?? '',
  );

  const { data: productsData, isLoading: productsLoading } = useAdminCreatorProducts(
    creator?.creator_id ?? '',
    { status: productFilter === ProductStatusFilter.ALL ? undefined : productFilter },
  );

  const formatDate = (date: string | null | undefined) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';

  const formatPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(cents / 100);

  return (
    <AnimatePresence>
      {isOpen && creator && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-neutral-950 border-l border-white/10 z-50 flex flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-[#D4AF37] font-bold text-2xl">
                    {creator.store_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-neutral-100">{creator.store_name}</h2>
                    {(detail?.verified ?? creator.verified) && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <CreatorStatusBadge isActive={creator.is_active} size="sm" />
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-200 hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-4 border-b border-white/10 flex-shrink-0 bg-neutral-900/50">
              {(['overview', 'products'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize',
                    activeTab === tab
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5',
                  )}
                >
                  {tab}
                </button>
              ))}

              {/* Quick action from modal */}
              <div className="ml-auto">
                <button
                  id={`modal-toggle-${creator.creator_id}`}
                  onClick={() => onToggleStatus(creator)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200',
                    creator.is_active
                      ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
                  )}
                >
                  {creator.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── Overview Tab ─────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <span className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : detail ? (
                    <>
                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Total Sales', value: detail.total_sales_formatted ?? formatPrice(detail.total_sales || 0, 'INR'), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                          { label: 'Total Products', value: detail.product_summary.total, icon: Package, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20' },
                          { label: 'Approved', value: detail.product_summary.approved, icon: CheckCircle, color: 'text-neutral-300', bg: 'bg-white/5 border-white/10' },
                          { label: 'Pending Review', value: detail.product_summary.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                          { label: 'Rejected', value: detail.product_summary.rejected, icon: X, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-black/30 rounded-2xl border border-white/10 p-4 flex items-center gap-3"
                          >
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                              <stat.icon className={cn('w-5 h-5', stat.color)} />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-neutral-100">{stat.value}</p>
                              <p className="text-xs text-neutral-500">{stat.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Creator Info */}
                      <div className="bg-black/30 rounded-2xl border border-white/10 p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                          Creator Info
                        </h3>
                        {[
                          { icon: User, label: 'Email', value: detail.user.email },
                          { icon: Phone, label: 'Phone', value: detail.user.phone || 'Not Provided' },
                          { icon: Store, label: 'Store Slug', value: `/@${detail.store_slug}` },
                          { icon: Clock, label: 'Joined', value: formatDate(detail.created_at) },
                          { icon: TrendingUp, label: 'Last Login', value: formatDate(detail.user.last_login) },
                          {
                            icon: Layers,
                            label: 'Upload Limit',
                            value: detail.limits
                              ? `${detail.limits.max_products} products / ${detail.limits.max_images_per_product} images each`
                              : 'Default (30 / 20)',
                          },
                        ].map((row) => (
                          <div key={row.label} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <row.icon className="w-4 h-4 text-neutral-500" />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">{row.label}</p>
                              <p className="text-sm text-neutral-200 font-medium">{row.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* About */}
                      {detail.about && (
                        <div className="bg-black/30 rounded-2xl border border-white/10 p-5">
                          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">About</h3>
                          <p className="text-sm text-neutral-300 leading-relaxed">{detail.about}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Failed to load profile.</p>
                  )}
                </div>
              )}

              {/* ── Products Tab ──────────────────────────────────── */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Sub-filter tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {PRODUCT_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setProductFilter(tab.key)}
                        className={cn(
                          'px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                          productFilter === tab.key
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                            : 'text-neutral-400 border-white/10 hover:border-white/20 hover:text-neutral-200',
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Products list */}
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <span className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : productsData && productsData.products.length > 0 ? (
                    <div className="space-y-3">
                      {productsData.products.map((product) => {
                        const badge = PRODUCT_STATUS_BADGE[product.status as keyof typeof PRODUCT_STATUS_BADGE];
                        return (
                          <div
                            key={product.product_id}
                            onClick={() => setSelectedProduct(product)}
                            className="flex items-center gap-4 bg-black/30 rounded-xl border border-white/10 p-3 hover:border-[#D4AF37]/50 hover:bg-white/5 cursor-pointer transition-colors group"
                          >
                            {/* Thumbnail */}
                            {product.thumbnail ? (
                              <img
                                src={product.thumbnail}
                                alt={product.title}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                                <Package className="w-6 h-6 text-neutral-600" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-100 truncate group-hover:text-[#D4AF37] transition-colors">
                                {product.title}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {product.category ?? 'Uncategorized'} ·{' '}
                                {formatPrice(product.price_cents, product.currency)}
                              </p>
                            </div>

                            {/* Product Sales Info */}
                            <div className="flex flex-col items-end px-4 border-r border-white/10 hidden sm:flex">
                              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-0.5">Sales Revenue</span>
                              <span className="text-sm font-bold text-emerald-400">{product.sales?.revenue_formatted ?? formatPrice(product.sales?.revenue_generated || 0, product.currency)}</span>
                              <span className="text-xs text-neutral-400 font-medium">{product.sales?.units_sold || 0} unit{product.sales?.units_sold === 1 ? '' : 's'}</span>
                            </div>

                            {/* Right side */}
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              {badge && (
                                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', badge.className)}>
                                  {badge.label}
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-neutral-600">
                                <Eye className="w-3 h-3" />
                                <span className="text-[10px]">{product.views}</span>
                              </div>
                              {product.is_featured && (
                                <Star className="w-3 h-3 text-[#D4AF37]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-neutral-500">
                      <Package className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
                      <p className="text-sm">No products found for this filter.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
          {/* ── Product Preview Modal ───────────────────────── */}
          <ProductPreviewModal
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
};
