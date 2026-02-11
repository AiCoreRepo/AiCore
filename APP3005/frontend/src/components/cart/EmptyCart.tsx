import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CART_MESSAGES } from '@/constants/cart.constants';

export const EmptyCart = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Icon */}
            <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05))',
                    border: '2px solid rgba(212, 175, 55, 0.2)',
                }}
            >
                <ShoppingBag
                    className="w-12 h-12"
                    style={{ color: '#D4AF37' }}
                    strokeWidth={1.5}
                />
            </div>

            {/* Text */}
            <h3
                className="text-2xl font-serif font-semibold mb-2"
                style={{ color: '#2C2C2C' }}
            >
                {CART_MESSAGES.EMPTY_CART}
            </h3>
            <p
                className="text-sm mb-8 text-center max-w-sm"
                style={{ color: '#6B7280' }}
            >
                {CART_MESSAGES.EMPTY_CART_SUBTITLE}
            </p>

            {/* CTA Button */}
            <Button
                onClick={() => navigate('/collection')}
                className="px-8 py-6 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105"
                style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                    color: '#1a1a1a',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
                }}
            >
                Continue Shopping
            </Button>
        </div>
    );
};
