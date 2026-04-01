export interface OrderStats {
  total_sales: number;
  creator_earnings: number;
  platform_commission: number;
  units_sold: number;
}

export interface CreatorFinancialSummary extends OrderStats {
  creator_id: string;
  total_paid: number;
  pending_balance: number;
  last_payout_date: string | null;
}

export interface ProductBreakdown extends OrderStats {
  product_id: string;
  product_name: string;
}

export interface PayoutEntry {
  payout_id: string;
  creator_id: string;
  amount: number;
  status: string;
  note: string | null;
  created_at: string;
}

export interface AnalyticsOverview extends OrderStats {
  total_paid: number;
  pending_balance: number;
}

export interface CreatorDetailsResponse {
  summary: CreatorFinancialSummary;
  product_breakdown: ProductBreakdown[];
  payout_history: PayoutEntry[];
}

export interface CreatePayoutPayload {
  creatorId: string;
  amount: number;
  note?: string;
}
