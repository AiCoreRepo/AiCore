// ============================================
// WALLET PAGE
// ============================================

import { ArrowLeft, RefreshCw, ChevronLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard';
import { TransactionList } from '@/components/wallet/TransactionList';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';

const WalletPage = () => {
    const navigate = useNavigate();
    const {
        wallet,
        transactions,
        isLoading,
        error,
        currentPage,
        totalPages,
        setCurrentPage,
        refetch,
    } = useWallet();

    return (
        <UserDashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE]">
                {/* Header */}
                <div className="bg-white border-b border-[#E0E0D8] sticky top-0 z-10 shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-[#F5F3EE] text-[#6B6B6B] hover:text-[#2C2416] transition-colors flex flex-row gap-1 sm:gap-2 items-center"
                            >
                                <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
                                <span className="font-medium text-sm hidden sm:inline">Back</span>
                            </button>
                            <h1 className="text-[#2C2416] text-lg sm:text-xl font-serif font-bold ml-1 sm:ml-2">My Wallet</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={refetch}
                                disabled={isLoading}
                                className="p-2 mr-2 rounded-lg hover:bg-[#F5F3EE] text-[#6B6B6B] hover:text-[#2C2416] transition-colors disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center shadow-sm">
                            {error}
                        </div>
                    )}

                    {/* Balance Card Section */}
                    <div className="space-y-4">
                        <WalletBalanceCard wallet={wallet} isLoading={isLoading} />

                        {/* Wallet Information Text */}
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-[#2C2416]">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                                This wallet stores refunds, cashback, and promotional credits from our platform.
                            </p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="w-full">
                        <TransactionList
                            transactions={transactions}
                            isLoading={isLoading}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>

                    {/* Wallet Rules Section */}
                    <div className="mt-8 pt-6 border-t border-[#E0E0D8]">
                        <h3 className="text-[#2C2416] text-base font-bold font-serif mb-4 flex items-center gap-2">
                            Wallet Information
                        </h3>
                        <ul className="space-y-3 text-sm text-[#6B6B6B]">
                            <li className="flex gap-3">
                                <span className="text-[#C9A55C]">•</span>
                                Refunds are credited instantly to wallet
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#C9A55C]">•</span>
                                Wallet balance can be used during checkout
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#C9A55C]">•</span>
                                Wallet money cannot be withdrawn or transferred
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </UserDashboardLayout>
    );
};

export default WalletPage;
