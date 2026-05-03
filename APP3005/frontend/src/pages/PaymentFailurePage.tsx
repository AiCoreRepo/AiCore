import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RotateCcw, ShoppingBag } from 'lucide-react';

const GOLD = '#D4AF37';

const PaymentFailurePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderNumber =
        searchParams.get('orderNumber') ||
        searchParams.get('order') ||
        sessionStorage.getItem('pending_order_number') ||
        '';
    const reason = searchParams.get('reason') || 'Payment was not completed.';

    // Kept pending order in sessionStorage to allow retrying

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
            <div className="text-center px-6 max-w-md w-full">
                {/* Animated X icon */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: '#FEF2F2', border: '2px solid #FECACA' }}
                >
                    <XCircle className="w-12 h-12 text-red-500" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                    {orderNumber && (
                        <p className="text-gray-500 mb-1">
                            Order <span className="font-semibold text-gray-700">#{orderNumber}</span>
                        </p>
                    )}
                    <p className="text-sm text-gray-400 mb-8">{reason}</p>

                    {/* Reassurance note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                        <p className="text-sm text-amber-800 font-medium mb-1">💡 Don't worry</p>
                        <p className="text-xs text-amber-700">
                            Your order has been saved. No money has been deducted. You can retry the payment anytime.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/payment?retry=1')}
                            className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                            style={{ backgroundColor: GOLD }}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retry Payment
                        </button>
                        <button
                            onClick={() => navigate('/my-orders')}
                            className="w-full py-3.5 rounded-xl font-semibold text-gray-600 border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            View My Orders
                        </button>
                        <button
                            onClick={() => navigate('/collection')}
                            className="w-full py-3.5 rounded-xl font-semibold text-gray-400 flex items-center justify-center gap-2 hover:text-gray-600 transition-colors text-sm"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Continue Shopping
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PaymentFailurePage;
