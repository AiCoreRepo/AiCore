import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronUp, Tag, Gift, Percent, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { AddressSelector } from '@/components/cart/AddressSelector';
import { CouponDrawer } from '@/components/cart/CouponDrawer';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Address } from '@/constants/address.constants';
import {
    STATIC_OFFERS,
} from '@/constants/cart.constants';
import { useCoupon } from '@/hooks/useCoupon';
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
    const {
        appliedCoupon,
        isApplying,
        error: couponError,
        applyCoupon,
        removeCoupon,
        discountCents,
        freeShipping,
        availableCoupons,
        isLoadingCoupons,
        fetchAvailableCoupons,
    } = useCoupon();
    const [showOffers, setShowOffers] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [showCouponDrawer, setShowCouponDrawer] = useState(false);
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

    const handleRemoveCoupon = () => {
        removeCoupon();
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
    const finalTotal = selectedItemsData.subtotal - discountCents;

    const allSelected = cart.items.length > 0 && selectedItems.size === cart.items.length;

    const handleCheckout = () => {
        const paymentState = {
            selectedAddress,
            subtotal: selectedItemsData.subtotal,
            discount: discountCents,
            total: finalTotal,
            itemCount: selectedItemsData.itemCount,
            couponCode: appliedCoupon?.code || undefined,
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
            couponCode: appliedCoupon?.code || undefined,
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
            {/* Spacer for fixed navbar */}
            <div className="h-24"></div>

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
                        <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
                            <span
                                className="font-medium pb-1 border-b-2"
                                style={{ color: GOLD, borderColor: GOLD }}
                            >
                                BAG
                            </span>
                            <div className="w-12 sm:w-24 border-t border-dashed border-gray-300"></div>
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

                                {/* Available Offers Section - Hidden for now, will be used in future */}
                                {/* <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                                </div> */}

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
                                                        <QuantityStepper
                                                            quantity={item.quantity}
                                                            maxQuantity={item.max_quantity || 10}
                                                            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                                                            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
                                                        />
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
                                {/* Coupons Section — Click to open Drawer */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    {appliedCoupon ? (
                                        /* Applied coupon badge */
                                        <div className="p-3 sm:p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                                    <span className="font-semibold text-xs sm:text-sm uppercase tracking-wide">Coupons</span>
                                                </div>
                                            </div>
                                            <div className="relative overflow-hidden rounded-xl border border-green-200/60 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                                                <div className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 sm:mt-0 p-1.5 sm:p-2 bg-green-100/50 text-green-600 rounded-lg">
                                                            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                                                                    {appliedCoupon.code}
                                                                </p>
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-green-700 bg-green-100">
                                                                    APPLIED
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-green-600 font-medium mt-0.5">
                                                                You saved <span className="font-bold">₹{(discountCents / 100).toLocaleString('en-IN')}</span> on this order
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleRemoveCoupon}
                                                        className="text-xs font-semibold text-gray-400 hover:text-red-500 hover:underline uppercase tracking-wide transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowCouponDrawer(true)}
                                                className="w-full mt-2 text-xs font-medium hover:underline transition-colors text-center py-1"
                                                style={{ color: GOLD }}
                                            >
                                                View all coupons
                                            </button>
                                        </div>
                                    ) : (
                                        /* Clickable bar to open drawer */
                                        <button
                                            onClick={() => setShowCouponDrawer(true)}
                                            className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${GOLD}15` }}>
                                                    <Tag className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: GOLD }} />
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-semibold text-xs sm:text-sm block">Apply Coupons</span>
                                                    <span className="text-[11px] text-gray-400">Save more on your order</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        </button>
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
                                    <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wide text-gray-600 mb-3 sm:mb-4">
                                        Price Details ({selectedItemsData.itemCount} {selectedItemsData.itemCount === 1 ? 'Item' : 'Items'})
                                    </h3>

                                    {selectedItems.size === 0 ? (
                                        <p className="text-xs sm:text-sm text-gray-500">No items selected</p>
                                    ) : (
                                        <>
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex justify-between text-xs sm:text-sm font-sans">
                                                    <span>Total Product Price</span>
                                                    <span className="font-medium">₹{(selectedItemsData.subtotal / 100).toLocaleString('en-IN')}</span>
                                                </div>
                                                {appliedCoupon && (
                                                    <div className="flex justify-between text-xs sm:text-sm font-sans">
                                                        <span>Coupon Discount</span>
                                                        <span className="text-green-600 font-medium">
                                                            -₹{(discountCents / 100).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-dashed border-gray-300 mt-3 sm:mt-4 pt-3 sm:pt-4">
                                                <div className="flex justify-between font-sans font-semibold text-sm sm:text-base">
                                                    <span>Total Amount</span>
                                                    <span>₹{(finalTotal / 100).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Place Order Button - Desktop Only (Hidden on mobile as we have sticky bar) */}
                                <div className="hidden lg:block">
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

            {/* Coupon Drawer */}
            <CouponDrawer
                isOpen={showCouponDrawer}
                onClose={() => setShowCouponDrawer(false)}
                availableCoupons={availableCoupons}
                isLoadingCoupons={isLoadingCoupons}
                appliedCoupon={appliedCoupon}
                isApplying={isApplying}
                couponError={couponError}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
                onFetchCoupons={fetchAvailableCoupons}
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
