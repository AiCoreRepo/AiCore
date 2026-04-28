export interface CreatorProfile {
  name: string;
  avatar: string;
  role: string;
  earnings: number;
  totalUploads: number;
  category: string;
}

export interface DashboardStatusBreakdown {
  active: number;
  pending: number;
  draft: number;
  rejected: number;
}

export interface DashboardTopProduct {
  title: string;
  imageUrl: string | null;
  status: "Active" | "Pending" | "Draft" | "Rejected";
  likes: number;
  views: number;
  priceCents: number;
}

export interface DashboardStats {
  rating?: number | string | null;
  ranking?: string | number | null;
  totalProducts: number;
  likes: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  uploads: number;
  earningsCents: number;
  soldUnits: number;
  averagePriceCents: number;
  totalInventoryUnits: number;
  soldOutProducts: number;
  remainingSlots: number;
  productLimit: number;
  currency: string;
  statusBreakdown: DashboardStatusBreakdown;
  topProduct?: DashboardTopProduct | null;
  latestImages?: string[];
  likesChangePct?: number;
  revenueLastMonthCents?: number;
  revenueChangePct?: number;
  lastUploadDaysAgo?: number | null;
}

export interface UploadItem {
  product_id?: string;
  image: string;
  name: string;
  tags: string[];
  stats: {
    likes: number;
    tries: number;
    conversionRate: string;
  };
  status: "Active" | "Pending" | "Draft" | "Rejected";
}
