import React from 'react';
import { motion } from 'framer-motion';
import { Eye, UserCheck, UserX, Package, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { CreatorListItem } from '@/api/admin-creators.api';
import { CreatorStatusBadge } from './CreatorStatusBadge';
import { cn } from '@/utils/cn';

interface CreatorTableProps {
  creators: CreatorListItem[];
  onView: (creator: CreatorListItem) => void;
  onToggleStatus: (creator: CreatorListItem) => void;
  onPay: (creator: CreatorListItem) => void;
  isTogglingId?: string | null;
}

/**
 * CreatorTable – Paginated table of all creators with quick actions
 */
export const CreatorTable: React.FC<CreatorTableProps> = ({
  creators,
  onView,
  onToggleStatus,
  onPay,
  isTogglingId,
}) => {
  if (creators.length === 0) {
    return (
      <div className="text-center py-20 bg-black/20 rounded-2xl border border-white/10">
        <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <p className="text-neutral-400 text-lg font-medium">No creators found</p>
        <p className="text-neutral-500 text-sm mt-1">Try adjusting your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Table Header */}
          <div className="grid grid-cols-[2.5fr_2fr_1fr_1fr_180px] gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <div>Creator Details</div>
            <div>Contact Info</div>
            <div>Products</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {creators.map((creator, i) => (
              <motion.div
                key={creator.creator_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onView(creator)}
                className="grid grid-cols-[2.5fr_2fr_1fr_1fr_180px] gap-4 px-6 py-4 bg-black/10 hover:bg-white/[0.02] hover:bg-black/20 cursor-pointer transition-colors items-center group"
              >
                {/* Creator name + verified */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4AF37] font-bold text-sm">
                      {creator.store_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-neutral-100 font-medium text-sm truncate group-hover:text-[#D4AF37] transition-colors">
                      {creator.store_name}
                    </p>
                    {creator.verified && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="min-w-0">
                  <p className="text-neutral-400 text-sm truncate">{creator.user.email}</p>
                  <p className="text-neutral-600 text-xs mt-0.5">
                    Joined {new Date(creator.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Product count */}
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-300 text-sm font-medium">{creator.total_products}</span>
                </div>

                {/* Status badge */}
                <div>
                  <CreatorStatusBadge isActive={creator.is_active} size="sm" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPay(creator);
                    }}
                    title="Process Payout"
                    className="px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-200"
                  >
                    Pay
                  </button>

                  {/* View Profile */}
                  <button
                    id={`creator-view-${creator.creator_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(creator);
                    }}
                    title="View Profile"
                    className="p-2 rounded-lg text-neutral-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Quick toggle */}
                  <button
                    id={`creator-toggle-${creator.creator_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(creator);
                    }}
                    title={creator.is_active ? 'Deactivate Creator' : 'Activate Creator'}
                    disabled={isTogglingId === creator.creator_id}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200 disabled:opacity-50',
                      creator.is_active
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10',
                    )}
                  >
                    {isTogglingId === creator.creator_id ? (
                      <Clock className="w-4 h-4 animate-pulse" />
                    ) : creator.is_active ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
