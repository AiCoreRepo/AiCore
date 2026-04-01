import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Clock, Eye, Star, Boxes } from 'lucide-react';
import { CreatorProduct } from '@/api/admin-creators.api';
import { PRODUCT_STATUS_BADGE } from '@/constants/creator-management.constants';
import { cn } from '@/utils/cn';

interface ProductPreviewModalProps {
  product: CreatorProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProductPreviewModal – Read-only detailed view for a creator's product.
 * Displays large thumbnail, title, stats, and status.
 */
export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  if (!product) return null;

  const formatPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(cents / 100);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const badge = PRODUCT_STATUS_BADGE[product.status as keyof typeof PRODUCT_STATUS_BADGE];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 max-w-7xl mx-auto bg-neutral-950 border border-white/10 rounded-[2rem] shadow-2xl z-[60] overflow-hidden flex flex-col md:flex-row"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-black/90 transition-all shadow-xl hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left Side: Large Image Showcase */}
            <div className="md:w-1/2 lg:w-[55%] bg-neutral-900 relative flex items-center justify-center flex-shrink-0">
              {product.thumbnail ? (
                <div className="absolute inset-0 p-4 md:p-8">
                  <div className="w-full h-full relative border border-white/5 rounded-2xl overflow-hidden bg-black/40">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-600">
                  <div className="w-24 h-24 rounded-full bg-black/30 border border-white/5 flex items-center justify-center mb-4">
                    <Package className="w-12 h-12" />
                  </div>
                  <p className="font-medium text-lg text-neutral-500">No Hero Image Available</p>
                </div>
              )}

              {/* Status Badge Overlaid */}
              {badge && (
                <div className="absolute top-10 left-10 md:top-14 md:left-14 z-10">
                  <span
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-md shadow-lg',
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
              )}
            </div>

            {/* Right Side: Details Panel */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-neutral-950/80 p-8 md:p-12 border-l border-white/10">
              <div className="pr-12">
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-100 mb-4 font-serif leading-tight">
                  {product.title}
                </h1>
                <p className="text-4xl font-bold text-[#D4AF37] tracking-tight">
                  {formatPrice(product.price_cents, product.currency)}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-8">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Product Story</h3>
                  <p className="text-neutral-300 leading-relaxed text-base">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent my-10" />

              {/* Metrics Grid */}
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Analytics & Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 text-neutral-500 mb-2">
                    <div className="p-2 bg-white/5 rounded-lg text-neutral-400"><Package className="w-4 h-4" /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Category</span>
                  </div>
                  <p className="text-neutral-100 font-semibold text-lg">
                    {product.category || 'Uncategorized'}
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 text-neutral-500 mb-2">
                    <div className="p-2 bg-white/5 rounded-lg text-neutral-400"><Clock className="w-4 h-4" /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Timeline</span>
                  </div>
                  <p className="text-neutral-100 font-semibold text-sm mt-1">
                    {formatDate(product.created_at)}
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 text-neutral-500 mb-2">
                    <div className="p-2 bg-white/5 rounded-lg text-neutral-400"><Boxes className="w-4 h-4" /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Inventory</span>
                  </div>
                  <p className="text-neutral-100 font-semibold text-lg">
                    {product.inventory_count} <span className="text-neutral-500 text-sm font-medium">units left</span>
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 text-neutral-500 mb-2">
                    <div className="p-2 bg-white/5 rounded-lg text-neutral-400"><Eye className="w-4 h-4" /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Performance</span>
                  </div>
                  <p className="text-neutral-100 font-semibold text-lg">
                    {product.views} <span className="text-neutral-500 text-sm font-medium">total views</span>
                  </p>
                </div>
              </div>

              {/* Features & Tags */}
              {product.is_featured && (
                <div className="mt-8 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                      <Star className="w-6 h-6 text-[#D4AF37]" fill="#D4AF37" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-neutral-100">Featured in The Collection</h4>
                      <p className="text-sm text-neutral-400 mt-1">
                        This product is actively promoted on the platform storefront and reaches thousands of daily customers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
