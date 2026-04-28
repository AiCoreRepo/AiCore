import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Button } from '../../ui/button';
import { CreatorFinancialSummary } from '../../../types/admin-analytics.types';
import { DEFAULT_CURRENCY } from '../../../constants/admin-analytics.constants';
import { ArrowUpDown, ExternalLink, Wallet } from 'lucide-react';

interface Props {
  creators: CreatorFinancialSummary[];
  isLoading: boolean;
  onOpenPayoutModal: (creator: CreatorFinancialSummary) => void;
  onViewDetails: (creatorId: string) => void;
}

type SortField = 'creator_id' | 'total_sales' | 'pending_balance' | 'total_paid';
type SortOrder = 'asc' | 'desc';

export const CreatorAnalyticsTable: React.FC<Props> = ({
  creators,
  isLoading,
  onOpenPayoutModal,
  onViewDetails,
}) => {
  const [sortField, setSortField] = useState<SortField>('pending_balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedCreators = useMemo(() => {
    if (!creators) return [];
    return [...creators].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [creators, sortField, sortOrder]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: DEFAULT_CURRENCY }).format(val);

  if (isLoading) {
    return <div className="text-center py-10 opacity-50">Loading creators...</div>;
  }

  if (sortedCreators.length === 0) {
    return <div className="text-center py-10 opacity-50">No creator data available.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort('creator_id')}>
              Creator ID <ArrowUpDown className="ml-1 inline h-4 w-4" />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('total_sales')}>
              Total Sales <ArrowUpDown className="ml-1 inline h-4 w-4" />
            </TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Earnings</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('total_paid')}>
              Total Paid <ArrowUpDown className="ml-1 inline h-4 w-4" />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('pending_balance')}>
              Pending Bal <ArrowUpDown className="ml-1 inline h-4 w-4" />
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCreators.map((row) => (
            <TableRow key={row.creator_id}>
              <TableCell className="font-mono text-xs">{row.creator_id}</TableCell>
              <TableCell>{formatCurrency(row.total_sales)}</TableCell>
              <TableCell>{formatCurrency(row.platform_commission)}</TableCell>
              <TableCell>{formatCurrency(row.creator_earnings)}</TableCell>
              <TableCell>{formatCurrency(row.total_paid)}</TableCell>
              <TableCell className="font-semibold text-green-600">
                {formatCurrency(row.pending_balance)}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onViewDetails(row.creator_id)}>
                  <ExternalLink className="h-4 w-4 mr-1" /> View
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  disabled={row.pending_balance <= 0}
                  onClick={() => onOpenPayoutModal(row)}
                >
                  <Wallet className="h-4 w-4 mr-1" /> Pay
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
