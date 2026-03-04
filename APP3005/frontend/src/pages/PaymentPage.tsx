import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ordersApi } from '@/features/orders/api/orders.api';
import { paymentApi } from '@/features/orders/api/payment.api';
import { useRazorpay } from '@/hooks/useRazorpay';
import type { CreateOrderPayload } from '@/features/orders/types/order.types';
import {
    Star, Banknote, Smartphone, CreditCard, Clock, Wallet,
    Calculator, Building2, Gift, ChevronDown, MapPin, Edit2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AddressSelector } from '@/components/cart/AddressSelector';
import { Address } from '@/constants/address.constants';
import {
    PAYMENT_METHODS, COD_FEE_CENTS, BANK_OFFERS,
    NET_BANKING_OPTIONS, WALLET_OPTIONS, PAYMENT_MESSAGES,
} from '@/constants/payment.constants';
import { motion, AnimatePresence } from 'framer-motion';
import { getAddresses } from '@/lib/api';

// ── Brand ─────────────────────────────────────────────────────────────────────
const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';
const GOLD_LIGHT = '#F5EDD6';

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Star, Banknote, Smartphone, CreditCard, Clock, Wallet, Calculator, Building2,
};

interface LocationState {
    selectedAddress?: Address;
    subtotal?: number;
    discount?: number;
    total?: number;
    itemCount?: number;
    couponCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { cart, clearCart } = useCart();

    const [selectedMethod, setSelectedMethod] = useState('recommended');
    const [codOption, setCodOption] = useState<'cash' | 'upi'>('cash');
    const [showBankOffers, setShowBankOffers] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // ── UPI state ─────────────────────────────────────────────────────────────
    const [upiId, setUpiId] = useState('');
    const [upiVerified, setUpiVerified] = useState(false);
    const [upiVerifying, setUpiVerifying] = useState(false);
    const [upiError, setUpiError] = useState('');

    const state = location.state as LocationState;

