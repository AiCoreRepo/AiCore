import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronUp, Tag, Gift, Percent, Heart, ChevronLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { AddressSelector } from '@/components/cart/AddressSelector';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Address } from '@/constants/address.constants';
import {
    STATIC_OFFERS,
    AVAILABLE_COUPONS,
    COUPON_MESSAGES,
} from '@/constants/cart.constants';
import { getDefaultAddress } from '@/lib/api';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Brand Colors
const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';
const GOLD_LIGHT = '#F5EDD6';

const CartPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cart, updateQuantity, removeFromCart } = useCart();
    const [promoCode, setPromoCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState('');
    const [showOffers, setShowOffers] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [showLoginConfirm, setShowLoginConfirm] = useState(false);

    // Track selected items by ID
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Initialize all items as selected when cart loads
    useEffect(() => {
        setSelectedItems(new Set(cart.items.map(item => item.id)));
    }, [cart.items.length]);

    // Fetch default address on load
    useEffect(() => {
        const fetchDefaultAddress = async () => {
            try {
                const address = await getDefaultAddress();
                setSelectedAddress(address);
            } catch (error) {
                console.error('Failed to fetch default address:', error);
            } finally {
                setIsLoadingAddress(false);
            }
        };
        fetchDefaultAddress();
    }, []);

    // Toggle individual item selection
    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Toggle all items selection
    const toggleAllItems = () => {
        if (selectedItems.size === cart.items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(cart.items.map(item => item.id)));
        }
    };

    // Calculate totals based on selected items only
    const selectedItemsData = useMemo(() => {
        const items = cart.items.filter(item => selectedItems.has(item.id));
        const subtotal = items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        return { items, subtotal, itemCount };
    }, [cart.items, selectedItems]);

    // Static coupon validation using constants
    const handleApplyCoupon = () => {
        setCouponError('');
        const code = promoCode.toUpperCase().trim();

        const coupon = AVAILABLE_COUPONS[code];
        if (coupon) {
            if (coupon.min_order_cents && selectedItemsData.subtotal < coupon.min_order_cents) {
                setCouponError(COUPON_MESSAGES.MIN_ORDER_NOT_MET);
                return;
            }

            let discount = coupon.discount_cents;
            // Handle dynamic discount for SAVE10
            if (code === 'SAVE10') {
                discount = Math.min(Math.round(selectedItemsData.subtotal * 0.1), 50000); // 10% up to ₹500
            }

            setAppliedCoupon({ code, discount });
            setPromoCode('');
        } else {
            setCouponError(COUPON_MESSAGES.INVALID_CODE);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    // Remove selected items
    const handleRemoveSelected = () => {
        selectedItems.forEach(itemId => {
            removeFromCart(itemId);
        });
        setSelectedItems(new Set());
    };

    // Navigate to product details
    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    // Calculate final total - ONLY product prices (no extra fees for now)
    const discountCents = appliedCoupon?.discount || 0;
    const finalTotal = selectedItemsData.subtotal - discountCents;

    const allSelected = cart.items.length > 0 && selectedItems.size === cart.items.length;

    const handleCheckout = () => {
        const paymentState = {
            selectedAddress,
            subtotal: selectedItemsData.subtotal,
            discount: discountCents,
            total: finalTotal,
            itemCount: selectedItemsData.itemCount,
        };

        if (user) {
            navigate('/payment', { state: paymentState });
        } else {
            setShowLoginConfirm(true);
        }
    };

    const handleLoginConfirm = () => {
        const paymentState = {
            selectedAddress,
            subtotal: selectedItemsData.subtotal,
            discount: discountCents,
            total: finalTotal,
            itemCount: selectedItemsData.itemCount,
        };

        navigate('/user-login', {
            state: {
                returnUrl: '/payment',
                returnState: paymentState
            }
        });
        setShowLoginConfirm(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1">
                {/* Back Button */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <button
                            onClick={() => navigate('/collection')}
                            className="flex items-center text-gray-500 hover:text-[#D4AF37] transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium text-sm">Back to Collection</span>
                        </button>
                    </div>
                </div>

                {/* Step Progress Bar - Mobile Optimized */}
                <div className="bg-white border-b border-gray-200">
                    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <span
                                className="font-medium pb-1 border-b-2"
                                style={{ color: GOLD, borderColor: GOLD }}
                            >
                                BAG
                            </span>
                            <span className="text-gray-300 hidden sm:inline">---------</span>
                            <span className="text-gray-300 sm:hidden">---</span>
                            <span className="text-gray-400">ADDRESS</span>
                            <span className="text-gray-300 hidden sm:inline">---------</span>
                            <span className="text-gray-300 sm:hidden">---</span>
                            <span className="text-gray-400">PAYMENT</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {cart.items.length === 0 ? (
                    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 sm:py-16">
                        <EmptyCart />
                    </div>
                ) : (
                    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 sm:py-6">
                        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                            {/* Left Column - Address & Items */}
                            <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                                {/* Delivery Address Section - Mobile Responsive */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Deliver to:</span>
                                                    {selectedAddress ? (
                                                        <span className="font-semibold text-xs sm:text-sm truncate">
                                                            {selectedAddress.full_name}, {selectedAddress.pincode}
                                                        </span>
                                                    ) : (
                                                        <span className="font-semibold text-xs sm:text-sm text-gray-400">
                                                            {isLoadingAddress ? 'Loading...' : 'Add Address'}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedAddress && (
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                        {selectedAddress.address_line1}
                                                        {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                                                        , {selectedAddress.city}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setShowAddressSelector(true)}
                                                className="px-3 sm:px-4 py-2 border-2 text-xs font-semibold uppercase tracking-wide transition-colors flex-shrink-0 w-full sm:w-auto text-center"
                                                style={{
                                                    borderColor: GOLD,
                                                    color: GOLD,
                                                }}
                                            >
                                                {selectedAddress ? 'Change' : 'Add'} Address
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Available Offers Section - Mobile Responsive */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setShowOffers(!showOffers)}
                                        className="w-full p-3 sm:p-4 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                            <span className="font-semibold text-xs sm:text-sm">Available Offers</span>
                                        </div>
                                        {showOffers ? (
                                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {showOffers && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                                                    {STATIC_OFFERS.map((offer) => (
                                                        <div key={offer.id} className="flex items-start gap-2 sm:gap-3 py-2 border-t border-gray-100">
                                                            <Tag className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm text-gray-800">{offer.title}</p>
                                                                <p className="text-xs text-gray-500 truncate">{offer.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="text-xs sm:text-sm font-medium hover:underline"
                                                        style={{ color: GOLD }}
                                                    >
                                                        Show More
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Cart Items - Mobile Responsive */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Selection Header - Mobile Optimized */}
                                    <div className="p-3 sm:p-4 border-b border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={toggleAllItems}
                                                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                                                    style={{ accentColor: GOLD }}
                                                />
                                                <span className="font-semibold text-xs sm:text-sm">
                                                    {selectedItems.size}/{cart.items.length} ITEMS SELECTED
                                                </span>
                                            </div>
                                            <div className="flex gap-3 sm:gap-4 text-xs text-gray-500 uppercase tracking-wide">
                                                <button
                                                    onClick={handleRemoveSelected}
                                                    disabled={selectedItems.size === 0}
                                                    className="hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>
                                                <span className="hidden sm:inline">|</span>
                                                <button className="hover:text-gray-800 flex items-center gap-1">
                                                    <Heart className="w-3 h-3" />
                                                    <span className="hidden xs:inline">Move to</span> Wishlist
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cart Items List - Mobile Optimized */}
                                    {cart.items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 sm:p-4 ${index !== cart.items.length - 1 ? 'border-b border-gray-200' : ''}`}
                                        >
                                            <div className="flex gap-2 sm:gap-4">
                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(item.id)}
                                                    onChange={() => toggleItemSelection(item.id)}
                                                    className="w-4 h-4 mt-1 sm:mt-2 cursor-pointer flex-shrink-0"
                                                    style={{ accentColor: GOLD }}
                                                />

                                                {/* Product Image - Responsive sizing */}
                                                <div
                                                    className="w-16 h-20 sm:w-20 sm:h-28 bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
                                                    onClick={() => handleProductClick(item.product_id)}
                                                >
                                                    <img
                                                        src={item.thumbnail || 'https://via.placeholder.com/200x280/F5F0E6/D4AF37?text=No+Image'}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = 'https://via.placeholder.com/200x280/F5F0E6/D4AF37?text=Image+Not+Found';
                                                        }}
                                                    />
                                                </div>

                                                {/* Product Details - Mobile Optimized */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between gap-2">
                                                        <div
                                                            className="cursor-pointer min-w-0 flex-1"
                                                            onClick={() => handleProductClick(item.product_id)}
                                                        >
                                                            <h3 className="font-semibold text-xs sm:text-sm text-gray-800 hover:underline truncate">
                                                                {item.creator.store_name}
                                                            </h3>
                                                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 hover:underline">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate hidden sm:block">
                                                                Sold by: {item.creator.store_name}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Size & Qty - Stack on small mobile */}
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                                                        {item.size && (
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                                                <span className="text-gray-600">Size:</span>
                                                                <span className="font-medium">{item.size}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                                            <span className="text-gray-600">Qty:</span>
                                                            <select
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                                                className="font-medium bg-transparent outline-none cursor-pointer"
                                                            >
                                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                                    <option key={n} value={n}>{n}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Price - More prominent on mobile */}
                                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
                                                        <span className="font-semibold text-sm sm:text-base">
                                                            ₹{((item.price_cents * item.quantity) / 100).toLocaleString('en-IN')}
                                                        </span>
                                                        {item.quantity > 1 && (
                                                            <span className="text-xs text-gray-500">
                                                                (₹{(item.price_cents / 100).toLocaleString('en-IN')} each)
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Delivery Info - Compact on mobile */}
                                                    <div className="mt-1 sm:mt-2">
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <span>✓ 14 days return available</span>
                                                        </div>
                                                        <div className="text-xs text-green-600 mt-0.5">
                                                            Delivery by 3-5 days
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column - Price Details & Coupons - Mobile at bottom */}
                            <div className="w-full lg:w-[380px] space-y-3 sm:space-y-4 flex-shrink-0">
                                {/* Coupons Section - Mobile Responsive */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                            <span className="font-semibold text-xs sm:text-sm uppercase tracking-wide">Coupons</span>
                                        </div>
                                    </div>

                                    {appliedCoupon ? (
                                        <div className="mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                                            <div>
                                                <p className="text-xs sm:text-sm font-medium text-green-700">{appliedCoupon.code} applied</p>
                                                <p className="text-xs text-green-600">
                                                    You save ₹{(appliedCoupon.discount / 100).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="text-red-500 text-xs font-medium hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm text-gray-700">Apply Coupons</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={promoCode}
                                                    onChange={(e) => {
                                                        setPromoCode(e.target.value.toUpperCase());
                                                        setCouponError('');
                                                    }}
                                                    placeholder="Enter coupon code"
                                                    className="flex-1 px-3 py-2 border border-gray-300 text-xs sm:text-sm focus:outline-none min-w-0"
                                                    style={{
                                                        borderColor: promoCode ? GOLD : undefined,
                                                    }}
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    disabled={!promoCode.trim()}
                                                    className="px-3 sm:px-4 py-2 text-white text-xs font-semibold uppercase tracking-wide transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                                                    style={{
                                                        backgroundColor: promoCode.trim() ? GOLD : undefined,
                                                    }}
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="text-red-500 text-xs mt-1">{couponError}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {COUPON_MESSAGES.HINT}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Gifting Section - Mobile Responsive */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        <Gift className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-xs sm:text-sm">Buying for a loved one?</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Gift Packaging and personalized message on card, Only for ₹35
                                            </p>
                                            <button
                                                className="text-xs font-medium mt-2 hover:underline"
                                                style={{ color: GOLD }}
                                            >
                                                ADD GIFT PACKAGE
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Details - Mobile Responsive */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-gray-600 mb-3 sm:mb-4">
                                        Price Details ({selectedItemsData.itemCount} {selectedItemsData.itemCount === 1 ? 'Item' : 'Items'})
                                    </h3>

                                    {selectedItems.size === 0 ? (
                                        <p className="text-xs sm:text-sm text-gray-500">No items selected</p>
                                    ) : (
                                        <>
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex justify-between text-xs sm:text-sm">
                                                    <span>Total Product Price</span>
                                                    <span>₹{(selectedItemsData.subtotal / 100).toLocaleString('en-IN')}</span>
                                                </div>
                                                {appliedCoupon && (
                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                        <span>Coupon Discount</span>
                                                        <span className="text-green-600">
                                                            -₹{(appliedCoupon.discount / 100).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-dashed border-gray-300 mt-3 sm:mt-4 pt-3 sm:pt-4">
                                                <div className="flex justify-between font-semibold text-sm sm:text-base">
                                                    <span>Total Amount</span>
                                                    <span>₹{(finalTotal / 100).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Place Order Button - Full width on mobile, sticky on mobile */}
                                <div className="lg:block">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleCheckout}
                                        disabled={selectedItems.size === 0}
                                        className="w-full text-white py-3 sm:py-4 font-semibold uppercase tracking-wide text-sm sm:text-base transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg"
                                        style={{
                                            backgroundColor: selectedItems.size > 0 ? GOLD : undefined,
                                        }}
                                    >
                                        {selectedItems.size === 0 ? 'Select Items to Continue' : 'Place Order'}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Sticky Place Order Bar */}
            {cart.items.length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-bold text-lg">₹{(finalTotal / 100).toLocaleString('en-IN')}</p>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={selectedItems.size === 0}
                            className="flex-1 text-white py-3 font-semibold uppercase tracking-wide text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg"
                            style={{
                                backgroundColor: selectedItems.size > 0 ? GOLD : undefined,
                            }}
                        >
                            Place Order
                        </button>
                    </div>
                </div>
            )}

            {/* Add padding at bottom when sticky bar is visible */}
            {cart.items.length > 0 && <div className="lg:hidden h-20" />}

            {/* Address Selector Modal */}
            <AddressSelector
                isOpen={showAddressSelector}
                onClose={() => setShowAddressSelector(false)}
                onSelectAddress={setSelectedAddress}
                selectedAddressId={selectedAddress?.address_id}
            />

            {/* Login Confirmation Dialog */}
            <AlertDialog open={showLoginConfirm} onOpenChange={setShowLoginConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign in to continue</AlertDialogTitle>
                        <AlertDialogDescription>
                            You need to be signed in to place an order. Would you like to sign in now?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLoginConfirm} style={{ backgroundColor: GOLD }}>
                            Sign In
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Footer />
        </div>
    );
};

export default CartPage;
