import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ordersApi } from '@/features/orders/api/orders.api';
import { paymentApi } from '@/features/orders/api/payment.api';
import { usePayU, type PayUExtraFields } from '@/hooks/usePayU';
import type { CreateOrderPayload } from '@/features/orders/types/order.types';
import {
    Banknote, Smartphone, CreditCard, Building2, Wallet, Calculator,
    ChevronDown, MapPin, Edit2, Gift, ShieldCheck, Lock, Check,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useWallet } from '@/hooks/useWallet';
import { AddressSelector } from '@/components/cart/AddressSelector';
import type { Address } from '@/constants/address.constants';
import { PAYMENT_METHODS, COD_FEE_CENTS, BANK_OFFERS } from '@/constants/payment.constants';
import { motion, AnimatePresence } from 'framer-motion';
import { getAddresses } from '@/lib/api';

const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';
const GOLD_LIGHT = '#F5EDD6';

// All PayU online method IDs
const ONLINE_METHODS = new Set(['payu']);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Banknote, Smartphone, CreditCard, Building2, Wallet, Calculator,
    Sparkles: Wallet, // fallback
};

interface LocationState {
    selectedAddress?: Address;
    subtotal?: number;
    discount?: number;
    total?: number;
    itemCount?: number;
    couponCode?: string;
}

