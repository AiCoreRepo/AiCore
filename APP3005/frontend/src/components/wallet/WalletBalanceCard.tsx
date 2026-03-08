// ============================================
// WALLET BALANCE CARD
// ============================================

import { Wallet as WalletIcon, ShieldCheck } from 'lucide-react';
import type { Wallet } from '@/types/wallet.types';

interface WalletBalanceCardProps {
    wallet: Wallet | null;
    isLoading: boolean;
}

export const WalletBalanceCard = ({ wallet, isLoading }: WalletBalanceCardProps) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] p-6 sm:p-8 animate-pulse">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div>
                            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-32 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
                <div className="h-10 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
            </div>
        );
    }

    const balance = wallet ? Number(wallet.balance) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] relative group w-full overflow-hidden">
            {/* Elegant Header Area */}
            <div className="p-4 sm:p-6 lg:p-8 relative z-10 block w-full">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F5F3EE] rounded-full flex items-center justify-center border border-[#EAE8E4] group-hover:scale-105 transition-transform duration-300 shrink-0">
                        <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#C9A55C]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h2 className="text-[#2C2416] text-base sm:text-lg font-serif font-bold tracking-wide truncate">
                            Available Balance
                        </h2>
                        <p className="text-[#6B6B6B] text-[10px] sm:text-xs font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 shrink-0" />
                            <span className="truncate">100% Secure</span>
                        </p>
                    </div>
                </div>

                {/* Balance Display */}
                <div className="mt-4 mb-2 relative z-10 block">
                    <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-[#2C2416] text-xl sm:text-2xl font-bold">₹</span>
                        <span className="text-[#2C2416] text-4xl sm:text-5xl font-bold tracking-tight truncate leading-none">
                            {balance.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                </div>

                <p className="text-[#6B6B6B] text-xs sm:text-sm mb-2 relative z-10">
                    Wallet balance can be used during checkout.
                </p>

                {/* Last Updated */}
                {wallet && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4 text-[#999999] text-[10px] sm:text-xs font-medium bg-[#FDFBF7] inline-flex px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#F0F0F0]">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        <span className="truncate">Updated: {new Date(wallet.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        <span className="hidden sm:inline">{' • '}</span>
                        <span>{new Date(wallet.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                )}
            </div>

            {/* Subtle Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-[#C9A55C]/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C9A55C] via-[#E3D5B9] to-[#C9A55C] opacity-80" />
        </div>
    );
};