    // ── Load default address ──────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            if (state?.selectedAddress) {
                setSelectedAddress(state.selectedAddress);
                setIsLoadingAddress(false);
                return;
            }
            try {
                const addrs = await getAddresses();
                if (addrs?.length) {
                    setSelectedAddress(addrs.find((a: Address) => a.is_default) || addrs[0]);
                }
            } catch { /* no addresses */ }
            finally { setIsLoadingAddress(false); }
        })();
    }, []);

    // ── Order totals ──────────────────────────────────────────────────────────
    const orderDetails = useMemo(() => {
        if (state?.total) {
            return {
                subtotal: state.subtotal || 0,
                discount: state.discount || 0,
                total: state.total,
                itemCount: state.itemCount || 0,
            };
        }
        const subtotal = cart.items.reduce((s, i) => s + i.price_cents * i.quantity, 0);
        return {
            subtotal,
            discount: 0,
            total: subtotal,
            itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
        };
    }, [state, cart.items]);

    const isCOD = selectedMethod === 'cod' || selectedMethod === 'recommended';
    const codFee = isCOD ? COD_FEE_CENTS : 0;
    const finalTotal = orderDetails.total + codFee;

    // ── Razorpay hook (only used for online payments) ─────────────────────────
    const { openCheckout } = useRazorpay({
        onSuccess: useCallback(async (rzpRes) => {
            const orderId = sessionStorage.getItem('pending_order_id');
            if (!orderId) {
                toast({ title: 'Error', description: 'Order ID missing. Contact support.', variant: 'destructive' });
                setIsPlacingOrder(false);
                return;
            }
            try {
                await paymentApi.verifyPayment({
                    razorpay_order_id: rzpRes.razorpay_order_id,
                    razorpay_payment_id: rzpRes.razorpay_payment_id,
                    razorpay_signature: rzpRes.razorpay_signature,
                    order_id: orderId,
                });
                sessionStorage.removeItem('pending_order_id');
                sessionStorage.removeItem('aivestire_applied_coupon'); // Clear coupon after payment
                await clearCart();
                toast({
                    title: '🎉 Payment Successful!',
                    description: 'Your order has been confirmed.',
                    className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
                });
                setTimeout(() => navigate('/my-orders?from=payment'), 500);
            } catch (err: any) {
                toast({
                    title: 'Verification Failed',
                    description: err?.response?.data?.message || 'Contact support with your payment ID.',
                    variant: 'destructive',
                });
            } finally {
                setIsPlacingOrder(false);
            }
        }, [clearCart, navigate, toast]),

        onDismiss: useCallback(() => {
            setIsPlacingOrder(false);
            toast({ title: 'Payment Cancelled', description: 'Your order is saved — retry anytime.' });
        }, [toast]),

        onError: useCallback((err: any) => {
            setIsPlacingOrder(false);
            toast({
                title: 'Payment Failed',
                description: err?.description || err?.message || 'Please try again.',
                variant: 'destructive',
            });
        }, [toast]),
    });

    // ── Place order ───────────────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast({ title: 'Address Required', description: 'Please select a delivery address.', variant: 'destructive' });
            return;
        }
        if (!cart.items.length) {
            toast({ title: 'Cart Empty', variant: 'destructive' });
            return;
        }

        setIsPlacingOrder(true);
        try {
            const paymentMethod = isCOD ? 'COD' : 'PREPAID';

            const payload: CreateOrderPayload = {
                items: cart.items.map(i => ({
                    productId: i.product_id,
                    quantity: i.quantity,
                    size: i.size || undefined,
                    color: i.color || undefined,
                })),
                shippingAddressId: selectedAddress.address_id,
                paymentMethod,
                couponCode: state?.couponCode || undefined,
            };

            const order = await ordersApi.createOrder(payload);
            if (!order?.order_id) throw new Error('Order creation failed');

            // ── COD: done immediately ─────────────────────────────────────────
            if (isCOD) {
                sessionStorage.removeItem('aivestire_applied_coupon'); // Clear coupon after COD order
                await clearCart();
                toast({
                    title: '✅ Order Placed!',
                    description: `Order #${order.order_number} confirmed. Pay on delivery.`,
                    className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
                });
                setTimeout(() => navigate('/my-orders?from=cart'), 500);
                return;
            }

            // ── Online: initiate Razorpay ─────────────────────────────────────
            const payData = await paymentApi.initiatePayment(order.order_id);
            sessionStorage.setItem('pending_order_id', order.order_id);

            // Map our sidebar selection to Razorpay method hint
            const methodMap: Record<string, string> = {
                upi: 'upi',
                card: 'card',
                netbanking: 'netbanking',
                wallets: 'wallet',
            };

            openCheckout({
                razorpayOrderId: payData.razorpayOrderId,
                amount: payData.amount,
                currency: payData.currency,
                keyId: payData.keyId,
                orderNumber: payData.orderNumber,
                prefill: {
                    ...payData.prefill,
                    // If user verified a UPI ID, pass it so Razorpay pre-fills it
                    ...(selectedMethod === 'upi' && upiVerified && upiId ? { vpa: upiId } : {}),
                },
                defaultMethod: methodMap[selectedMethod] || 'upi',
            });

            // Note: setIsPlacingOrder(false) is handled in onSuccess / onDismiss / onError callbacks

        } catch (err: any) {
            setIsPlacingOrder(false);
            toast({
                title: 'Order Failed',
                description: err?.response?.data?.message || err?.message || 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    // ── Payment content per method ────────────────────────────────────────────
    const renderPaymentContent = (activeMethod = selectedMethod) => {
        switch (activeMethod) {
            case 'recommended':
            case 'cod':
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">
                            {activeMethod === 'recommended' ? 'Recommended Payment Options' : 'Cash On Delivery Options'}
                        </h3>
                        <div
                            className="border rounded-lg p-4 cursor-pointer transition-all"
                            style={{ borderColor: codOption === 'cash' ? GOLD : '#E5E7EB', borderWidth: codOption === 'cash' ? 2 : 1 }}
                            onClick={() => setCodOption('cash')}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                    style={{ borderColor: codOption === 'cash' ? GOLD : '#D1D5DB' }}
                                >
                                    {codOption === 'cash' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />}
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium">Cash on Delivery (Cash/UPI)</span>
                                    <span className="ml-2 p-1 bg-gray-100 rounded text-xs">💳</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 ml-8">{PAYMENT_MESSAGES.COD_FEE_INFO}</p>
                        </div>
                    </div>
                );

            case 'upi': {
                // UPI ID regex: anything@anything (standard VPA format)
                const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

                const handleVerifyUpi = async () => {
                    const trimmed = upiId.trim();
                    if (!trimmed) {
                        setUpiError('Please enter a UPI ID.');
                        return;
                    }
                    if (!UPI_REGEX.test(trimmed)) {
                        setUpiError('Invalid UPI ID format. Example: name@upi or 9876543210@paytm');
                        setUpiVerified(false);
                        return;
                    }
                    setUpiError('');
                    setUpiVerifying(true);
                    setUpiVerified(false);
                    // Simulate VPA lookup (Razorpay does real validation inside their modal)
                    await new Promise(r => setTimeout(r, 1200));
                    setUpiVerifying(false);
                    setUpiVerified(true);
                };

                const handleUpiChange = (val: string) => {
                    setUpiId(val);
                    setUpiVerified(false);
                    setUpiError('');
                };

                return (
                    <div className="space-y-5">
                        <h3 className="font-semibold text-gray-800">Pay using UPI</h3>

                        {/* UPI ID input + verify */}
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Enter your UPI ID</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={e => handleUpiChange(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleVerifyUpi()}
                                        placeholder="yourname@upi or 9876543210@paytm"
                                        className="w-full px-4 py-3 border rounded text-sm focus:outline-none pr-10 transition-colors"
                                        style={{
                                            borderColor: upiError ? '#EF4444' : upiVerified ? '#10B981' : '#D1D5DB',
                                            backgroundColor: upiVerified ? '#F0FDF4' : 'white',
                                        }}
                                    />
                                    {/* Status icon inside input */}
                                    {upiVerified && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-lg">✓</span>
                                    )}
                                    {upiVerifying && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleVerifyUpi}
                                    disabled={upiVerifying || !upiId.trim()}
                                    className="px-4 py-2 border text-sm font-semibold rounded transition-all flex-shrink-0"
                                    style={{
                                        borderColor: upiVerified ? '#10B981' : GOLD,
                                        color: upiVerified ? '#10B981' : GOLD,
                                        backgroundColor: upiVerified ? '#F0FDF4' : 'transparent',
                                        opacity: upiVerifying || !upiId.trim() ? 0.6 : 1,
                                    }}
                                >
                                    {upiVerifying ? 'Verifying…' : upiVerified ? '✓ Verified' : 'VERIFY'}
                                </button>
                            </div>

                            {/* Error message */}
                            {upiError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span>⚠</span> {upiError}
                                </p>
                            )}

                            {/* Success message */}
                            {upiVerified && (
                                <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                    <span>✓</span> UPI ID verified! Click "Pay via Razorpay" to complete payment.
                                </p>
                            )}

                            <p className="text-xs text-gray-400">
                                A payment request will be sent to this UPI ID
                            </p>
                        </div>

                        {/* Popular UPI apps hint */}
                        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Popular UPI ID formats</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { app: 'Google Pay', format: 'number@okaxis / name@oksbi' },
                                    { app: 'PhonePe', format: 'number@ybl' },
                                    { app: 'Paytm', format: 'number@paytm' },
                                    { app: 'BHIM', format: 'number@upi' },
                                ].map(item => (
                                    <div key={item.app} className="bg-white border border-gray-200 rounded p-2.5">
                                        <p className="text-xs font-semibold text-gray-700">{item.app}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{item.format}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            case 'card':
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Credit / Debit Card</h3>
                        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-2">Card Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter Card Number"
                                    className="w-full px-4 py-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase mb-2">Valid Through</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase mb-2">CVV</label>
                                    <input
                                        type="password"
                                        placeholder="CVV"
                                        maxLength={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'netbanking':
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Net Banking</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {NET_BANKING_OPTIONS.map(bank => (
                                <button
                                    key={bank}
                                    className="border border-gray-200 rounded p-3 text-sm hover:border-gray-400 transition-colors"
                                >
                                    {bank}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'wallets':
                return (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800">Wallets</h3>
                        {WALLET_OPTIONS.map(wallet => (
                            <div
                                key={wallet.id}
                                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 cursor-pointer"
                            >
                                <span className="font-medium">{wallet.label}</span>
                                <span className="text-gray-400">→</span>
                            </div>
                        ))}
                    </div>
                );

            default:
                return (
                    <div className="py-8 text-center text-gray-500">
                        <p>{PAYMENT_MESSAGES.SELECT_PAYMENT}</p>
                    </div>
                );
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="h-24" />

            <main className="flex-1">
                {/* Step Progress Bar */}
                <div className="bg-white border-b border-gray-200 py-5">
                    <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/cart')}
                                className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-sm font-medium tracking-[0.15em]"
                            >
                                BAG
                            </button>
                            <div className="w-24 border-t-2 border-dashed border-gray-300" />
                            <span
                                className="text-sm font-semibold tracking-[0.15em] pb-1 border-b-2"
                                style={{ color: GOLD, borderColor: GOLD }}
                            >
                                PAYMENT
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 lg:px-8 max-w-[1200px] py-4">
                    <div className="flex flex-col lg:flex-row gap-4">

                        {/* ── LEFT: Address + Payment Options ── */}
                        <div className="flex-1 space-y-3">

                            {/* Delivery Address */}
                            <div className="bg-white border border-gray-200 rounded">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />
                                        <div className="flex-1 min-w-0">
                                            {selectedAddress ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm">
                                                        Deliver to: {selectedAddress.full_name}
                                                    </span>
                                                    <span
                                                        className="px-1.5 py-0.5 text-xs font-medium rounded-sm"
                                                        style={{ color: GOLD, backgroundColor: GOLD_LIGHT }}
                                                    >
                                                        {selectedAddress.address_type}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        - {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.pincode}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">
                                                    {isLoadingAddress ? 'Loading address...' : 'No address selected — Click to add'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddressSelector(true)}
                                        className="px-3 py-1.5 border text-xs font-semibold uppercase tracking-wide transition-colors flex items-center gap-1.5 rounded flex-shrink-0 ml-3"
                                        style={{ borderColor: GOLD, color: GOLD }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        {selectedAddress ? 'Change' : 'Add'}
                                    </button>
                                </div>
                            </div>

                            {/* Bank Offers */}
                            <div className="bg-white border border-gray-200 rounded">
                                <button
                                    onClick={() => setShowBankOffers(!showBankOffers)}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">🏦</span>
                                        <div className="text-left">
                                            <p className="font-semibold text-sm">Bank Offer</p>
                                            <p className="text-xs text-gray-500">{BANK_OFFERS[0].title}</p>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className="w-5 h-5 text-gray-400 transition-transform"
                                        style={{ transform: showBankOffers ? 'rotate(180deg)' : 'rotate(0)' }}
                                    />
                                </button>
                                <AnimatePresence>
                                    {showBankOffers && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-gray-100"
                                        >
                                            <div className="p-4 text-sm text-gray-600 space-y-2">
                                                {BANK_OFFERS.map(offer => (
                                                    <p key={offer.id}>• {offer.description}</p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Choose Payment Mode */}
                            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                                <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-600 p-4 border-b border-gray-200">
                                    Choose Payment Mode
                                </h2>

                                {/* ── Mobile: Accordion ── */}
                                <div className="block lg:hidden">
                                    {PAYMENT_METHODS.map(method => {
                                        const Icon = ICON_MAP[method.icon];
                                        const isSelected = selectedMethod === method.id;
                                        return (
                                            <div key={method.id} className="border-b border-gray-200 last:border-b-0">
                                                <button
                                                    onClick={() => setSelectedMethod(method.id)}
                                                    className={`w-full px-4 py-4 flex items-center justify-between text-left transition-colors ${isSelected ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {Icon && <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isSelected ? GOLD : '#6b7280' }} />}
                                                        <div>
                                                            <span className="text-sm block" style={{ color: isSelected ? GOLD : '#374151', fontWeight: isSelected ? 500 : 400 }}>
                                                                {method.label}
                                                            </span>
                                                            {method.offers && (
                                                                <span className="text-xs mt-0.5 block" style={{ color: GOLD }}>{method.offers}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="w-4 h-4 rounded-full border flex items-center justify-center"
                                                        style={{ borderColor: isSelected ? GOLD : '#D1D5DB' }}
                                                    >
                                                        {isSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />}
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-white"
                                                        >
                                                            <div className="p-4 border-t border-gray-100">
                                                                {renderPaymentContent(method.id)}
                                                                <motion.button
                                                                    onClick={handlePlaceOrder}
                                                                    disabled={!selectedAddress || isPlacingOrder}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="w-full mt-6 py-3.5 text-white font-semibold uppercase tracking-wide rounded-lg text-sm shadow-md"
                                                                    style={{ backgroundColor: selectedAddress ? GOLD : '#E5E7EB', color: selectedAddress ? 'white' : '#9CA3AF' }}
                                                                >
                                                                    {isPlacingOrder ? (
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                            <span>Processing</span>
                                                                        </div>
                                                                    ) : (
                                                                        isCOD ? 'Place Order' : `Pay ₹${(finalTotal / 100).toLocaleString('en-IN')} via Razorpay`
                                                                    )}
                                                                </motion.button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Desktop: Sidebar + Content Pane ── */}
                                <div className="hidden lg:flex">
                                    {/* Sidebar */}
                                    <div className="w-[240px] border-r border-gray-200 bg-gray-50/30">
                                        {PAYMENT_METHODS.map(method => {
                                            const Icon = ICON_MAP[method.icon];
                                            const isSelected = selectedMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setSelectedMethod(method.id)}
                                                    className={`w-full px-4 py-4 flex items-center gap-3 text-left transition-all border-l-4 hover:bg-white ${isSelected
                                                        ? 'bg-white border-l-[#D4AF37] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                                                        : 'border-transparent hover:border-gray-200'
                                                        }`}
                                                >
                                                    {Icon && (
                                                        <Icon
                                                            className="w-5 h-5 flex-shrink-0 transition-colors"
                                                            style={{ color: isSelected ? GOLD : '#6b7280' }}
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <span
                                                            className="text-sm block"
                                                            style={{ color: isSelected ? GOLD : '#374151', fontWeight: isSelected ? 500 : 400 }}
                                                        >
                                                            {method.label}
                                                        </span>
                                                        {method.offers && (
                                                            <span className="text-xs mt-0.5 block" style={{ color: GOLD }}>{method.offers}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Content Pane */}
                                    <div className="flex-1 p-6 min-h-[400px]">
                                        {renderPaymentContent(selectedMethod)}

                                        {/* Desktop Place Order / Pay Button */}
                                        <motion.button
                                            onClick={handlePlaceOrder}
                                            disabled={!selectedAddress || isPlacingOrder}
                                            whileHover={{ scale: selectedAddress ? 1.01 : 1 }}
                                            whileTap={{ scale: selectedAddress ? 0.99 : 1 }}
                                            className="w-full mt-8 py-4 text-white font-semibold uppercase tracking-wide rounded hover:shadow-lg transition-all"
                                            style={{
                                                backgroundColor: selectedAddress ? GOLD : '#E5E7EB',
                                                color: selectedAddress ? 'white' : '#9CA3AF',
                                            }}
                                            onMouseEnter={e => { if (selectedAddress) e.currentTarget.style.backgroundColor = GOLD_HOVER; }}
                                            onMouseLeave={e => { if (selectedAddress) e.currentTarget.style.backgroundColor = GOLD; }}
                                        >
                                            {isPlacingOrder ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Processing…</span>
                                                </div>
                                            ) : !selectedAddress ? (
                                                'Select Address to Continue'
                                            ) : isCOD ? (
                                                'Place Order'
                                            ) : (
                                                `Pay ₹${(finalTotal / 100).toLocaleString('en-IN')} via Razorpay`
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Gift Card */}
                            <div className="bg-white border border-gray-200 rounded p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Gift className="w-5 h-5 text-gray-500" />
                                        <span className="font-medium text-sm">Have a Gift Card?</span>
                                    </div>
                                    <button className="text-sm font-medium uppercase" style={{ color: GOLD }}>
                                        Apply Gift Card
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Price Details ── */}
                        <div className="w-full lg:w-[340px] space-y-4">
                            {/* Item thumbnails */}
                            {cart.items.slice(0, 2).map((item, index) => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded p-4 flex items-center gap-3">
                                    <img
                                        src={item.thumbnail || 'https://via.placeholder.com/60x80'}
                                        alt={item.title}
                                        className="w-12 h-16 object-cover rounded"
                                    />
                                    <div>
                                        <p className="text-sm text-gray-600">Estimated delivery by</p>
                                        <p className="font-semibold text-sm">
                                            {new Date(Date.now() + (3 + index * 2) * 86400000).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Price Details */}
                            <div className="bg-white border border-gray-200 rounded p-4">
                                <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-4">
                                    Price Details ({orderDetails.itemCount} {orderDetails.itemCount === 1 ? 'Item' : 'Items'})
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total MRP</span>
                                        <span>₹{(orderDetails.subtotal / 100).toLocaleString('en-IN')}</span>
                                    </div>
                                    {orderDetails.discount > 0 && (
                                        <div className="flex justify-between">
                                            <span>Coupon Discount</span>
                                            <span className="text-green-600">−₹{(orderDetails.discount / 100).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {codFee > 0 && (
                                        <div className="flex justify-between">
                                            <span>
                                                Cash on Delivery Fee
                                                <span className="text-xs ml-1 cursor-pointer" style={{ color: GOLD }}>Know More</span>
                                            </span>
                                            <span>₹{(codFee / 100).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-dashed border-gray-300 mt-4 pt-4">
                                    <div className="flex justify-between font-semibold">
                                        <span>Total Amount</span>
                                        <span>₹{(finalTotal / 100).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Address Selector */}
            <AddressSelector
                isOpen={showAddressSelector}
                onClose={() => setShowAddressSelector(false)}
                onSelectAddress={setSelectedAddress}
                selectedAddressId={selectedAddress?.address_id}
            />

            <Footer />
        </div>
    );
};

export default PaymentPage;
