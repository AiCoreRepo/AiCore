// Payment Methods Configuration
export const PAYMENT_METHODS = [
    { id: 'recommended', label: 'Recommended', icon: 'Star', offers: null },
    { id: 'cod', label: 'Cash On Delivery', icon: 'Banknote', offers: null },
    { id: 'upi', label: 'UPI (Pay via any App)', icon: 'Smartphone', offers: null },
    { id: 'card', label: 'Credit/Debit Card', icon: 'CreditCard', offers: '8 Offers' },
    { id: 'paylater', label: 'Pay Later', icon: 'Clock', offers: null },
    { id: 'wallets', label: 'Wallets', icon: 'Wallet', offers: '1 Offer' },
    { id: 'emi', label: 'EMI', icon: 'Calculator', offers: '1 Offer' },
    { id: 'netbanking', label: 'Net Banking', icon: 'Building2', offers: null },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

// COD Fee in cents (₹10)
export const COD_FEE_CENTS = 1000;

// Bank Offers
export const BANK_OFFERS = [
    {
        id: 'hdfc',
        title: '10% Instant Discount on HDFC Bank Credit Cards',
        description: 'Get 10% off up to ₹500 on HDFC Bank Credit Cards',
        minSpend: 350000, // ₹3500 in cents
    },
    {
        id: 'icici',
        title: '5% Instant Discount on ICICI Bank Cards',
        description: 'Get 5% off up to ₹300 on ICICI Bank Cards',
        minSpend: 200000, // ₹2000 in cents
    },
    {
        id: 'emi',
        title: 'No Cost EMI',
        description: 'No cost EMI available on orders above ₹5,000',
        minSpend: 500000, // ₹5000 in cents
    },
] as const;

// Net Banking Options
export const NET_BANKING_OPTIONS = [
    'HDFC',
    'ICICI',
    'SBI',
    'Axis',
    'Kotak',
    'Yes Bank',
    'IDFC',
    'Other',
] as const;

// Wallet Options
export const WALLET_OPTIONS = [
    { id: 'paytm', label: 'Paytm Wallet' },
    { id: 'phonepe', label: 'PhonePe Wallet' },
    { id: 'amazon', label: 'Amazon Pay' },
    { id: 'mobikwik', label: 'Mobikwik' },
] as const;

// Payment Messages
export const PAYMENT_MESSAGES = {
    COD_FEE_INFO: 'For this option, there is a fee of ₹10. You can Pay online to avoid this.',
    UPI_HINT: 'A payment request will be sent to this UPI ID',
    ORDER_SUCCESS: 'Order placed successfully!',
    SELECT_PAYMENT: 'Select a payment method to continue',
} as const;

// ── Order Payment Method Badge Config ─────────────────────────────────────────
// Used in OrderCard to display payment method pill (COD / Prepaid / Online)
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
    RAZORPAY: {
        label: 'Paid Online',
        shortLabel: 'Online',
        icon: '⚡',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
    },
} as const;

// ── Order Payment Status Badge Config ─────────────────────────────────────────
// Used in OrderCard to display payment status pill (Paid / Pending / Failed…)
export const ORDER_PAYMENT_STATUS_CONFIG = {
    PAID_ONLINE: { label: 'Paid', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    PAY_ON_DELIVERY: { label: 'Pay on Delivery', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    FAILED: { label: 'Payment Failed', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    REFUNDED: { label: 'Refunded', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
    PENDING_ONLINE: { label: 'Payment Pending', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
    PENDING_COD: { label: 'Pay on Delivery', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
} as const;
