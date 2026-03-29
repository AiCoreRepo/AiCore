import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { ScrollArea } from '../../ui/scroll-area';
import { Badge } from '../../ui/badge';
import { PayoutStatus, DEFAULT_CURRENCY } from '../../../constants/admin-analytics.constants';
import { useCreatorAnalyticsDetails } from '../../../hooks/useAdminAnalytics';
import { format } from 'date-fns';

interface Props {
  creatorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorAnalyticsDrawer: React.FC<Props> = ({ creatorId, isOpen, onClose }) => {
  const { data, isLoading, isError } = useCreatorAnalyticsDetails(creatorId || '', isOpen);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: DEFAULT_CURRENCY }).format(val);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case PayoutStatus.COMPLETED:
        return 'default';
      case PayoutStatus.PENDING:
        return 'secondary';
      case PayoutStatus.FAILED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Creator Analytics Details</SheetTitle>
          <SheetDescription>
            ID: <span className="font-mono text-xs">{creatorId}</span>
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-10 text-center opacity-50">Loading details...</div>
        ) : isError || !data ? (
          <div className="py-10 text-center text-red-500">Failed to load details.</div>
        ) : (
          <div className="mt-6 space-y-8 flex flex-col h-full">
            {/* Summary Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mr-1">Earnings</span>
                <span className="font-semibold">{formatCurrency(data.summary.creator_earnings)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mr-1">Paid</span>
                <span className="font-semibold">{formatCurrency(data.summary.total_paid)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Pending Balance</span>
                <span className="font-semibold text-green-600">{formatCurrency(data.summary.pending_balance)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Units Sold</span>
                <span className="font-semibold">{data.summary.units_sold}</span>
              </div>
            </div>

            {/* Product Breakdown Section */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product Breakdown</h3>
              <ScrollArea className="h-48 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.product_breakdown.map((prod) => (
                      <TableRow key={prod.product_id}>
                        <TableCell className="font-medium text-xs truncate max-w-[150px]">
                          {prod.product_name}
                        </TableCell>
                        <TableCell>{prod.units_sold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(prod.total_sales)}</TableCell>
                      </TableRow>
                    ))}
                    {data.product_breakdown.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center italic opacity-50 text-xs">No products sold yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Payout History Section */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payout History</h3>
              <ScrollArea className="h-48 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payout_history.map((payout) => (
                      <TableRow key={payout.payout_id}>
                        <TableCell className="text-xs">
                          {format(new Date(payout.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getStatusBadgeVariant(payout.status)}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.payout_history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center italic opacity-50 text-xs">No payout history found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
