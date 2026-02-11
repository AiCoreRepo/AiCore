import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CartBadgeProps {
    onClick?: () => void;
    showLabel?: boolean;
}

export const CartBadge = ({ onClick, showLabel = false }: CartBadgeProps) => {
    const { itemCount } = useCart();

    return (
        <button
            onClick={onClick}
            className={`relative transition-all duration-300 hover:scale-105 group ${showLabel ? 'hidden md:flex flex-col items-center gap-0.5 px-2 py-1' : 'p-2 rounded-full hover:bg-gold/10'
                }`}
            aria-label="Shopping cart"
        >
            <div className="relative">
                <ShoppingBag
                    className={`w-5 h-5 ${showLabel ? 'text-[#6B5D4F] group-hover:text-[#D4AF37] transition-colors' : ''}`}
                    style={showLabel ? undefined : { color: '#2C2C2C' }}
                    strokeWidth={1.5}
                />

                <AnimatePresence>
                    {itemCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`absolute flex items-center justify-center text-[10px] font-bold ${showLabel ? '-top-1.5 -right-1.5 w-4 h-4' : '-top-1 -right-1 w-5 h-5'
                                } rounded-full`}
                            style={{
                                background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                color: '#1a1a1a',
                                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.4)',
                            }}
                        >
                            {itemCount > 9 ? '9+' : itemCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {showLabel && (
                <span className="text-[10px] font-medium text-[#6B5D4F] group-hover:text-[#D4AF37]">Cart</span>
            )}
        </button>
    );
};
