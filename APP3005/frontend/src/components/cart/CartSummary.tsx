import { useNavigate } from 'react-router-dom';
import { Tag, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCartPrice, calculateShippingProgress } from '@/utils/cartUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

export const CartSummary = () => {
    const navigate = useNavigate();
    const { cart } = useCart();
    const [couponCode, setCouponCode] = useState('');

    const { summary } = cart;
    const shippingProgress = calculateShippingProgress(summary.subtotal_cents);

    const handleCheckout = () => {
        // TODO: Navigate to checkout page when implemented
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
            {!shippingProgress.isFree && (
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

            {shippingProgress.isFree && (
                <div
                    className="flex items-center gap-2 mb-6 p-3 rounded-lg"
                    style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                >
                    <Truck className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-medium text-green-700">
                        Congratulations! You get FREE shipping
                    </p>
                </div>
            )}

            {/* Coupon Code */}
            <div className="mb-6">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="pl-10 text-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="px-4"
                        disabled={!couponCode}
                    >
                        Apply
                    </Button>
                </div>
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
                    <span className="font-medium" style={{ color: shippingProgress.isFree ? '#22C55E' : '#2C2C2C' }}>
                        {shippingProgress.isFree ? 'FREE' : formatCartPrice(summary.shipping_cents, summary.currency)}
                    </span>
                </div>

                {summary.discount_cents > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-green-600">
                            -{formatCartPrice(summary.discount_cents, summary.currency)}
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
                <span
                    className="text-2xl font-serif font-bold"
                    style={{ color: '#D4AF37' }}
                >
                    {formatCartPrice(summary.total_cents, summary.currency)}
                </span>
            </div>

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
                    🔒 Secure checkout powered by Razorpay
                </p>
            </div>
        </div>
    );
};
