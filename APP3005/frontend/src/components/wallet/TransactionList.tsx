// ============================================
// TRANSACTION LIST
// ============================================

import { useState } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    ChevronLeft,
    ChevronRight,
    Search,
    Undo2,
    ShoppingCart,
    Gift,
    Wallet as WalletIcon,
    X,
    CheckCircle2
} from 'lucide-react';
import { WalletTransactionTypeEnum } from '@/constants/wallet.enums';
import type { WalletTransaction } from '@/types/wallet.types';

interface TransactionListProps {
    transactions: WalletTransaction[];
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const SOURCE_LABELS: Record<string, string> = {
    REFUND: 'Refund',
    CASHBACK: 'Cashback',
    ORDER_PAYMENT: 'Order Payment',
    ADMIN_CREDIT: 'Admin Credit',
    PROMOTION: 'Promotional Credit',
};

const getTransactionIcon = (source: string, isCredit: boolean) => {
    switch (source) {
        case 'REFUND':
            return <Undo2 className="w-5 h-5" strokeWidth={2.5} />;
        case 'ORDER_PAYMENT':
            return <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />;
        case 'CASHBACK':
        case 'PROMOTION':
            return <Gift className="w-5 h-5" strokeWidth={2.5} />;
        case 'ADMIN_CREDIT':
            return <WalletIcon className="w-5 h-5" strokeWidth={2.5} />;
        default:
            return isCredit ? (
                <ArrowDownLeft className="w-5 h-5" strokeWidth={2.5} />
            ) : (
                <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
            );
    }
};

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT';

export const TransactionList = ({
    transactions,
    isLoading,
    currentPage,
    totalPages,
    onPageChange,
}: TransactionListProps) => {
    const [activeTab, setActiveTab] = useState<FilterType>('ALL');
    const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

    const filteredTransactions = transactions.filter((tx) => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'CREDIT') return tx.type === WalletTransactionTypeEnum.CREDIT;
        if (activeTab === 'DEBIT') return tx.type === WalletTransactionTypeEnum.DEBIT;
        return true;
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[#E0E0D8] bg-[#FDFBF7]">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-[#E0E0D8]">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 flex justify-between items-center animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                                <div>
                                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                    <div className="h-3 w-48 bg-gray-200 rounded" />
                                </div>
                            </div>
                            <div className="h-5 w-20 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[#E0E0D8] bg-[#FDFBF7] flex justify-between items-center">
                    <h2 className="text-[#2C2416] text-lg font-bold font-serif">Recent Transactions</h2>
                </div>
                <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-[#F5F3EE] rounded-full flex items-center justify-center mx-auto mb-4">
                        <WalletIcon className="w-8 h-8 text-[#C9A55C]" />
                    </div>
                    <p className="text-[#2C2416] text-lg font-bold font-serif mb-2">No transactions yet</p>
                    <p className="text-[#6B6B6B] text-sm max-w-sm mx-auto leading-relaxed">
                        Refunds, cashback, and wallet payments will appear here once you start using your wallet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] overflow-hidden">
            {/* Elegant Header */}
            <div className="p-3 sm:p-6 border-b border-[#E0E0D8] bg-gradient-to-r from-[#FDFBF7] to-[#F5F3EE] flex flex-col gap-4">
                <h2 className="text-[#2C2416] text-base sm:text-lg font-bold font-serif flex items-center gap-2">
                    Recent Transactions
                </h2>

                {/* Tabs Filter */}
                <div className="flex bg-white p-1 rounded-lg border border-[#E0E0D8] w-full sm:w-fit self-start shrink-0">
                    {(['ALL', 'CREDIT', 'DEBIT'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 sm:px-6 py-2 text-xs font-bold tracking-wide rounded-md transition-colors flex-1 sm:flex-none ${activeTab === tab
                                ? 'bg-[#2C2416] text-white'
                                : 'text-[#6B6B6B] hover:text-[#2C2416] hover:bg-[#F5F3EE]'
                                }`}
                        >
                            {tab === 'ALL' ? 'All' : tab === 'CREDIT' ? 'Credits' : 'Debits'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-[#E0E0D8]">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 px-4 text-[#6B6B6B]">
                        No {activeTab.toLowerCase()} transactions found on this page.
                    </div>
                ) : (
                    filteredTransactions.map((tx) => {
                        const isCredit = tx.type === WalletTransactionTypeEnum.CREDIT;
                        return (
                            <div
                                key={tx.transaction_id}
                                onClick={() => setSelectedTx(tx)}
                                className="p-3 sm:p-6 hover:bg-[#FDFBF7] transition-all duration-200 group flex justify-between items-start sm:items-center gap-2 sm:gap-4 cursor-pointer"
                            >
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                    {/* Elegant Icon Container */}
                                    <div
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 mt-0.5 sm:mt-0 ${isCredit
                                            ? 'bg-green-50 border-green-200 text-green-600'
                                            : 'bg-red-50 border-red-200 text-red-600'
                                            }`}
                                    >
                                        {getTransactionIcon(tx.source, isCredit)}
                                    </div>

                                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                                        <p className="text-[#2C2416] text-sm sm:text-base font-bold font-serif tracking-wide truncate">
                                            {SOURCE_LABELS[tx.source] || tx.source}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs font-medium">
                                            <span className="text-[#999999] whitespace-nowrap">
                                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                            <span className="text-[#E0E0D8]">•</span>
                                            <span className="text-[#999999]">
                                                {new Date(tx.created_at).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })}
                                            </span>
                                        </div>

                                        {tx.reference_id && (
                                            <p className="text-[#6B6B6B] text-xs pt-0.5 line-clamp-1">
                                                Ref: {tx.reference_id}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="flex flex-col items-end shrink-0 pt-0.5 sm:pt-0">
                                    <span
                                        className={`text-sm sm:text-lg font-bold whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-[#D32F2F]'
                                            }`}
                                    >
                                        {isCredit ? '+' : '-'} ₹
                                        {Number(tx.amount).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span
                                        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isCredit ? 'text-green-600/70' : 'text-[#D32F2F]/70'
                                            }`}
                                    >
                                        {isCredit ? 'CREDIT' : 'DEBIT'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Box */}
            {totalPages > 1 && (
                <div className="border-t border-[#E0E0D8] bg-[#FDFBF7] p-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <span className="text-xs sm:text-sm text-[#6B6B6B] font-medium tracking-wide">
                        Showing page <span className="text-[#2C2416] font-bold">{currentPage}</span> of{' '}
                        <span className="text-[#2C2416] font-bold">{totalPages}</span>
                    </span>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="flex-1 sm:flex-none flex items-center justify-center p-2 sm:px-3 sm:py-2 border border-[#E0E0D8] rounded-xl hover:bg-white text-[#2C2416] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="flex-1 sm:flex-none flex items-center justify-center p-2 sm:px-3 sm:py-2 border border-[#E0E0D8] rounded-xl hover:bg-white text-[#2C2416] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-[#E0E0D8] flex justify-between items-center bg-[#FDFBF7]">
                            <h3 className="text-[#2C2416] font-serif font-bold text-lg">
                                Transaction Details
                            </h3>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="p-1.5 text-[#6B6B6B] hover:text-[#2C2416] hover:bg-[#F5F3EE] rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="text-center">
                                <p className="text-[#6B6B6B] text-sm font-medium uppercase tracking-wider mb-2">
                                    Amount
                                </p>
                                <p
                                    className={`text-3xl font-bold tracking-tight ${selectedTx.type === WalletTransactionTypeEnum.CREDIT
                                        ? 'text-green-600'
                                        : 'text-[#D32F2F]'
                                        }`}
                                >
                                    {selectedTx.type === WalletTransactionTypeEnum.CREDIT ? '+' : '-'} ₹
                                    {Number(selectedTx.amount).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                    })}
                                </p>
                            </div>

                            <div className="bg-[#FDFBF7] border border-[#E0E0D8] rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#999999] font-medium">Type</span>
                                    <span className="text-[#2C2416] font-bold">
                                        {selectedTx.type === WalletTransactionTypeEnum.CREDIT ? 'Credit' : 'Debit'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#999999] font-medium">Source</span>
                                    <span className="text-[#2C2416] font-bold">
                                        {SOURCE_LABELS[selectedTx.source] || selectedTx.source}
                                    </span>
                                </div>
                                {selectedTx.reference_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#999999] font-medium">Reference</span>
                                        <span className="text-[#2C2416] font-bold truncate max-w-[150px]" title={selectedTx.reference_id}>
                                            {selectedTx.reference_id}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#999999] font-medium">Date</span>
                                    <span className="text-[#2C2416] font-bold">
                                        {new Date(selectedTx.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#999999] font-medium">Status</span>
                                    <span className="text-green-600 font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Completed
                                    </span>
                                </div>
                            </div>

                            {selectedTx.description && (
                                <div className="text-center pt-2">
                                    <p className="text-[#6B6B6B] text-xs leading-relaxed">
                                        {selectedTx.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-[#E0E0D8] bg-[#FDFBF7]">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="w-full bg-[#2C2416] text-white rounded-lg py-2.5 font-bold hover:bg-[#403521] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
