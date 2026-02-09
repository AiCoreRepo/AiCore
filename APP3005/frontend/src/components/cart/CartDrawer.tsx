import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatCartPrice } from '@/utils/cartUtils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { CART_CONFIG } from '@/constants/cart.constants';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
    const navigate = useNavigate();
    const { cart, removeFromCart } = useCart();

    const handleViewCart = () => {
        navigate('/cart');
        onClose();
    };

    const handleCheckout = () => {
        navigate('/checkout');
        onClose();
    };

    // Show only first few items in drawer
    const displayItems = cart.items.slice(0, CART_CONFIG.CART_DRAWER_MAX_ITEMS);
    const hasMoreItems = cart.items.length > CART_CONFIG.CART_DRAWER_MAX_ITEMS;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 flex flex-col"
                        style={{
                            background: '#F8F1E6',
                            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between p-6 border-b"
                            style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" style={{ color: '#D4AF37' }} />
                                <h2 className="text-lg font-serif font-semibold" style={{ color: '#2C2C2C' }}>
                                    Shopping Cart
                                </h2>
                                <span
                                    className="text-sm px-2 py-0.5 rounded-full"
                                    style={{
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        color: '#D4AF37',
                                    }}
                                >
                                    {cart.summary.item_count}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                            >
                                <X className="w-5 h-5" style={{ color: '#2C2C2C' }} />
                            </button>
                        </div>

                        {/* Content */}
                        {cart.items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                    style={{
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        border: '2px solid rgba(212, 175, 55, 0.2)',
                                    }}
                                >
                                    <ShoppingBag className="w-8 h-8" style={{ color: '#D4AF37' }} />
                                </div>
                                <p className="text-sm text-gray-600 text-center mb-4">
                                    Your cart is empty
                                </p>
                                <Button
                                    onClick={() => {
                                        navigate('/collection');
                                        onClose();
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Items List */}
                                <ScrollArea className="flex-1 p-6">
                                    <div className="space-y-4">
                                        {displayItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex gap-3 p-3 rounded-lg"
                                                style={{
                                                    background: '#FFFFFF',
                                                    border: '1px solid rgba(0, 0, 0, 0.06)',
                                                }}
                                            >
                                                {/* Image */}
                                                <img
                                                    src={item.thumbnail || 'https://via.placeholder.com/80x100/F5F0E6/D4AF37?text=No+Image'}
                                                    alt={item.title}
                                                    className="w-16 h-20 object-cover rounded"
                                                />

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium line-clamp-2 mb-1" style={{ color: '#2C2C2C' }}>
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        Qty: {item.quantity}
                                                    </p>
                                                    <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                                                        {formatCartPrice(item.price_cents * item.quantity, item.currency)}
                                                    </p>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1 rounded-full hover:bg-red-50 transition-colors self-start"
                                                >
                                                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                                </button>
                                            </div>
                                        ))}

                                        {hasMoreItems && (
                                            <button
                                                onClick={handleViewCart}
                                                className="w-full text-sm text-center py-2 rounded-lg transition-colors"
                                                style={{
                                                    color: '#D4AF37',
                                                    background: 'rgba(212, 175, 55, 0.1)',
                                                }}
                                            >
                                                +{cart.items.length - CART_CONFIG.CART_DRAWER_MAX_ITEMS} more items
                                            </button>
                                        )}
                                    </div>
                                </ScrollArea>

                                <Separator />

                                {/* Footer */}
                                <div className="p-6 space-y-4">
                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Subtotal</span>
                                        <span className="text-lg font-semibold" style={{ color: '#D4AF37' }}>
                                            {formatCartPrice(cart.summary.subtotal_cents, cart.summary.currency)}
                                        </span>
                                    </div>

                                    {/* Buttons */}
                                    <div className="space-y-2">
                                        <Button
                                            onClick={handleCheckout}
                                            className="w-full py-6 text-sm font-medium rounded-full transition-all duration-300"
                                            style={{
                                                background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                                color: '#1a1a1a',
                                                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                                            }}
                                        >
                                            Checkout
                                        </Button>
                                        <Button
                                            onClick={handleViewCart}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            View Full Cart
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