// ── PayU payment group + bankcode config ───────────────────────────────────────
// UPI Apps — all use pg=UPI (PayU doesn't support per-app deep-link pre-select)
const UPI_APPS = [
    {
        id: 'gpay', name: 'Google Pay', pg: 'UPI', bankcode: 'UPI',
        logo: <svg width="32" height="32" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.6 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" /><path fill="#34A853" d="M6.3 14.7l7 5.1C15.2 15.4 19.3 12 24 12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.3 6.3 14.7z" /><path fill="#FBBC05" d="M24 46c5.8 0 10.9-1.9 14.9-5.2l-6.8-5.6C30 36.7 27.1 37.5 24 37.5c-5.9 0-10.9-3.9-12.7-9.3l-7 5.4C7.7 41.4 15.4 46 24 46z" /><path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.7-2.6 5-5 6.6l6.8 5.6C41.1 37.1 45 31.2 45 24c0-1.3-.2-2.7-.5-4z" /></svg>, bg: 'white', border: '1px solid #E5E7EB'
    },
    {
        id: 'phonepe', name: 'PhonePe', pg: 'UPI', bankcode: 'UPI',
        logo: <svg width="26" height="26" viewBox="0 0 40 40"><path d="M26 14H18C16.9 14 16 14.9 16 16V30L19 27V21H26C28.2 21 30 19.2 30 17C30 14.8 28.2 13 26 11V14ZM26 18H19V17C19 15.9 19.9 15 21 15H26C27.1 15 28 15.9 28 17C28 18.1 27.1 19 26 19V18Z" fill="white" /></svg>, bg: '#5F259F', border: 'none'
    },
    {
        id: 'paytm', name: 'Paytm', pg: 'UPI', bankcode: 'UPI',
        logo: <span style={{ color: 'white', fontSize: 11, fontWeight: 800, letterSpacing: -1 }}>Pay<br />tm</span>, bg: '#00BAF2', border: 'none'
    },
    {
        id: 'bhim', name: 'BHIM UPI', pg: 'UPI', bankcode: 'UPI',
        logo: <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>BHIM</span>, bg: '#00A651', border: 'none'
    },
    {
        id: 'amazon', name: 'Amazon Pay', pg: 'UPI', bankcode: 'UPI',
        logo: <span style={{ color: 'white', fontSize: 18, fontWeight: 800 }}>a</span>, bg: '#FF9900', border: 'none'
    },
    {
        id: 'cred', name: 'CRED', pg: 'UPI', bankcode: 'UPI',
        logo: <span style={{ color: '#D4AF37', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>CRED</span>, bg: '#1A1A2E', border: 'none'
    },
];

// Card Networks (pg=CC / DC — PayU handles card entry on its side)
const CARD_NETWORKS = [
    {
        id: 'cc', name: 'Credit Card', pg: 'CC', bankcode: '',
        logo: <span style={{ color: 'white', fontSize: 11, fontWeight: 800, fontStyle: 'italic', letterSpacing: -0.5 }}>Credit</span>, bg: '#1A1F71', border: '1px solid #1A1F71'
    },
    {
        id: 'dc', name: 'Debit Card', pg: 'DC', bankcode: '',
        logo: <span style={{ color: '#1A1F71', fontSize: 10, fontWeight: 800 }}>Debit</span>, bg: 'white', border: '1px solid #1A1F71'
    },
    {
        id: 'visa', name: 'Visa', pg: 'CC', bankcode: '',
        logo: <span style={{ color: 'white', fontSize: 11, fontWeight: 800, fontStyle: 'italic' }}>VISA</span>, bg: '#1A1F71', border: 'none'
    },
    {
        id: 'mc', name: 'Mastercard', pg: 'CC', bankcode: '',
        logo: <div style={{ display: 'flex', position: 'relative', width: 32, height: 20 }}><div style={{ position: 'absolute', left: 0, top: 0, width: 20, height: 20, borderRadius: '50%', background: '#EB001B' }} /><div style={{ position: 'absolute', right: 0, top: 0, width: 20, height: 20, borderRadius: '50%', background: '#F79E1B', opacity: 0.9 }} /></div>, bg: 'white', border: '1px solid #E5E7EB'
    },
    {
        id: 'rupay', name: 'RuPay', pg: 'DC', bankcode: '',
        logo: <><span style={{ color: '#FF6600', fontSize: 11, fontWeight: 800 }}>Ru</span><span style={{ color: '#1A1F71', fontSize: 11, fontWeight: 800 }}>Pay</span></>, bg: 'white', border: '1px solid #E5E7EB'
    },
    {
        id: 'amex', name: 'Amex', pg: 'CC', bankcode: '',
        logo: <span style={{ color: 'white', fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>AMEX</span>, bg: '#006FCF', border: 'none'
    },
];

// PayU Net Banking banks with exact bankcodes from PayU docs
const NB_BANKS = [
    { id: 'hdfc', name: 'HDFC Bank', shortName: 'HDFC', color: '#004C8F', bankcode: 'HDFC' },
    { id: 'sbi', name: 'SBI', shortName: 'SBI', color: '#22409A', bankcode: 'SBIB' },
    { id: 'icici', name: 'ICICI Bank', shortName: 'ICICI', color: '#B01116', bankcode: 'ICIB' },
    { id: 'axis', name: 'Axis Bank', shortName: 'AXIS', color: '#97144D', bankcode: 'AXIB' },
    { id: 'kotak', name: 'Kotak Bank', shortName: 'KMB', color: '#EE3124', bankcode: 'KOTB' },
    { id: 'yesbank', name: 'Yes Bank', shortName: 'YES', color: '#00529B', bankcode: 'YESB' },
    { id: 'pnb', name: 'Punjab National', shortName: 'PNB', color: '#005F3F', bankcode: 'PNBB' },
    { id: 'bob', name: 'Bank of Baroda', shortName: 'BoB', color: '#FF6600', bankcode: 'BOBB' },
    { id: 'indusind', name: 'IndusInd Bank', shortName: 'IIB', color: '#9B1B30', bankcode: 'INDB' },
    { id: 'idfc', name: 'IDFC FIRST', shortName: 'IDFC', color: '#0066CC', bankcode: 'IDFCB' },
    { id: 'rbl', name: 'RBL Bank', shortName: 'RBL', color: '#C8102E', bankcode: 'RBLB' },
    { id: 'federal', name: 'Federal Bank', shortName: 'FBL', color: '#1E3A6E', bankcode: 'FEDB' },
];

// PayU Wallets with bankcodes
const PAYU_WALLETS = [
    { id: 'paytm', name: 'Paytm Wallet', color: '#00BAF2', text: 'Pay', textColor: 'white', bankcode: 'PAYTM' },
    { id: 'phonepe', name: 'PhonePe Wallet', color: '#5F259F', text: 'Pe', textColor: 'white', bankcode: 'PHONEPE' },
    { id: 'amazon', name: 'Amazon Pay', color: '#FF9900', text: 'a', textColor: 'white', bankcode: 'AMAZONPAY' },
    { id: 'mobikwik', name: 'MobiKwik', color: '#EE3377', text: 'M', textColor: 'white', bankcode: 'MOBIKWIK' },
    { id: 'jiomoney', name: 'JioMoney', color: '#003A8C', text: 'Jio', textColor: '#00C2E0', bankcode: 'JIOMONEY' },
    { id: 'airtel', name: 'Airtel Money', color: '#ED1C24', text: 'Ai', textColor: 'white', bankcode: 'AIRTEL' },
];

// ── Shared Logo Tile ──────────────────────────────────────────────────────────
const LogoTile = ({
    id, name, bg, border, children, selected, onClick,
}: { id: string; name: string; bg: string; border?: string; children: React.ReactNode; selected: boolean; onClick: () => void }) => (
    <motion.button
        key={id}
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-center"
        style={{
            borderColor: selected ? GOLD : '#E5E7EB',
            background: selected ? GOLD_LIGHT + '60' : 'white',
            boxShadow: selected ? `0 0 0 1px ${GOLD}40` : 'none',
        }}
    >
        {selected && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD }}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
        )}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: border || 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {children}
        </div>
        <span className="text-[11px] font-medium leading-tight" style={{ color: selected ? GOLD : '#374151' }}>{name}</span>
    </motion.button>
);

const BankTile = ({ bank, selected, onClick }: { bank: typeof NB_BANKS[0]; selected: boolean; onClick: () => void }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all cursor-pointer text-left w-full"
        style={{ borderColor: selected ? GOLD : '#E5E7EB', background: selected ? GOLD_LIGHT + '50' : 'white' }}
    >
        <div style={{ width: 36, height: 36, borderRadius: 8, background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 700, fontFamily: 'system-ui' }}>{bank.shortName}</span>
        </div>
        <span className="text-xs font-medium truncate flex-1" style={{ color: selected ? GOLD : '#374151' }}>{bank.name}</span>
        {selected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} strokeWidth={3} />}
    </motion.button>
);

