// ============================================
// useWallet — Wallet state & transactions hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { getWalletApi, getTransactionsApi } from '@/api/wallet.api';
import type { Wallet, WalletTransaction } from '@/types/wallet.types';

const TRANSACTIONS_PER_PAGE = 10;

interface UseWalletReturn {
    wallet: Wallet | null;
    transactions: WalletTransaction[];
    isLoading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    refetch: () => void;
}

export const useWallet = (): UseWalletReturn => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch balance and transactions in parallel
            const [walletData, txData] = await Promise.all([
                getWalletApi(),
                getTransactionsApi(page, TRANSACTIONS_PER_PAGE),
            ]);
            setWallet(walletData);
            setTransactions(txData.transactions);
            setTotalPages(txData.totalPages);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load wallet';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, fetchData]);

    return {
        wallet,
        transactions,
        isLoading,
        error,
        currentPage,
        totalPages,
        setCurrentPage,
        refetch: () => fetchData(currentPage),
    };
};
