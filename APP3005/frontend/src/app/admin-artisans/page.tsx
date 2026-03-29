import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Users, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { CreatorTable } from '@/components/admin/creators/CreatorTable';
import { CreatorProfileModal } from '@/components/admin/creators/CreatorProfileModal';
import { ConfirmDialog } from '@/components/admin/creators/ConfirmDialog';
import { PayCreatorModal } from '@/components/admin/creators/PayCreatorModal';
import { useAdminCreators, useToggleCreatorStatus } from '@/hooks/useAdminCreators';
import { CreatorListItem } from '@/api/admin-creators.api';
import {
    CreatorStatusFilter,
    CREATOR_MESSAGES,
    CREATOR_PAGINATION,
} from '@/constants/creator-management.constants';
import { typography, animations } from '@/constants/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/cn';

/**
 * CreatorsPage – Full Creator Management Dashboard
 * Lists creators with search/filter, quick activate/deactivate from table,
 * and a slide-over profile drawer with product breakdown tabs.
 */
function CreatorsPage() {
    // ── State ─────────────────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<CreatorStatusFilter>(CreatorStatusFilter.ALL);
    const [page, setPage] = useState(1);

    // Confirm dialog state
    const [confirmTarget, setConfirmTarget] = useState<CreatorListItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Pay modal state
    const [payCreatorTarget, setPayCreatorTarget] = useState<CreatorListItem | null>(null);
    const [isPayOpen, setIsPayOpen] = useState(false);

    // ── Hooks ─────────────────────────────────────────────────────────────────
    const debouncedSearch = useDebounce(searchInput, 400);

    const { data, isLoading, error, refetch, isRefetching } = useAdminCreators({
        search: debouncedSearch || undefined,
        status: statusFilter,
        page,
        limit: CREATOR_PAGINATION.DEFAULT_LIMIT,
    });
    

    const toggleMutation = useToggleCreatorStatus();

    const navigate = useNavigate();

    const handleViewProfile = useCallback((creator: CreatorListItem) => {
        navigate(`/admin-artisans/${creator.creator_id}`);
    }, [navigate]);

    /** Called from both table quick-action and modal button */
    const handleToggleRequest = useCallback((creator: CreatorListItem) => {
        setConfirmTarget(creator);
        setIsConfirmOpen(true);
    }, []);

    const handleConfirmToggle = async () => {
        if (!confirmTarget) return;
        const action = confirmTarget.is_active ? 'INACTIVE' : 'ACTIVE';
        await toggleMutation.mutateAsync({ creatorId: confirmTarget.creator_id, action });
        setIsConfirmOpen(false);
        setConfirmTarget(null);
    };

    const handleCancelConfirm = () => {
        setIsConfirmOpen(false);
        setConfirmTarget(null);
    };

    const handlePayRequest = useCallback((creator: CreatorListItem) => {
        setPayCreatorTarget(creator);
        setIsPayOpen(true);
    }, []);

    const handleClosePay = () => {
        setIsPayOpen(false);
        setTimeout(() => setPayCreatorTarget(null), 300);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (f: CreatorStatusFilter) => {
        setStatusFilter(f);
        setPage(1);
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const creators = data?.creators ?? [];
    const pagination = data?.pagination;
    const totalCreators = pagination?.total ?? 0;

    const activeCount = creators.filter((c) => c.is_active).length;
    const inactiveCount = creators.filter((c) => !c.is_active).length;

    const confirmMessage = confirmTarget
        ? confirmTarget.is_active
            ? CREATOR_MESSAGES.DEACTIVATE_CONFIRM(confirmTarget.store_name)
            : CREATOR_MESSAGES.ACTIVATE_CONFIRM(confirmTarget.store_name)
        : '';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-neutral-900 flex flex-col md:flex-row">
            <Sidebar />

            <main className="flex-1 md:ml-[280px] p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 md:pt-8 w-full max-w-[100vw] md:max-w-none overflow-x-hidden">
                <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">

                    {/* ── Page Header ──────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0"
                    >
                        <div>
                            <h1
                                className="text-3xl sm:text-4xl font-bold text-neutral-100 mb-1 sm:mb-2"
                                style={{ fontFamily: typography.fontSerif }}
                            >
                                Creator Management
                            </h1>
                            <p className="text-sm sm:text-base text-neutral-400">
                                Manage creator accounts, monitor activity, and control platform access.
                            </p>
                        </div>

                        <button
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            title="Refresh"
                            className="p-2 sm:p-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2 text-sm self-start sm:self-auto"
                        >
                            <RefreshCw className={cn('w-4 h-4', isRefetching && 'animate-spin')} />
                        </button>
                    </motion.div>

                    {/* ── Summary Stats ─────────────────────────────────── */}
                    <motion.div
                        variants={animations.fadeIn}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                        {[
                            {
                                icon: Users,
                                label: 'Total Creators',
                                value: totalCreators,
                                color: 'text-[#D4AF37]',
                                bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20',
                            },
                            {
                                icon: UserCheck,
                                label: 'Active',
                                value: activeCount,
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/10 border-emerald-500/20',
                            },
                            {
                                icon: UserX,
                                label: 'Inactive',
                                value: inactiveCount,
                                color: 'text-red-400',
                                bg: 'bg-red-500/10 border-red-500/20',
                            },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className={cn(
                                    'flex items-center gap-4 p-5 rounded-2xl border bg-black/20',
                                    stat.bg,
                                )}
                            >
                                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', stat.bg)}>
                                    <stat.icon className={cn('w-5 h-5', stat.color)} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-100">{stat.value}</p>
                                    <p className="text-xs text-neutral-500">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* ── Search & Filter Bar ───────────────────────────── */}
                    <motion.div
                        variants={animations.fadeIn}
                        initial="initial"
                        animate="animate"
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                id="creator-search"
                                type="text"
                                placeholder="Search by store name or email…"
                                value={searchInput}
                                onChange={handleSearchChange}
                                className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                            {[
                                { key: CreatorStatusFilter.ALL, label: 'All' },
                                { key: CreatorStatusFilter.ACTIVE, label: 'Active' },
                                { key: CreatorStatusFilter.INACTIVE, label: 'Inactive' },
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    id={`filter-${f.key.toLowerCase()}`}
                                    onClick={() => handleFilterChange(f.key)}
                                    className={cn(
                                        'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200',
                                        statusFilter === f.key
                                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                                            : 'text-neutral-400 border-white/10 hover:border-white/20 hover:text-neutral-200',
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Table ─────────────────────────────────────────── */}
                    <motion.div
                        variants={animations.fadeIn}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.1 }}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <span className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-red-500/5 rounded-2xl border border-red-500/20">
                                <p className="text-red-400">{CREATOR_MESSAGES.LOAD_ERROR}</p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-4 text-sm text-neutral-400 hover:text-neutral-200 underline"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <CreatorTable
                                creators={creators}
                                onView={handleViewProfile}
                                onToggleStatus={handleToggleRequest}
                                onPay={handlePayRequest}
                                isTogglingId={toggleMutation.isPending ? confirmTarget?.creator_id : null}
                            />
                        )}
                    </motion.div>

                    {/* ── Pagination ────────────────────────────────────── */}
                    {pagination && pagination.totalPages > 1 && (
                        <motion.div
                            variants={animations.fadeIn}
                            initial="initial"
                            animate="animate"
                            className="flex items-center justify-between py-4"
                        >
                            <p className="text-sm text-neutral-500">
                                Showing{' '}
                                <span className="text-neutral-300 font-medium">
                                    {(pagination.page - 1) * pagination.limit + 1}–
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                </span>{' '}
                                of <span className="text-neutral-300 font-medium">{pagination.total}</span> creators
                            </p>

                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-4 py-2 rounded-xl text-sm border border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    ← Previous
                                </button>
                                <button
                                    disabled={!pagination.hasMore}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 rounded-xl text-sm border border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* ── Pay Creator Modal ───────────────────────────────── */}
            <PayCreatorModal
                isOpen={isPayOpen}
                onClose={handleClosePay}
                creator={payCreatorTarget}
            />

            {/* ── Confirm Dialog ──────────────────────────────────── */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={
                    confirmTarget?.is_active
                        ? `Deactivate "${confirmTarget?.store_name}"?`
                        : `Activate "${confirmTarget?.store_name}"?`
                }
                message={confirmMessage}
                confirmLabel={confirmTarget?.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
                cancelLabel="Cancel"
                variant={confirmTarget?.is_active ? 'danger' : 'success'}
                isLoading={toggleMutation.isPending}
                onConfirm={handleConfirmToggle}
                onCancel={handleCancelConfirm}
            />
        </div>
    );
}

export default CreatorsPage;
