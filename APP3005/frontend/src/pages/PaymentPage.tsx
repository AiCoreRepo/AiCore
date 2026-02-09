import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import {
    Star,
    Banknote,
    Smartphone,
    CreditCard,
    Clock,
    Wallet,
    Calculator,
    Building2,
    Gift,
    ChevronDown,
    Shield,
    ArrowLeft,
    MapPin,
    Edit2
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AddressSelector } from '@/components/cart/AddressSelector';
import { Address } from '@/constants/address.constants';
import {
    PAYMENT_METHODS,
    COD_FEE_CENTS,
    BANK_OFFERS,
    NET_BANKING_OPTIONS,
    WALLET_OPTIONS,
    PAYMENT_MESSAGES
} from '@/constants/payment.constants';
import { motion, AnimatePresence } from 'framer-motion';
import { getDefaultAddress } from '@/lib/api';

// Brand Colors
const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';
const GOLD_LIGHT = '#F5EDD6';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Star,
    Banknote,
    Smartphone,
    CreditCard,
    Clock,
    Wallet,
    Calculator,
    Building2,
};

interface LocationState {
    selectedAddress?: Address;
    subtotal?: number;
    discount?: number;
    total?: number;
    itemCount?: number;
}

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart } = useCart();
    const [selectedMethod, setSelectedMethod] = useState('recommended');
    const [codOption, setCodOption] = useState<'cash' | 'upi'>('cash');
    const [showBankOffers, setShowBankOffers] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);

    // Get order details from location state or recalculate
    const state = location.state as LocationState;

    // Initialize address from state or fetch default
    useEffect(() => {
        const initAddress = async () => {
            if (state?.selectedAddress) {
                setSelectedAddress(state.selectedAddress);
                setIsLoadingAddress(false);
            } else {
                try {
                    const address = await getDefaultAddress();
                    setSelectedAddress(address);
                } catch (error) {
                    console.error('Failed to fetch default address:', error);
                } finally {
                    setIsLoadingAddress(false);
                }
            }
        };
        initAddress();
    }, [state?.selectedAddress]);

    const orderDetails = useMemo(() => {
        if (state?.total) {
            return {
                subtotal: state.subtotal || 0,
                discount: state.discount || 0,
                total: state.total,
                itemCount: state.itemCount || 0,
            };
        }
        // Fallback: calculate from cart
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
        const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        return {
            subtotal,
            discount: 0,
            total: subtotal,
            itemCount,
        };
    }, [state, cart.items]);

    // COD fee
    const codFee = selectedMethod === 'cod' || selectedMethod === 'recommended' ? COD_FEE_CENTS : 0;
    const finalTotal = orderDetails.total + codFee;

    const handlePlaceOrder = () => {
        // TODO: Implement order placement
        alert('Order placed successfully! (Demo)');
        navigate('/');
    };

    const renderPaymentContent = () => {
        switch (selectedMethod) {
            case 'recommended':
            case 'cod':
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">
                            {selectedMethod === 'recommended' ? 'Recommended Payment Options' : 'Cash On Delivery Options'}
                        </h3>

                        {/* Cash/UPI Option */}
                        <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${codOption === 'cash' ? 'border-2' : 'border-gray-200'
                                }`}
                            style={{ borderColor: codOption === 'cash' ? GOLD : undefined }}
                            onClick={() => setCodOption('cash')}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${codOption === 'cash' ? '' : 'border-gray-300'
                                        }`}
                                    style={{ borderColor: codOption === 'cash' ? GOLD : undefined }}
                                >
                                    {codOption === 'cash' && (
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: GOLD }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium">Cash on Delivery (Cash/UPI)</span>
                                    <span className="ml-2 p-1 bg-gray-100 rounded text-xs">💳</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 ml-8">
                                {PAYMENT_MESSAGES.COD_FEE_INFO}
                            </p>
                        </div>
                    </div>
                );

            case 'upi':
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Pay using UPI</h3>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm text-gray-600 mb-2">Enter your UPI ID</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="yourname@upi"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                                />
                                <button
                                    className="px-4 py-2 border text-sm font-medium rounded"
                                    style={{ borderColor: GOLD, color: GOLD }}
                                >
                                    VERIFY
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{PAYMENT_MESSAGES.UPI_HINT}</p>
                        </div>
                    </div>
                );

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
                            {NET_BANKING_OPTIONS.map((bank) => (
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
                        {WALLET_OPTIONS.map((wallet) => (
                            <div key={wallet.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 cursor-pointer">
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            {/* Spacer for fixed navbar */}
            <div className="h-20"></div>

            <main className="flex-1">
                {/* Step Progress Bar - Clean Design */}
                <div className="bg-white border-b border-gray-200 py-5">
                    <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                        <div className="flex items-center justify-center gap-4">
                            {/* CART Step - Clickable to go back */}
                            <button
                                onClick={() => navigate('/cart')}
                                className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-sm font-medium tracking-[0.15em]"
                            >
                                CART
                            </button>

                            {/* Dashed Line Connector */}
                            <div className="w-24 border-t-2 border-dashed border-gray-300"></div>

                            {/* PAYMENT Step - Active/Current */}
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
                        {/* Left Column - Address & Payment Options */}
                        <div className="flex-1 space-y-3">
                            {/* Compact Delivery Address Section */}
                            <div className="bg-white border border-gray-200 rounded">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />
                                        <div className="flex-1 min-w-0">
                                            {selectedAddress ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm">Deliver to: {selectedAddress.full_name}</span>
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
                                                    {isLoadingAddress ? 'Loading address...' : 'No address selected - Click to add'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddressSelector(true)}
                                        className="px-3 py-1.5 border text-xs font-semibold uppercase tracking-wide transition-colors flex items-center gap-1.5 rounded flex-shrink-0 ml-3"
                                        style={{ borderColor: GOLD, color: GOLD }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = GOLD_LIGHT}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showBankOffers ? 'rotate-180' : ''}`} />
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
                                                {BANK_OFFERS.map((offer) => (
                                                    <p key={offer.id}>• {offer.description}</p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Choose Payment Mode */}
                            <div className="bg-white border border-gray-200 rounded">
                                <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-600 p-4 border-b border-gray-200">
                                    Choose Payment Mode
                                </h2>

                                <div className="flex">
                                    {/* Payment Method List */}
                                    <div className="w-[240px] border-r border-gray-200">
                                        {PAYMENT_METHODS.map((method) => {
                                            const Icon = ICON_MAP[method.icon];
                                            const isSelected = selectedMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setSelectedMethod(method.id)}
                                                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all border-l-4 ${isSelected
                                                        ? 'bg-gray-50'
                                                        : 'border-transparent hover:bg-gray-50'
                                                        }`}
                                                    style={{
                                                        borderLeftColor: isSelected ? GOLD : 'transparent',
                                                    }}
                                                >
                                                    {Icon && (
                                                        <Icon
                                                            className="w-5 h-5"
                                                            style={{ color: isSelected ? GOLD : '#6b7280' }}
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <span
                                                            className={`text-sm ${isSelected ? 'font-medium' : ''}`}
                                                            style={{ color: isSelected ? GOLD : '#374151' }}
                                                        >
                                                            {method.label}
                                                        </span>
                                                        {method.offers && (
                                                            <span className="ml-2 text-xs" style={{ color: GOLD }}>
                                                                {method.offers}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Payment Content */}
                                    <div className="flex-1 p-6">
                                        {renderPaymentContent()}

                                        {/* Place Order Button */}
                                        <motion.button
                                            onClick={handlePlaceOrder}
                                            disabled={!selectedAddress}
                                            whileHover={{ scale: selectedAddress ? 1.01 : 1 }}
                                            whileTap={{ scale: selectedAddress ? 0.99 : 1 }}
                                            className="w-full mt-6 py-4 text-white font-semibold uppercase tracking-wide rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            style={{ backgroundColor: selectedAddress ? GOLD : undefined }}
                                            onMouseEnter={(e) => {
                                                if (selectedAddress) e.currentTarget.style.backgroundColor = GOLD_HOVER;
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedAddress) e.currentTarget.style.backgroundColor = GOLD;
                                            }}
                                        >
                                            {selectedAddress ? 'Place Order' : 'Select Address to Continue'}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Gift Card Section */}
                            <div className="bg-white border border-gray-200 rounded p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Gift className="w-5 h-5 text-gray-500" />
                                        <span className="font-medium text-sm">Have a Gift Card?</span>
                                    </div>
                                    <button
                                        className="text-sm font-medium uppercase"
                                        style={{ color: GOLD }}
                                    >
                                        Apply Gift Card
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Price Details */}
                        <div className="w-full lg:w-[340px] space-y-4">
                            {/* Delivery Estimates */}
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
                                            {new Date(Date.now() + (3 + index * 2) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
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
                                            <span className="text-green-600">
                                                -₹{(orderDetails.discount / 100).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                    {codFee > 0 && (
                                        <div className="flex justify-between">
                                            <span>
                                                Cash/Pay on Delivery Fee
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

            {/* Address Selector Modal */}
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
