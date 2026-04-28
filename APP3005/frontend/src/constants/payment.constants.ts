// Payment Methods Configuration — Full list matching PayU supported modes
// OnlineMethods (UPI, Card, NetBanking, Wallets, EMI) all redirect to PayU
// COD and Aivestire Wallet are handled internally
export const PAYMENT_METHODS = [
    { id: 'cod',             label: 'Cash On Delivery',   icon: 'Banknote',   offers: null },
    { id: 'payu',            label: 'Pay via Cards / UPI / NetBanking', icon: 'CreditCard', offers: 'Secured by PayU' },
    { id: 'aivestire-wallet', label: 'Aivestire Wallet',  icon: 'Sparkles',   offers: null },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

// COD Fee in cents (₹10)
export const COD_FEE_CENTS = 1000;

// Bank Offers (shown in the collapsible section)
export const BANK_OFFERS = [
    {
        id: 'hdfc',
        title: '10% Instant Discount on HDFC Bank Credit Cards',
        description: 'Get 10% off up to ₹500 on HDFC Bank Credit Cards',
        minSpend: 350000,
    },
    {
        id: 'icici',
        title: '5% Instant Discount on ICICI Bank Cards',
        description: 'Get 5% off up to ₹300 on ICICI Bank Cards',
        minSpend: 200000,
    },
] as const;

// Payment Messages
export const PAYMENT_MESSAGES = {
    COD_FEE_INFO: 'A convenience fee of ₹10 applies. Pay online to skip this fee.',
    UPI_HINT: 'A payment request will be sent to this UPI ID',
    ORDER_SUCCESS: 'Order placed successfully!',
    SELECT_PAYMENT: 'Select a payment method to continue',
    INSUFFICIENT_FUNDS: 'Insufficient balance. Please choose another method or top up your wallet.',
    PAYU_REDIRECT: 'You will be securely redirected to PayU to complete payment.',
} as const;

// ── Order Payment Method Badge Config ─────────────────────────────────────────
export const ORDER_PAYMENT_METHOD_CONFIG: Record<
    string,
    { label: string; shortLabel: string; icon: string; bg: string; border: string; text: string }
> = {
    COD: {
        label: 'Cash on Delivery',
        shortLabel: 'COD',
        icon: '💵',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
    },
    PREPAID: {
        label: 'Prepaid',
        shortLabel: 'Prepaid',
        icon: '💳',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
    },
    PAYU: {
        label: 'Paid Online via PayU',
        shortLabel: 'PayU',
        icon: '⚡',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
    },
    WALLET: {
        label: 'Paid via Wallet',
        shortLabel: 'Wallet',
        icon: '💼',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
    },
} as const;

// ── Order Payment Status Badge Config ─────────────────────────────────────────
export const ORDER_PAYMENT_STATUS_CONFIG = {
    PAID_ONLINE: { label: 'Paid', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    PAY_ON_DELIVERY: { label: 'Pay on Delivery', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    FAILED: { label: 'Payment Failed', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    REFUNDED: { label: 'Refunded', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
    PENDING_ONLINE: { label: 'Payment Pending', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
    PENDING_COD: { label: 'Pay on Delivery', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
} as const;
