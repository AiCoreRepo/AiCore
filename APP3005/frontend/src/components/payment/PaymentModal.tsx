import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Smartphone, CreditCard, Building2, Wallet, Banknote,
    Shield, Lock, ChevronRight, CheckCircle2, Zap, ArrowLeft,
    Copy, Check, AlertCircle, Sparkles,
} from 'lucide-react';
import { paymentApi } from '@/features/orders/api/payment.api';
import { usePayU } from '@/hooks/usePayU';
import { useToast } from '@/hooks/use-toast';

// ── Brand ─────────────────────────────────────────────────────────────────────
const GOLD = '#D4AF37';
const GOLD_BG = 'rgba(212,175,55,0.10)';
const GOLD_BORDER = 'rgba(212,175,55,0.30)';
const DARK = '#0F0F0F';

// ── Tab config ────────────────────────────────────────────────────────────────
type TabId = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
}

const TABS: Tab[] = [
    { id: 'upi', label: 'UPI', icon: <Smartphone className="w-4 h-4" />, badge: 'FAST' },
    { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'netbanking', label: 'Net Banking', icon: <Building2 className="w-4 h-4" /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'cod', label: 'COD', icon: <Banknote className="w-4 h-4" /> },
];

// ── Props ─────────────────────────────────────────────────────────────────────
export interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderNumber: string;
    amountPaise: number;          // total in paise
    onSuccess: () => void;        // called after payment verified
    onCODSuccess: () => void;     // called for COD orders
}

