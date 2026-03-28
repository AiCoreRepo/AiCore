import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAdminProduct } from '@/hooks/useAdminProducts';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ isOpen, onClose, product }) => {
  const updateProduct = useUpdateAdminProduct();
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');

  useEffect(() => {
    if (product) {
      setPrice((product.price_cents / 100).toString());
      setCommission(product.commission_percentage?.toString() || '10');
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const priceCents = Math.round(parseFloat(price) * 100);
    const commissionPercent = parseInt(commission, 10);

    updateProduct.mutate({
      productId: product.product_id,
      data: {
        price_cents: priceCents,
        commission_percentage: commissionPercent,
      },
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 text-neutral-200 border-white/10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Edit Product Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-neutral-400 text-sm">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-neutral-950 border border-white/10 rounded-xl !text-white placeholder-neutral-500 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission" className="text-neutral-400 text-sm">Commission (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="bg-neutral-950 border border-white/10 rounded-xl !text-white placeholder-neutral-500 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37]"
              required
            />
          </div>
          <DialogFooter className="mt-6 flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="bg-transparent border border-white/20 hover:bg-white/10 text-white flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProduct.isPending}
              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-neutral-950 flex-1"
            >
              {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