// ── PayU Badge ────────────────────────────────────────────────────────────────
const PayUBadge = ({ label }: { label: string }) => (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
        <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
            <p className="text-xs font-semibold text-blue-700">Secured by PayU</p>
            <p className="text-xs text-blue-600 mt-0.5">
                {label ? `Select your preferred ${label} below, then click Continue to pay securely on PayU's hosted page.` : 'You will be securely redirected to PayU\'s hosted checkout page.'}
            </p>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { cart, clearCart, refreshCart } = useCart();
    const { wallet } = useWallet();
    const { redirectToPayU } = usePayU();

    const [selectedMethod, setSelectedMethod] = useState('cod');
    const [selectedSubMethod, setSelectedSubMethod] = useState<{ pg: string; bankcode: string; id: string } | null>(null);
    const [showBankOffers, setShowBankOffers] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const state = location.state as LocationState;

    // Reset sub-method selection when switching top-level method
    const setMethod = (m: string) => {
        setSelectedMethod(m);
        setSelectedSubMethod(null);
    };

    useEffect(() => {
        (async () => {
            if (state?.selectedAddress) { setSelectedAddress(state.selectedAddress); setIsLoadingAddress(false); return; }
            try {
                const addrs = await getAddresses();
                if (addrs?.length) setSelectedAddress(addrs.find((a: Address) => a.is_default) || addrs[0]);
            } catch { /* no addresses */ } finally { setIsLoadingAddress(false); }
        })();
    }, []);

    const orderDetails = useMemo(() => {
        if (state?.total) return { subtotal: state.subtotal || 0, discount: state.discount || 0, total: state.total, itemCount: state.itemCount || 0 };
        const subtotal = cart.items.reduce((s, i) => s + i.price_cents * i.quantity, 0);
        return { subtotal, discount: 0, total: subtotal, itemCount: cart.items.reduce((s, i) => s + i.quantity, 0) };
    }, [state, cart.items]);

    const isCOD = selectedMethod === 'cod';
    const isAivestireWallet = selectedMethod === 'aivestire-wallet';
    const isOnlinePayU = ONLINE_METHODS.has(selectedMethod);
    const hasPendingPayURetry = isOnlinePayU && !!sessionStorage.getItem('pending_order_id');

    const codFee = isCOD ? COD_FEE_CENTS : 0;
    const finalTotal = orderDetails.total + codFee;
    const walletBalance = wallet ? Number(wallet.balance) : 0;
    const hasSufficientWalletBalance = walletBalance >= finalTotal / 100;
    const isWalletDisabled = isAivestireWallet && !hasSufficientWalletBalance;

    const isButtonDisabled = (!selectedAddress && !hasPendingPayURetry) || isPlacingOrder || isWalletDisabled;

    // ── Place Order ───────────────────────────────────────────────────────────
    const handlePlaceOrder = useCallback(async () => {
        const pendingOrderId = sessionStorage.getItem('pending_order_id');
        const canRetryPendingPayUOrder = isOnlinePayU && !!pendingOrderId;

        if (!canRetryPendingPayUOrder && !selectedAddress) { toast({ title: 'Address Required', variant: 'destructive' }); return; }
        if (!canRetryPendingPayUOrder && !cart.items.length) { toast({ title: 'Cart is Empty', variant: 'destructive' }); return; }

        setIsPlacingOrder(true);
        try {
            let orderId: string;
            let orderNumber: string;

            if (canRetryPendingPayUOrder && pendingOrderId) {
                orderId = pendingOrderId;
                orderNumber = sessionStorage.getItem('pending_order_number') || '';
            } else {
                let paymentMethod: 'COD' | 'PREPAID' | 'PAYU' | 'WALLET' = 'PAYU';
                if (isCOD) paymentMethod = 'COD';
                if (isAivestireWallet) paymentMethod = 'WALLET';

                const payload: CreateOrderPayload = {
                    items: cart.items.map(i => ({ productId: i.product_id, quantity: i.quantity, size: i.size || undefined, color: i.color || undefined })),
                    shippingAddressId: selectedAddress.address_id,
                    paymentMethod,
                    couponCode: state?.couponCode || undefined,
                };
                const order = await ordersApi.createOrder(payload);
                if (!order?.order_id) throw new Error('Order creation failed');
                orderId = order.order_id;
                orderNumber = order.order_number;
            }

            if (isCOD || isAivestireWallet) {
                sessionStorage.removeItem('aivestire_applied_coupon');
                // Best-effort cart invalidation so UI updates immediately
                clearCart({ silent: true }).catch(() => {
                    // If clear fails (e.g., already cleared server-side), fall back to refetch
                    refreshCart().catch(() => { });
                });
                toast({ title: '✅ Order Placed!', description: isCOD ? `Order #${orderNumber} confirmed. Pay on delivery.` : `Paid via Aivestire Wallet.`, className: 'bg-emerald-50 border-emerald-200 text-emerald-900' });
                setTimeout(() => navigate('/my-orders?from=cart'), 500);
                return;
            }

            sessionStorage.setItem('pending_order_id', orderId);
            sessionStorage.setItem('pending_order_number', orderNumber);

            const payuPayload = await paymentApi.initiatePayment(orderId);

            // Redirect to PayU without specific sub-methods pre-selected
            redirectToPayU(payuPayload);
        } catch (err: any) {
            setIsPlacingOrder(false);
            toast({ title: 'Order Failed', description: err?.response?.data?.message || err?.message || 'Please try again.', variant: 'destructive' });
        }
    }, [selectedAddress, cart.items, isCOD, isAivestireWallet, isOnlinePayU, selectedMethod, selectedSubMethod, state, redirectToPayU, navigate, toast]);

    // ── Button label ──────────────────────────────────────────────────────────
    const buttonLabel = () => {
        if (isPlacingOrder) return <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{isOnlinePayU ? 'Redirecting to PayU…' : 'Processing…'}</span></div>;
        if (!selectedAddress) return 'Select Address to Continue';
        if (isCOD) return 'Place Order';
        if (isAivestireWallet) return `Pay ₹${(finalTotal / 100).toLocaleString('en-IN')} using Wallet`;
        return `Continue to Pay ₹${(finalTotal / 100).toLocaleString('en-IN')} →`;
    };

    // ── Payment Content Panels ────────────────────────────────────────────────
    const renderPaymentContent = (method = selectedMethod) => {

        if (method === 'cod') {
            return (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Cash on Delivery</h3>
                    <div className="border-2 rounded-xl p-4" style={{ borderColor: GOLD, background: GOLD_LIGHT + '50' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100"><Banknote className="w-6 h-6 text-amber-600" /></div>
                            <div>
                                <p className="font-medium text-gray-800">Pay Cash / UPI at Doorstep</p>
                                <p className="text-sm text-gray-500 mt-0.5">₹10 convenience fee applies. Pay online to avoid this fee.</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl p-4 bg-gray-50 border border-gray-100 space-y-2 text-sm text-gray-600">
                        {[['📦', 'Order dispatched after confirmation call'], ['🚚', 'Delivery in 5–7 working days'], ['🔄', 'Easy returns within 7 days']].map(([icon, text]) => (
                            <div key={text} className="flex items-center gap-2"><span>{icon}</span><span>{text}</span></div>
                        ))}
                    </div>
                </div>
            );
        }

        if (method === 'aivestire-wallet') {
            return (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Aivestire Wallet</h3>
                    <div className="border-2 rounded-xl p-4 flex items-center gap-4" style={{ borderColor: hasSufficientWalletBalance ? GOLD : '#E5E7EB', background: hasSufficientWalletBalance ? GOLD_LIGHT + '40' : 'white' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: GOLD_LIGHT }}><Wallet className="w-6 h-6" style={{ color: GOLD }} /></div>
                        <div>
                            <p className="font-medium text-gray-800">Aivestire Wallet <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ background: GOLD_LIGHT, color: GOLD }}>INSTANT</span></p>
                            <p className="text-sm mt-0.5 text-gray-500">Balance: <span className="font-semibold" style={{ color: GOLD }}>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
                            {!hasSufficientWalletBalance && <p className="text-xs mt-1 text-red-500 font-medium">Insufficient balance. Top up or choose another method.</p>}
                        </div>
                    </div>
                </div>
            );
        }

        // ── PayU ──
        if (method === 'payu') {
            return (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Pay Online via PayU</h3>
                    <PayUBadge label="method" />
                    <p className="text-xs text-gray-500">You can choose to pay via UPI, Credit/Debit Cards, NetBanking, or Wallets securely on the PayU checkout page.</p>
                </div>
            );
        }

        return <div className="py-8 text-center text-gray-400 text-sm">Select a payment option</div>;
    };

    // ── Pay Button ────────────────────────────────────────────────────────────
    const PayButton = () => (
        <>
            <motion.button onClick={handlePlaceOrder} disabled={isButtonDisabled}
                whileHover={{ scale: !isButtonDisabled ? 1.01 : 1 }}
                whileTap={{ scale: !isButtonDisabled ? 0.99 : 1 }}
                className="w-full py-4 font-semibold uppercase tracking-wide rounded text-sm disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: isButtonDisabled ? '#E5E7EB' : GOLD, color: isButtonDisabled ? '#9CA3AF' : 'white', boxShadow: isButtonDisabled ? 'none' : '0 4px 20px rgba(212,175,55,0.35)' }}
                onMouseEnter={e => { if (!isButtonDisabled) e.currentTarget.style.backgroundColor = GOLD_HOVER; }}
                onMouseLeave={e => { if (!isButtonDisabled) e.currentTarget.style.backgroundColor = GOLD; }}
            >
                {buttonLabel()}
            </motion.button>
            {isOnlinePayU && !isButtonDisabled && (
                <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> 256-bit SSL · PCI-DSS Compliant · Powered by PayU
                </p>
            )}
        </>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="h-24" />
            <main className="flex-1">
                {/* Step Progress */}
                <div className="bg-white border-b border-gray-200 py-5">
                    <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => navigate('/cart')} className="text-gray-400 hover:text-gray-700 text-sm font-medium tracking-[0.15em] transition-colors">BAG</button>
                            <div className="w-24 border-t-2 border-dashed border-gray-300" />
                            <span className="text-sm font-semibold tracking-[0.15em] pb-1 border-b-2" style={{ color: GOLD, borderColor: GOLD }}>PAYMENT</span>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 max-w-[1200px] py-4">
                    <div className="flex flex-col lg:flex-row gap-4">

                        {/* ── LEFT ─────────────────────────────────────────── */}
                        <div className="flex-1 space-y-3">
                            {/* Address */}
                            <div className="bg-white border border-gray-200 rounded">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />
                                        <div className="flex-1 min-w-0">
                                            {selectedAddress ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm">Deliver to: {selectedAddress.full_name}</span>
                                                    <span className="px-1.5 py-0.5 text-xs font-medium rounded-sm" style={{ color: GOLD, backgroundColor: GOLD_LIGHT }}>{selectedAddress.address_type}</span>
                                                    <span className="text-sm text-gray-500 truncate">— {selectedAddress.address_line1}, {selectedAddress.city} {selectedAddress.pincode}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">{isLoadingAddress ? 'Loading address…' : 'No address — click to add'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddressSelector(true)} className="px-3 py-1.5 border text-xs font-semibold uppercase tracking-wide rounded flex-shrink-0 ml-3 flex items-center gap-1.5 transition-colors" style={{ borderColor: GOLD, color: GOLD }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                        <Edit2 className="w-3 h-3" />{selectedAddress ? 'Change' : 'Add'}
                                    </button>
                                </div>
                            </div>

                            {/* Bank Offers */}
                            <div className="bg-white border border-gray-200 rounded">
                                <button onClick={() => setShowBankOffers(!showBankOffers)} className="w-full p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">🏦</span>
                                        <div className="text-left"><p className="font-semibold text-sm">Bank Offer</p><p className="text-xs text-gray-500">{BANK_OFFERS[0].title}</p></div>
                                    </div>
                                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" style={{ transform: showBankOffers ? 'rotate(180deg)' : 'rotate(0)' }} />
                                </button>
                                <AnimatePresence>
                                    {showBankOffers && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
                                            <div className="p-4 text-sm text-gray-600 space-y-2">{BANK_OFFERS.map(o => <p key={o.id}>• {o.description}</p>)}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Payment Panel */}
                            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                                <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-600 p-4 border-b border-gray-200">Choose Payment Mode</h2>

                                {/* Mobile: Accordion */}
                                <div className="block lg:hidden">
                                    {PAYMENT_METHODS.map(method => {
                                        const Icon = ICON_MAP[method.icon] || CreditCard;
                                        const isSelected = selectedMethod === method.id;
                                        return (
                                            <div key={method.id} className="border-b border-gray-100 last:border-0">
                                                <button onClick={() => setMethod(method.id)} className="w-full px-4 py-4 flex items-center justify-between text-left" style={{ backgroundColor: isSelected ? '#FAFAF9' : 'white' }}>
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isSelected ? GOLD : '#6b7280' }} />
                                                        <div>
                                                            <span className="text-sm" style={{ color: isSelected ? GOLD : '#374151', fontWeight: isSelected ? 600 : 400 }}>{method.label}</span>
                                                            {method.offers && <span className="block text-xs mt-0.5" style={{ color: GOLD }}>{method.offers}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: isSelected ? GOLD : '#D1D5DB' }}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />}
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="px-4 pb-5 pt-2 border-t border-gray-100">
                                                                {renderPaymentContent(method.id)}
                                                                <div className="mt-5"><PayButton /></div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop: Sidebar + Pane */}
                                <div className="hidden lg:flex" style={{ minHeight: 520 }}>
                                    <div className="w-[240px] border-r border-gray-200 bg-gray-50/40 flex-shrink-0">
                                        {PAYMENT_METHODS.map(method => {
                                            const Icon = ICON_MAP[method.icon] || CreditCard;
                                            const isSelected = selectedMethod === method.id;
                                            return (
                                                <button key={method.id} onClick={() => setMethod(method.id)} className="w-full px-4 py-4 flex items-center gap-3 text-left transition-all border-l-4 hover:bg-white" style={{ backgroundColor: isSelected ? 'white' : 'transparent', borderLeftColor: isSelected ? GOLD : 'transparent' }}>
                                                    <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isSelected ? GOLD : '#6b7280' }} />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm block" style={{ color: isSelected ? GOLD : '#374151', fontWeight: isSelected ? 600 : 400 }}>{method.label}</span>
                                                        {method.offers && <span className="text-xs mt-0.5 block" style={{ color: GOLD }}>{method.offers}</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.div key={selectedMethod} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }} className="flex-1 p-6 flex flex-col overflow-y-auto">
                                            <div className="flex-1">{renderPaymentContent(selectedMethod)}</div>
                                            <div className="mt-6"><PayButton /></div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3"><Gift className="w-5 h-5 text-gray-500" /><span className="font-medium text-sm">Have a Gift Card?</span></div>
                                <button className="text-sm font-medium uppercase" style={{ color: GOLD }}>Apply Gift Card</button>
                            </div>
                        </div>

                        {/* ── RIGHT: Summary ────────────────────────────────── */}
                        <div className="w-full lg:w-[340px] space-y-4">
                            {cart.items.slice(0, 2).map(item => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded p-4 flex items-center gap-3">
                                    <img src={item.thumbnail || 'https://via.placeholder.com/60x80'} alt={item.title} className="w-12 h-16 object-cover rounded" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: GOLD }}>₹{(item.price_cents * item.quantity / 100).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            ))}
                            {cart.items.length > 2 && <p className="text-xs text-gray-400 text-center">+{cart.items.length - 2} more items</p>}

                            <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600 pb-2 border-b border-gray-100">Price Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600"><span>Price ({orderDetails.itemCount} items)</span><span>₹{(orderDetails.subtotal / 100).toLocaleString('en-IN')}</span></div>
                                    {orderDetails.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−₹{(orderDetails.discount / 100).toLocaleString('en-IN')}</span></div>}
                                    <div className="flex justify-between text-gray-600"><span>Delivery Fee</span><span className="text-emerald-600 font-medium">FREE</span></div>
                                    {isCOD && <div className="flex justify-between text-gray-600"><span>COD Fee</span><span>₹{(COD_FEE_CENTS / 100).toFixed(0)}</span></div>}
                                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total Amount</span><span>₹{(finalTotal / 100).toLocaleString('en-IN')}</span></div>
                                </div>
                                {orderDetails.discount > 0 && <p className="text-xs text-emerald-600 font-medium">🎉 You save ₹{(orderDetails.discount / 100).toLocaleString('en-IN')}</p>}
                            </div>

                            <div className="bg-white border border-gray-200 rounded p-4 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <div><p className="text-sm font-medium text-gray-800">Safe &amp; Secure Payments</p><p className="text-xs text-gray-500 mt-0.5">All online payments via PayU — PCI-DSS compliant, 256-bit SSL.</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            {showAddressSelector && (
                <AddressSelector isOpen={showAddressSelector} onSelectAddress={(addr) => { setSelectedAddress(addr); setShowAddressSelector(false); }} onClose={() => setShowAddressSelector(false)} selectedAddressId={selectedAddress?.address_id} />
            )}
        </div>
    );
};

export default PaymentPage;
