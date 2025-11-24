export interface CreatorProfile {
  name: string;
  avatar: string;
  role: string;
  earnings: number;
  totalUploads: number;
  category: string;
}

export interface DashboardStats {
  rating: number;
  ranking: string;
  likes: number;
  uploads: number;
  likesChangePct?: number;
  revenueLastMonthCents?: number;
  revenueChangePct?: number;
  lastUploadDaysAgo?: number;
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
  status: "Active" | "Pending";
}