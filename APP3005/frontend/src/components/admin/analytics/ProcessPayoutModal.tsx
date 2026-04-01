import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useCreatePayout } from '../../../hooks/useAdminAnalytics';
import { CreatorFinancialSummary } from '../../../types/admin-analytics.types';
import { DEFAULT_CURRENCY } from '../../../constants/admin-analytics.constants';
import { toast } from 'sonner';

interface Props {
  creator: CreatorFinancialSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessPayoutModal: React.FC<Props> = ({ creator, isOpen, onClose }) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const { mutateAsync: createPayout, isPending } = useCreatePayout();

  useEffect(() => {
    if (isOpen && creator) {
      setAmount(creator.pending_balance.toString());
      setNote('');
    }
  }, [isOpen, creator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }
    if (payoutAmount > creator.pending_balance) {
      toast.error('Cannot pay more than the pending balance.');
      return;
    }

    try {
      await createPayout({
        creatorId: creator.creator_id,
        amount: payoutAmount,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      // Error handled by hook toast
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: DEFAULT_CURRENCY }).format(val);

  if (!creator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isPending && !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Payout</DialogTitle>
          <DialogDescription>
            Record a payout for Creator ID: <span className="font-mono text-xs">{creator.creator_id}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending Balance</span>
              <span className="font-medium text-green-600">{formatCurrency(creator.pending_balance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Previously Paid</span>
              <span className="font-medium">{formatCurrency(creator.total_paid)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payout Amount ({DEFAULT_CURRENCY})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max={creator.pending_balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Internal Note (Optional)</Label>
            <Input
              id="note"
              placeholder="e.g. Cleared pending dues for March"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || creator.pending_balance <= 0}>
              {isPending ? 'Processing...' : 'Confirm Payout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
