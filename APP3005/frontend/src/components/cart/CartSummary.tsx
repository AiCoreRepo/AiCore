import { useNavigate } from 'react-router-dom';
import { Tag, Truck, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCartPrice, calculateShippingProgress } from '@/utils/cartUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useCoupon } from '@/hooks/useCoupon';

export const CartSummary = () => {
    const navigate = useNavigate();
    const { cart } = useCart();
    const [couponCode, setCouponCode] = useState('');
    const {
        appliedCoupon,
        isApplying,
        error: couponError,
        applyCoupon,
        removeCoupon,
        discountCents,
        freeShipping,
    } = useCoupon();

    const { summary } = cart;
    const shippingProgress = calculateShippingProgress(summary.subtotal_cents);

    // Recalculate totals with coupon discount
    const effectiveShippingCents = freeShipping ? 0 : summary.shipping_cents;
    const effectiveDiscountCents = discountCents;
    const effectiveTotalCents = summary.subtotal_cents + summary.tax_cents + effectiveShippingCents - effectiveDiscountCents;

    const handleApplyCoupon = async () => {
        const success = await applyCoupon(couponCode);
        if (success) {
            setCouponCode(''); // Clear input after successful apply
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponCode('');
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    return (
        <div
            className="rounded-lg p-6 sticky top-24"
            style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
        >
            {/* Title */}
            <h2
                className="text-lg font-serif font-semibold mb-4"
                style={{ color: '#2C2C2C' }}
            >
                Order Summary
            </h2>

            {/* Free Shipping Progress */}
            {!shippingProgress.isFree && !freeShipping && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4" style={{ color: '#D4AF37' }} />
                        <p className="text-xs text-gray-600">
                            Add {formatCartPrice(shippingProgress.remaining, summary.currency)} more for FREE shipping
                        </p>
                    </div>
                    <Progress
                        value={shippingProgress.percentage}
                        className="h-2"
                        style={{
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        }}
                    />
                </div>
            )}

            {(shippingProgress.isFree || freeShipping) && (
                <div
                    className="flex items-center gap-2 mb-6 p-3 rounded-lg"
                    style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                >
                    <Truck className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-medium text-green-700">
                        {freeShipping
                            ? '🎉 Free shipping with your coupon!'
                            : 'Congratulations! You get FREE shipping'}
                    </p>
                </div>
            )}

            {/* Coupon Code Section */}
            <div className="mb-6">
                {/* Applied Coupon Badge */}
                {appliedCoupon ? (
                    <div
                        className="flex items-center justify-between p-3 rounded-lg border transition-all animate-in fade-in duration-300"
                        style={{
                            background: 'rgba(34, 197, 94, 0.08)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                        }}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-green-700 tracking-wide">
                                    {appliedCoupon.code}
                                </p>
                                <p className="text-[10px] text-green-600 truncate">
                                    {appliedCoupon.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveCoupon}
                            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                            title="Remove coupon"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Coupon Input */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Coupon code"
                                    value={couponCode}
                                    onChange={(e) => {
                                        setCouponCode(e.target.value.toUpperCase());
                                        // Clear error when user types
                                        if (couponError) removeCoupon();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && couponCode) handleApplyCoupon();
                                    }}
                                    className="pl-10 text-sm uppercase tracking-wider"
                                    disabled={isApplying}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="px-4"
                                disabled={!couponCode || isApplying}
                                onClick={handleApplyCoupon}
                            >
                                {isApplying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Apply'
                                )}
                            </Button>
                        </div>

                        {/* Error Message */}
                        {couponError && (
                            <div className="flex items-start gap-1.5 mt-2 animate-in fade-in duration-200">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-500">{couponError}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Separator className="my-4" />

            {/* Price Breakdown */}
            <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({summary.item_count} items)</span>
                    <span className="font-medium" style={{ color: '#2C2C2C' }}>
                        {formatCartPrice(summary.subtotal_cents, summary.currency)}
                    </span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (GST 18%)</span>
                    <span className="font-medium" style={{ color: '#2C2C2C' }}>
                        {formatCartPrice(summary.tax_cents, summary.currency)}
                    </span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium" style={{ color: (shippingProgress.isFree || freeShipping) ? '#22C55E' : '#2C2C2C' }}>
                        {(shippingProgress.isFree || freeShipping) ? 'FREE' : formatCartPrice(summary.shipping_cents, summary.currency)}
                    </span>
                </div>

                {/* Coupon Discount Line */}
                {effectiveDiscountCents > 0 && (
                    <div className="flex justify-between text-sm animate-in fade-in duration-300">
                        <span className="text-gray-600 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Coupon Discount
                            {appliedCoupon && (
                                <span className="text-[10px] text-green-600 font-medium">
                                    ({appliedCoupon.code})
                                </span>
                            )}
                        </span>
                        <span className="font-medium text-green-600">
                            -{formatCartPrice(effectiveDiscountCents, summary.currency)}
                        </span>
                    </div>
                )}
            </div>

            <Separator className="my-4" />

            {/* Total */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-base font-serif font-semibold" style={{ color: '#2C2C2C' }}>
                    Total
                </span>
                <div className="text-right">
                    {effectiveDiscountCents > 0 && (
                        <span className="text-sm text-gray-400 line-through mr-2">
                            {formatCartPrice(summary.subtotal_cents + summary.tax_cents + summary.shipping_cents, summary.currency)}
                        </span>
                    )}
                    <span
                        className="text-2xl font-serif font-bold"
                        style={{ color: '#D4AF37' }}
                    >
                        {formatCartPrice(Math.max(0, effectiveTotalCents), summary.currency)}
                    </span>
                </div>
            </div>

            {/* Savings Banner */}
            {effectiveDiscountCents > 0 && (
                <div
                    className="mb-4 p-2.5 rounded-lg text-center animate-in fade-in duration-300"
                    style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                    }}
                >
                    <p className="text-xs font-semibold text-green-700">
                        🎉 You're saving {formatCartPrice(effectiveDiscountCents, summary.currency)} on this order!
                    </p>
                </div>
            )}

            {/* Checkout Button */}
            <Button
                onClick={handleCheckout}
                className="w-full py-6 text-sm font-medium rounded-full transition-all duration-300 hover:scale-[1.02]"
                style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                    color: '#1a1a1a',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                }}
            >
                Proceed to Checkout
            </Button>

            {/* Security Badge */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    🔒 Secure checkout powered by Stripe
                </p>
            </div>
        </div>
    );
};
