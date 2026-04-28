// ============================================
// WALLET TYPES
// ============================================

import {
    WalletTransactionTypeEnum,
    WalletTransactionSourceEnum,
    WalletTransactionStatusEnum,
} from '@/constants/wallet.enums';

export interface Wallet {
    walletId: string;
    balance: number;
    updatedAt: string;
}

export interface WalletTransaction {
    transaction_id: string;
    wallet_id: string;
    type: WalletTransactionTypeEnum;
    source: WalletTransactionSourceEnum;
    amount: number;
    reference_id: string | null;
    description: string | null;
    status: WalletTransactionStatusEnum;
    created_at: string;
}

export interface WalletTransactionsResponse {
    transactions: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreditWalletPayload {
    amount: number;
    source: WalletTransactionSourceEnum;
    referenceId?: string;
    description?: string;
}

export interface DebitWalletPayload {
    amount: number;
    referenceId?: string;
    description?: string;
}

export interface AdminCreditPayload {
    userId: string;
    amount: number;
    description?: string;
}

export interface WalletMutationResponse {
    wallet: {
        wallet_id: string;
        balance: number;
    };
    transaction: WalletTransaction;
    message: string;
}
