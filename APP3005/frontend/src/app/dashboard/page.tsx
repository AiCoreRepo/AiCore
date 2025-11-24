import React, { useState, useEffect } from "react";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import ProfileCard from "../../components/dashboard/ProfileCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import UploadsTable from "../../components/dashboard/UploadsTable";
import UploadProductForm from "../../components/dashboard/UploadProductForm";
import { getDashboardMetrics, getCreatorProducts, deleteProduct } from "../../lib/api";
import { useToast } from "@/hooks/use-toast";
import { DashboardStats, UploadItem } from "../../types/dashboard";

const DashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    rating: 0,
    ranking: "NA",
    likes: 0,
    uploads: 0,
  });

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const metrics = await getDashboardMetrics();
      setStats({
        rating: metrics.averageRating ?? 0,
        ranking: metrics.ranking ?? "NA",
        likes: metrics.totalLikes ?? 0,
        uploads: metrics.totalUploads ?? 0,
        likesChangePct: metrics.likesChangePct,
        revenueLastMonthCents: metrics.totalSalesCents ?? 0,
        revenueChangePct: metrics.revenueChangePct,
        lastUploadDaysAgo: metrics.lastUploadDaysAgo,
      });

      const products = await getCreatorProducts();
      setUploads(
        products.map((p: any) => ({
          product_id: p.product_id,
          image: p.image_url ?? "/placeholder.jpg",
          name: p.name ?? "Unnamed",
          tags: p.tags?.map((t: any) => t.name) ?? [],
          stats: {
            likes: p.stats?.likes_count ?? 0,
            tries: p.stats?.tries_count ?? 0,
            conversionRate: p.stats?.conversion_rate
              ? `${p.stats.conversion_rate}%`
              : "0%",
          },
          status: p.status ?? "Pending",
        }))
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f5f0] to-[#f3eee6]">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">

        {/* Header */}
        <div className="animate-fadeIn">
          <DashboardHeader onUploadClick={() => setIsUploadFormOpen(true)} />
        </div>

        {/* Profile Card */}
        <div className="animate-slideUp">
          <ProfileCard />
        </div>

        {/* Stats */}
        <div className="animate-slideUp delay-75">
          <StatsGrid stats={stats} />
        </div>

        {/* Uploads */}
        <div className="animate-slideUp delay-150">
          <UploadsTable 
            uploads={uploads} 
            loading={loading}
            onUpdate={(productId) => {
              // Handle update - for now, just show a message
              // You can add an update form similar to upload form
              console.log("Update product:", productId);
            }}
            onDelete={async (productId) => {
              if (window.confirm("Are you sure you want to delete this product?")) {
                try {
                  await deleteProduct(productId);
                  toast({
                    title: "Success",
                    description: "Product deleted successfully",
                  });
                  await fetchData();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: (error as Error).message || "Failed to delete product",
                    variant: "destructive",
                  });
                }
              }
            }}
          />
        </div>
      </div>

      {/* Upload Product Form Dialog */}
      <UploadProductForm
        open={isUploadFormOpen}
        onOpenChange={setIsUploadFormOpen}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default DashboardPage;
