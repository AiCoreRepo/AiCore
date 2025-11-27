import React, { useState, useEffect } from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import ProfileHeader from "../../components/dashboard/ProfileHeader";
import StatsCards from "../../components/dashboard/StatsCards";
import UploadsGrid from "../../components/dashboard/UploadsGrid";
import UploadCollectionModal from "../../components/dashboard/UploadCollectionModal";
import { getDashboardMetrics, getCreatorProducts } from "../../lib/api";

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>({
    rating: "NA",
    ranking: "NA",
    likes: 0,
    uploads: 0,
    revenueLastMonthCents: 0,
  });
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);

  // Example user data for sidebar (replace with real user context)
  const user = {
    name: "Julia Schneider",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", // Using the one from simple-react-dashboard for consistency
    role: "Elite Creator",
    subtitle: "Womenswear · Germany",
  };
  const navLinks = [
    { label: "Dashboard", icon: <span>🏠</span>, href: "/creator-dashboard" },
    { label: "My Wardrobe", icon: <span>👗</span>, href: "/wardrobe" },
    { label: "Analytics", icon: <span>📊</span>, href: "/analytics" },
    { label: "Settings", icon: <span>⚙️</span>, href: "/settings" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const metrics = await getDashboardMetrics();
      // Map backend metrics to expected frontend fields for StatsCards
      setStats({
        rating: metrics.rating ?? metrics.averageRating ?? "NA",
        ranking: metrics.ranking ?? metrics.rank ?? "NA",
        likes: metrics.likes ?? metrics.totalLikes ?? 0,
        uploads: metrics.uploads ?? metrics.totalUploads ?? 0,
        revenueLastMonthCents: metrics.revenueLastMonthCents ?? metrics.earnings ?? 0,
      });
      const products = await getCreatorProducts();
      setUploads(products.map((p: any) => ({
        ...p,
        price: p.price ? `$${p.price}` : '',
        status: p.status === 'approved' ? 'Active' : 'Pending',
        image: p.image_url ?? '/placeholder.jpg',
        name: p.name ?? 'Unnamed',
        tags: p.tags?.map((t: any) => t.name) ?? [],
        isNew: p.is_new ?? false, // Assuming backend might send this or default false
      })));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="min-h-screen flex" style={{ background: LuxeColors.background }}>
        <LuxeSidebar user={user} navLinks={navLinks} />
        <div className="flex-1 ml-[300px] dashboard-theme">
          <div className="min-h-screen dashboard-gradient p-8">
            <div className="max-w-7xl mx-auto">
              <ProfileHeader
                user={user}
                onUploadClick={() => setIsUploadFormOpen(true)}
              />
              <StatsCards stats={stats} />
              <UploadsGrid uploads={uploads} />
            </div>
          </div>
        </div>
      </div>

      <UploadCollectionModal
        open={isUploadFormOpen}
        onOpenChange={setIsUploadFormOpen}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default DashboardPage;
