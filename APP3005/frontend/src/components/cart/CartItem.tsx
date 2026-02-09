import { Minus, Plus, X, Heart } from 'lucide-react';
import { useState } from 'react';
import { CartItem as CartItemType } from '@/types/cart.types';
import { useCart } from '@/context/CartContext';
import { formatCartPrice } from '@/utils/cartUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CartItemProps {
    item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
    const { updateQuantity, removeFromCart } = useCart();
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [quantity, setQuantity] = useState(item.quantity);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1) return;
        if (item.max_quantity && newQuantity > item.max_quantity) return;

        setQuantity(newQuantity);
        updateQuantity(item.id, newQuantity);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) return;
        handleQuantityChange(value);
    };

    const handleRemove = () => {
        removeFromCart(item.id);
        setShowRemoveDialog(false);
    };

    const itemTotal = item.price_cents * item.quantity;

    return (
        <>
            <div
                className="flex gap-4 p-4 rounded-lg transition-all duration-300"
                style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                }}
            >
                {/* Product Image */}
                <div className="flex-shrink-0">
                    <img
                        src={item.thumbnail || 'https://via.placeholder.com/120x150/F5F0E6/D4AF37?text=No+Image'}
                        alt={item.title}
                        className="w-24 h-32 object-cover rounded-lg"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/120x150/F5F0E6/D4AF37?text=Image+Not+Found';
                        }}
                    />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                    {/* Title and Remove Button */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1">
                            <h3
                                className="font-medium text-sm line-clamp-2 mb-1"
                                style={{ color: '#2C2C2C' }}
                            >
                                {item.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                                by {item.creator.store_name}
                                {item.creator.verified && (
                                    <span className="ml-1" style={{ color: '#D4AF37' }}>✓</span>
                                )}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowRemoveDialog(true)}
                            className="p-1 rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Remove item"
                        >
                            <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                    </div>

                    {/* Variants */}
                    {(item.size || item.color) && (
                        <div className="flex gap-3 mb-3 text-xs text-gray-600">
                            {item.size && (
                                <span>Size: <span className="font-medium">{item.size}</span></span>
                            )}
                            {item.color && (
                                <span>Color: <span className="font-medium">{item.color}</span></span>
                            )}
                        </div>
                    )}

                    {/* Price and Quantity Controls */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleQuantityChange(quantity - 1)}
                                disabled={quantity <= 1}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                    border: '1px solid #D4AF37',
                                    color: '#D4AF37',
                                }}
                            >
                                <Minus className="w-3 h-3" />
                            </button>

                            <Input
                                type="number"
                                value={quantity}
                                onChange={handleInputChange}
                                className="w-12 h-7 text-center text-sm px-1"
                                min={1}
                                max={item.max_quantity || 10}
                            />

                            <button
                                onClick={() => handleQuantityChange(quantity + 1)}
                                disabled={item.max_quantity ? quantity >= item.max_quantity : quantity >= 10}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                    border: '1px solid #D4AF37',
                                    color: '#D4AF37',
                                }}
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                            <p
                                className="text-base font-semibold"
                                style={{ color: '#D4AF37' }}
                            >
                                {formatCartPrice(itemTotal, item.currency)}
                            </p>
                            {item.quantity > 1 && (
                                <p className="text-xs text-gray-500">
                                    {formatCartPrice(item.price_cents, item.currency)} each
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons (Mobile) */}
                    <div className="flex gap-2 mt-3 md:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                        >
                            <Heart className="w-3 h-3 mr-1" />
                            Save for Later
                        </Button>
                    </div>
                </div>

                {/* Action Buttons (Desktop) */}
                <div className="hidden md:flex flex-col gap-2 ml-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs whitespace-nowrap"
                    >
                        <Heart className="w-3 h-3 mr-1" />
                        Save for Later
                    </Button>
                </div>
            </div>

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove "{item.title}" from your cart?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
