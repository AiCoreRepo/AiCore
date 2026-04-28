// ============================================
// WALLET ENUMS
// ============================================

export enum WalletTransactionTypeEnum {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum WalletTransactionSourceEnum {
    REFUND = 'REFUND',
    CASHBACK = 'CASHBACK',
    ORDER_PAYMENT = 'ORDER_PAYMENT',
    ADMIN_CREDIT = 'ADMIN_CREDIT',
    PROMOTION = 'PROMOTION',
}

export enum WalletTransactionStatusEnum {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REVERSED = 'REVERSED',
}
