import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProductStock } from '@/hooks/useAdminInventory';

interface StockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
}

export const StockEditModal: React.FC<StockEditModalProps> = ({ isOpen, onClose, product }) => {
  const updateStock = useUpdateProductStock();
  const [inventoryCount, setInventoryCount] = useState<string>('');
  const [labelOverride, setLabelOverride] = useState<string>('AUTO');

  useEffect(() => {
    if (product) {
      setInventoryCount(product.inventory_count?.toString() || '0');
      setLabelOverride(product.stock_label_override || 'AUTO');
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const count = parseInt(inventoryCount, 10);
    const override = labelOverride === 'AUTO' ? null : labelOverride;

    updateStock.mutate({
      productId: product.product_id,
      data: {
        inventory_count: isNaN(count) ? 0 : count,
        stock_label_override: override,
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
          <DialogTitle className="text-[#D4AF37]">Update Inventory Stock</DialogTitle>
          <DialogDescription className="text-neutral-400 text-sm">
            Adjust the stock count or override the stock label manually.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inventoryCount" className="text-neutral-400 text-sm">Current Stock Count</Label>
            <Input
              id="inventoryCount"
              type="number"
              min="0"
              step="1"
              value={inventoryCount}
              onChange={(e) => setInventoryCount(e.target.value)}
              className="bg-neutral-950 border border-white/10 rounded-xl !text-white placeholder-neutral-500 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labelOverride" className="text-neutral-400 text-sm">Stock Label Override</Label>
            <Select value={labelOverride} onValueChange={setLabelOverride}>
              <SelectTrigger className="w-full bg-neutral-950 border-white/10 text-white focus:ring-[#D4AF37] focus:ring-1 focus:ring-offset-0 rounded-xl">
                <SelectValue placeholder="Select an override..." />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="AUTO">Auto-compute (Based on thresholds)</SelectItem>
                <SelectItem value="LOW">Force: LOW</SelectItem>
                <SelectItem value="OK">Force: OK</SelectItem>
                <SelectItem value="HIGH">Force: HIGH</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 mt-1">If Auto-compute is selected, label is calculated based on Myntra parameters.</p>
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
              disabled={updateStock.isPending}
              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-neutral-950 flex-1"
            >
              {updateStock.isPending ? 'Saving...' : 'Save Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