// ─────────────────────────────────────────────────────────────────────────────
// UPI PANEL
// ─────────────────────────────────────────────────────────────────────────────
const UpiPanel = ({ onPay, loading }: { onPay: (method: string) => void; loading: boolean }) => {
    const [upiId, setUpiId] = useState('');
    const [error, setError] = useState('');

    const validate = () => {
        if (!upiId.trim()) { setError('Please enter your UPI ID'); return false; }
        if (!/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
            setError('Enter a valid UPI ID (e.g. name@upi)'); return false;
        }
        setError('');
        return true;
    };

    const apps = [
        { name: 'GPay', color: '#4285F4', letter: 'G' },
        { name: 'PhonePe', color: '#5F259F', letter: 'P' },
        { name: 'Paytm', color: '#00BAF2', letter: 'T' },
        { name: 'BHIM', color: '#00A651', letter: 'B' },
    ];

    return (
        <div className="space-y-5">
            {/* App shortcuts */}
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Pay via App</p>
                <div className="grid grid-cols-4 gap-3">
                    {apps.map(app => (
                        <motion.button
                            key={app.name}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onPay('upi')}
                            disabled={loading}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white hover:shadow-md transition-all"
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: app.color }}
                            >
                                {app.letter}
                            </div>
                            <span className="text-xs text-gray-600 font-medium">{app.name}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">or enter UPI ID</span>
                <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* UPI ID input */}
            <div>
                <div className="relative">
                    <input
                        type="text"
                        value={upiId}
                        onChange={e => { setUpiId(e.target.value); setError(''); }}
                        placeholder="yourname@upi"
                        className="w-full px-4 py-3.5 rounded-xl border-2 text-sm outline-none transition-all bg-gray-50 focus:bg-white"
                        style={{ borderColor: error ? '#EF4444' : upiId ? GOLD : '#E5E7EB' }}
                    />
                    {upiId && !error && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                </div>
                {error && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {error}
                    </p>
                )}
            </div>

            <PayButton
                onClick={() => { if (validate()) onPay('upi'); }}
                loading={loading}
                label="Verify & Pay"
                icon={<Zap className="w-4 h-4" />}
            />

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" /> UPI payments are secured by NPCI
            </p>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD PANEL
// ─────────────────────────────────────────────────────────────────────────────
const CardPanel = ({ onPay, loading }: { onPay: (method: string) => void; loading: boolean }) => {
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [focused, setFocused] = useState('');

    const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExpiry = (v: string) => {
        const d = v.replace(/\D/g, '').slice(0, 4);
        return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    };

    const isVisa = card.number.startsWith('4');
    const isMC = ['5', '2'].includes(card.number[0]);
    const isRuPay = card.number.startsWith('6');

    return (
        <div className="space-y-4">
            {/* Card preview */}
            <motion.div
                className="relative h-44 rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
                style={{
                    background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
                animate={{ rotateY: focused === 'cvv' ? 180 : 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }}
                />

                <div className="flex justify-between items-start relative z-10">
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80" />
                    <div className="text-white/60 text-xs font-bold tracking-widest">
                        {isVisa ? 'VISA' : isMC ? 'MASTERCARD' : isRuPay ? 'RUPAY' : ''}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/40 text-xs mb-1 tracking-widest">CARD NUMBER</p>
                    <p className="text-white font-mono text-lg tracking-[0.2em]">
                        {card.number || '•••• •••• •••• ••••'}
                    </p>
                </div>

                <div className="flex justify-between relative z-10">
                    <div>
                        <p className="text-white/40 text-[10px] tracking-widest">CARD HOLDER</p>
                        <p className="text-white text-sm font-medium uppercase tracking-wider">
                            {card.name || 'YOUR NAME'}
                        </p>
                    </div>
                    <div>
                        <p className="text-white/40 text-[10px] tracking-widest">EXPIRES</p>
                        <p className="text-white text-sm font-medium">{card.expiry || 'MM/YY'}</p>
                    </div>
                </div>
            </motion.div>

            {/* Inputs */}
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Card Number"
                    value={card.number}
                    onChange={e => setCard(p => ({ ...p, number: formatCard(e.target.value) }))}
                    onFocus={() => setFocused('number')}
                    onBlur={() => setFocused('')}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-gray-50 focus:bg-white transition-all font-mono tracking-widest"
                    style={{ borderColor: focused === 'number' ? GOLD : '#E5E7EB' }}
                />
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                        onFocus={() => setFocused('expiry')}
                        onBlur={() => setFocused('')}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-gray-50 focus:bg-white transition-all"
                        style={{ borderColor: focused === 'expiry' ? GOLD : '#E5E7EB' }}
                    />
                    <input
                        type="password"
                        placeholder="CVV"
                        maxLength={4}
                        value={card.cvv}
                        onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        onFocus={() => setFocused('cvv')}
                        onBlur={() => setFocused('')}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-gray-50 focus:bg-white transition-all"
                        style={{ borderColor: focused === 'cvv' ? GOLD : '#E5E7EB' }}
                    />
                </div>
                <input
                    type="text"
                    placeholder="Name on Card"
                    value={card.name}
                    onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-gray-50 focus:bg-white transition-all uppercase tracking-wider"
                    style={{ borderColor: focused === 'name' ? GOLD : '#E5E7EB' }}
                />
            </div>

            <PayButton onClick={() => onPay('card')} loading={loading} label="Pay Securely" icon={<Lock className="w-4 h-4" />} />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// NET BANKING PANEL
// ─────────────────────────────────────────────────────────────────────────────
const NetBankingPanel = ({ onPay, loading }: { onPay: (method: string) => void; loading: boolean }) => {
    const [selected, setSelected] = useState('');
    const banks = [
        { id: 'hdfc', name: 'HDFC Bank', color: '#004C8F' },
        { id: 'sbi', name: 'SBI', color: '#22409A' },
        { id: 'icici', name: 'ICICI Bank', color: '#F58220' },
        { id: 'axis', name: 'Axis Bank', color: '#97144D' },
        { id: 'kotak', name: 'Kotak', color: '#EE3124' },
        { id: 'yes', name: 'Yes Bank', color: '#00529B' },
    ];

    return (
        <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select Your Bank</p>
            <div className="grid grid-cols-2 gap-2.5">
                {banks.map(bank => (
                    <motion.button
                        key={bank.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelected(bank.id)}
                        className="flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left"
                        style={{
                            borderColor: selected === bank.id ? GOLD : '#E5E7EB',
                            backgroundColor: selected === bank.id ? GOLD_BG : 'white',
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: bank.color }}
                        >
                            {bank.name[0]}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 truncate">{bank.name}</span>
                        {selected === bank.id && (
                            <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: GOLD }} />
                        )}
                    </motion.button>
                ))}
            </div>

            <PayButton
                onClick={() => selected && onPay('netbanking')}
                loading={loading}
                label={selected ? `Pay via ${banks.find(b => b.id === selected)?.name}` : 'Select a Bank'}
                disabled={!selected}
                icon={<Building2 className="w-4 h-4" />}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// WALLET PANEL
// ─────────────────────────────────────────────────────────────────────────────
const WalletPanel = ({ onPay, loading }: { onPay: (method: string) => void; loading: boolean }) => {
    const [selected, setSelected] = useState('');
    const wallets = [
        { id: 'paytm', name: 'Paytm', color: '#00BAF2', balance: '₹1,240' },
        { id: 'phonepe', name: 'PhonePe', color: '#5F259F', balance: '₹850' },
        { id: 'amazon', name: 'Amazon Pay', color: '#FF9900', balance: '₹320' },
        { id: 'mobikwik', name: 'Mobikwik', color: '#E91E8C', balance: '₹0' },
    ];

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select Wallet</p>
            {wallets.map(w => (
                <motion.button
                    key={w.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(w.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                        borderColor: selected === w.id ? GOLD : '#E5E7EB',
                        backgroundColor: selected === w.id ? GOLD_BG : 'white',
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: w.color }}
                    >
                        {w.name[0]}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{w.name}</p>
                        <p className="text-xs text-gray-400">Balance: {w.balance}</p>
                    </div>
                    <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: selected === w.id ? GOLD : '#D1D5DB' }}
                    >
                        {selected === w.id && (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
                        )}
                    </div>
                </motion.button>
            ))}

            <PayButton
                onClick={() => selected && onPay('wallet')}
                loading={loading}
                label={selected ? `Pay via ${wallets.find(w => w.id === selected)?.name}` : 'Select a Wallet'}
                disabled={!selected}
                icon={<Wallet className="w-4 h-4" />}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// COD PANEL
// ─────────────────────────────────────────────────────────────────────────────
const CodPanel = ({ onPay, loading, amountPaise }: { onPay: () => void; loading: boolean; amountPaise: number }) => (
    <div className="space-y-5">
        <div className="rounded-2xl p-5 border border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <p className="font-semibold text-gray-800 mb-1">Cash on Delivery</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Pay <strong>₹{((amountPaise) / 100).toLocaleString('en-IN')}</strong> in cash or UPI when your order arrives at your doorstep.
                    </p>
                </div>
            </div>
        </div>

        <div className="space-y-3">
            {[
                { icon: '📦', text: 'Order will be dispatched after confirmation' },
                { icon: '🚚', text: 'Delivery in 5–7 business days' },
                { icon: '💵', text: '₹10 handling fee included in total' },
                { icon: '🔄', text: 'Easy returns within 7 days' },
            ].map(item => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">{item.icon}</span>
                    {item.text}
                </div>
            ))}
        </div>

        <PayButton onClick={onPay} loading={loading} label="Place Order (Pay on Delivery)" icon={<Banknote className="w-4 h-4" />} />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAY BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const PayButton = ({
    onClick, loading, label, icon, disabled = false,
}: { onClick: () => void; loading: boolean; label: string; icon?: React.ReactNode; disabled?: boolean }) => (
    <motion.button
        onClick={onClick}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.01, y: -1 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.99 } : {}}
        className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 relative overflow-hidden"
        style={{
            backgroundColor: disabled ? '#E5E7EB' : GOLD,
            color: disabled ? '#9CA3AF' : 'white',
            boxShadow: disabled ? 'none' : `0 8px 30px rgba(212,175,55,0.45)`,
        }}
    >
        {/* Shimmer on hover */}
        {!disabled && !loading && (
            <motion.div
                className="absolute inset-0 opacity-0 hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
        )}
        {loading ? (
            <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing…</span>
            </>
        ) : (
            <>{icon}<span>{label}</span></>
        )}
    </motion.button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
const SuccessOverlay = ({ orderNumber }: { orderNumber: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #0F0F0F 0%, #1a1a1a 100%)' }}
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: `radial-gradient(circle, ${GOLD}30, ${GOLD}10)`, border: `2px solid ${GOLD}50` }}
        >
            <CheckCircle2 className="w-12 h-12" style={{ color: GOLD }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
            <p className="text-2xl font-bold text-white mb-2">Payment Successful!</p>
            <p className="text-gray-400 text-sm">Order #{orderNumber} confirmed</p>
            <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
                <span className="text-sm" style={{ color: GOLD }}>Redirecting to your orders…</span>
            </div>
        </motion.div>
    </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const PaymentModal = ({
    isOpen, onClose, orderId, orderNumber, amountPaise, onSuccess, onCODSuccess,
}: PaymentModalProps) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabId>('upi');
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) { setActiveTab('upi'); setPaid(false); setLoading(false); }
    }, [isOpen]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // PayU hook
    const { redirectToPayU } = usePayU();

    const handleOnlinePay = async (_method: string) => {
        setLoading(true);
        try {
            const payuPayload = await paymentApi.initiatePayment(orderId);
            // Full-page redirect to PayU's hosted checkout
            redirectToPayU(payuPayload);
            // Note: loading stays true — page is navigating away
        } catch (err: any) {
            setLoading(false);
            toast({ title: 'Failed to initiate payment', description: err?.response?.data?.message || err?.message, variant: 'destructive' });
        }
    };

    const handleCOD = () => {
        setLoading(true);
        // COD is already handled by the parent — just signal success
        setTimeout(() => {
            setLoading(false);
            onCODSuccess();
        }, 500);
    };

    const amountDisplay = `₹${(amountPaise / 100).toLocaleString('en-IN')}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
                        onClick={!loading ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        style={{ pointerEvents: 'none' }}
                    >
                        <div
                            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
                            style={{ maxHeight: '92vh', pointerEvents: 'auto' }}
                        >
                            {/* Success overlay */}
                            {paid && <SuccessOverlay orderNumber={orderNumber} />}

                            {/* ── HEADER ── */}
                            <div
                                className="relative px-5 pt-5 pb-4 flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1a1a2e 100%)` }}
                            >
                                {/* Drag handle (mobile) */}
                                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/50 text-xs font-medium tracking-widest uppercase mb-0.5">Complete Payment</p>
                                        <p className="text-white font-bold text-xl">{amountDisplay}</p>
                                        <p className="text-white/40 text-xs mt-0.5">Order #{orderNumber}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(212,175,55,0.15)', border: `1px solid ${GOLD_BORDER}` }}>
                                            <Lock className="w-3 h-3" style={{ color: GOLD }} />
                                            <span className="text-xs font-semibold" style={{ color: GOLD }}>Secured</span>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            disabled={loading}
                                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                        >
                                            <X className="w-4 h-4 text-white/70" />
                                        </button>
                                    </div>
                                </div>

                                {/* Tab bar */}
                                <div className="flex gap-1 mt-4 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold tracking-wide transition-all relative"
                                            style={{
                                                backgroundColor: activeTab === tab.id ? GOLD : 'transparent',
                                                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.45)',
                                            }}
                                        >
                                            {tab.icon}
                                            <span className="hidden sm:block">{tab.label}</span>
                                            {tab.badge && activeTab !== tab.id && (
                                                <span
                                                    className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full"
                                                    style={{ backgroundColor: GOLD, color: 'white' }}
                                                >
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── BODY ── */}
                            <div className="flex-1 overflow-y-auto px-5 py-5">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        {activeTab === 'upi' && <UpiPanel onPay={handleOnlinePay} loading={loading} />}
                                        {activeTab === 'card' && <CardPanel onPay={handleOnlinePay} loading={loading} />}
                                        {activeTab === 'netbanking' && <NetBankingPanel onPay={handleOnlinePay} loading={loading} />}
                                        {activeTab === 'wallet' && <WalletPanel onPay={handleOnlinePay} loading={loading} />}
                                        {activeTab === 'cod' && <CodPanel onPay={handleCOD} loading={loading} amountPaise={amountPaise} />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* ── FOOTER ── */}
                            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 256-bit SSL</span>
                                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> PCI DSS</span>
                                    <span className="flex items-center gap-1 font-semibold" style={{ color: GOLD }}>
                                        <Zap className="w-3 h-3" /> Secured by PayU
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
