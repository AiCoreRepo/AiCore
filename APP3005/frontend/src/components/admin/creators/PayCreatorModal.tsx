import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreatorListItem } from '@/api/admin-creators.api';
import { CreditCard, Banknote, ShieldAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PayCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: CreatorListItem | null;
}

export const PayCreatorModal: React.FC<PayCreatorModalProps> = ({ isOpen, onClose, creator }) => {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('PENDING');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Later on we integrate gateway here
    alert(`Payment gateway integration for ${creator?.store_name} coming soon!`);
    onClose();
  };

  if (!creator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-white/10 text-neutral-200 sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Banknote className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-xl text-center text-amber-500">Initiate Payout</DialogTitle>
          <DialogDescription className="text-center text-neutral-400 pt-2 text-sm">
            Process payments to <span className="text-neutral-200 font-bold">{creator.store_name}</span>. A secure payment gateway integration will handle the transactions here in the future.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="bg-neutral-950 p-4 border border-white/5 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Creator ID</span>
              <span className="text-neutral-300 font-mono truncate max-w-[150px]">{creator.creator_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Email Contact</span>
              <span className="text-neutral-300 truncate max-w-[180px]">{creator.user.email}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-neutral-400 text-sm">Payout Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 bg-neutral-950 border border-white/10 rounded-xl !text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status" className="text-neutral-400 text-sm">Payout Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-neutral-950 border-white/10 text-white focus:ring-amber-500 focus:ring-1 focus:ring-offset-0 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="PENDING">Pending Update</SelectItem>
                  <SelectItem value="COMPLETED">Paid / Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-transparent border border-white/20 hover:bg-white/10 text-white flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold flex-1 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Confirm Payout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
