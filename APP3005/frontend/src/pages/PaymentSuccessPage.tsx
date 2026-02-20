import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';

const GOLD = '#D4AF37';

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderNumber = searchParams.get('order') || '';
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timer);
                    navigate('/my-orders');
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
            <div className="text-center px-6 max-w-md">
                {/* Animated checkmark */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${GOLD}15`, border: `2px solid ${GOLD}30` }}
                >
                    <CheckCircle2 className="w-12 h-12" style={{ color: GOLD }} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                    {orderNumber && (
                        <p className="text-gray-500 mb-1">
                            Order <span className="font-semibold text-gray-700">#{orderNumber}</span> confirmed
                        </p>
                    )}
                    <p className="text-sm text-gray-400 mb-8">
                        You'll receive a confirmation shortly.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/my-orders')}
                            className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                            style={{ backgroundColor: GOLD }}
                        >
                            <Package className="w-4 h-4" />
                            Track Your Order
                        </button>
                        <button
                            onClick={() => navigate('/collection')}
                            className="w-full py-3.5 rounded-xl font-semibold text-gray-600 border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Continue Shopping
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
                        Redirecting to orders in {countdown}s
                        <ArrowRight className="w-3 h-3" />
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
