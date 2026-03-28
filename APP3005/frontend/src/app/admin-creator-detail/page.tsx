import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { CreatorDetailHeader } from '@/components/admin/creator-detail/CreatorDetailHeader';
import { CreatorSummaryCards } from '@/components/admin/creator-detail/CreatorSummaryCards';
import { CreatorInfoPanel } from '@/components/admin/creator-detail/CreatorInfoPanel';
import { CreatorProductsPanel } from '@/components/admin/creator-detail/CreatorProductsPanel';
import { useAdminCreatorById, useToggleCreatorStatus } from '@/hooks/useAdminCreators';
import { ConfirmDialog } from '@/components/admin/creators/ConfirmDialog';
import { PayCreatorModal } from '@/components/admin/creators/PayCreatorModal';
import { CreatorListItem } from '@/api/admin-creators.api';
import { animations } from '@/constants/theme';
import { cn } from '@/utils/cn';

type Tab = 'overview' | 'products';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { key: 'products', label: 'Products', Icon: Package },
];

export default function AdminCreatorDetailPage() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);

  const { data: detail, isLoading, error } = useAdminCreatorById(creatorId ?? '');
  const toggleMutation = useToggleCreatorStatus();

  const creatorListItem = useMemo<CreatorListItem | null>(() => {
    if (!detail) return null;
    return {
      creator_id: detail.creator_id,
      store_name: detail.store_name,
      store_slug: detail.store_slug,
      about: detail.about,
      verified: detail.verified,
      created_at: detail.created_at,
      is_active: detail.is_active,
      total_products: detail.product_summary?.total ?? 0,
      user: detail.user,
    };
  }, [detail]);

  const handleConfirmToggle = useCallback(async () => {
    if (!detail) return;
    const action = detail.is_active ? 'INACTIVE' : 'ACTIVE';
    await toggleMutation.mutateAsync({ creatorId: detail.creator_id, action });
    setIsConfirmOpen(false);
  }, [detail, toggleMutation]);

  if (!creatorId) return null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 md:ml-[280px] flex items-center justify-center">
          <span className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !detail) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 md:ml-[280px] flex items-center justify-center flex-col gap-4 px-6">
          <p className="text-red-400 text-lg text-center">Failed to load creator profile.</p>
          <button
            onClick={() => navigate('/admin-artisans')}
            className="px-5 py-2 rounded-xl border border-white/10 text-neutral-400 hover:text-neutral-100 hover:bg-white/5 text-sm transition-all"
          >
            Back to Creator Management
          </button>
        </main>
      </div>
    );
  }

  const confirmMessage = detail.is_active
    ? `Deactivate "${detail.store_name}"? Their products will be hidden from the storefront.`
    : `Activate "${detail.store_name}"? Their products will become visible again.`;

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 md:ml-[280px] p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 md:pt-8 w-full overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Header */}
          <CreatorDetailHeader
            detail={detail}
            onBack={() => navigate('/admin-artisans')}
            onToggleStatus={() => setIsConfirmOpen(true)}
            onPay={() => setIsPayOpen(true)}
            isToggling={toggleMutation.isPending}
          />

          {/* Tab Bar */}
          <motion.div
            variants={animations.fadeIn}
            initial="initial"
            animate="animate"
            className="flex gap-0 border-b border-white/10"
          >
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all duration-200',
                  activeTab === key
                    ? 'text-[#D4AF37] border-[#D4AF37]'
                    : 'text-neutral-500 border-transparent hover:text-neutral-300',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              variants={animations.fadeIn}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 xl:grid-cols-3 gap-6"
            >
              <div className="xl:col-span-2 space-y-6">
                <CreatorSummaryCards detail={detail} />
              </div>
              <div>
                <CreatorInfoPanel detail={detail} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              variants={animations.fadeIn}
              initial="initial"
              animate="animate"
            >
              <CreatorProductsPanel creatorId={creatorId} />
            </motion.div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={detail.is_active ? `Deactivate "${detail.store_name}"?` : `Activate "${detail.store_name}"?`}
        message={confirmMessage}
        confirmLabel={detail.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
        cancelLabel="Cancel"
        variant={detail.is_active ? 'danger' : 'success'}
        isLoading={toggleMutation.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <PayCreatorModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        creator={creatorListItem}
      />
    </div>
  );
}
