import React, { useState, useEffect } from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import ProfileHeader from "../../components/dashboard/ProfileHeader";
import StatsCards from "../../components/dashboard/StatsCards";
import UploadsGrid from "../../components/dashboard/UploadsGrid";
import UploadCollectionModal from "../../components/dashboard/UploadCollectionModal";
import CustomizeDashboardModal from "../../components/dashboard/CustomizeDashboardModal";
import { Pagination } from "../../components/common/Pagination";
import { getDashboardMetrics, getCreatorProducts, deleteProduct, getProfile } from "../../lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LayoutDashboard, Shirt, BarChart3, Settings, Menu, Upload } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

const DashboardPage: React.FC = () => {
  const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [user, setUser] = useState({
    name: "Loading...",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    role: "Creator",
    subtitle: "",
  });



  // ... existing imports ...

  const navLinks = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/creator-dashboard" },
    { label: "My Wardrobe", icon: <Shirt size={20} />, href: "/wardrobe" },
    { label: "Bulk Upload", icon: <Upload size={20} />, href: "/bulk-upload" },
    { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
    { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
  ];



  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      try {
        const profile = await getProfile();
        setUser({
          name: profile.name || profile.store_name || "Creator",
          avatar: profile.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
          role: profile.role || "Creator",
          subtitle: profile.subtitle || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }

      const metrics = await getDashboardMetrics();
      // Map backend metrics to expected frontend fields for StatsCards
      setStats({
        rating: metrics.rating ?? metrics.averageRating ?? "NA",
        ranking: metrics.ranking ?? metrics.rank ?? "NA",
        likes: metrics.likes ?? metrics.totalLikes ?? 0,
        uploads: metrics.uploads ?? metrics.totalUploads ?? 0,
        revenueLastMonthCents: metrics.revenueLastMonthCents ?? metrics.earnings ?? 0,
        latestImages: metrics.latestImages || [],
      });

      const response = await getCreatorProducts(currentPage);
      let products = [];
      let meta = { totalPages: 1 };

      if (Array.isArray(response)) {
        // Handle legacy API response (backend not restarted yet)
        products = response;
      } else {
        // Handle new paginated API response
        products = response.data || [];
        meta = response.meta || { totalPages: 1 };
      }

      setTotalPages(meta?.totalPages || 1);

      setUploads(products.map((p: any) => {
        const currency = p.currency || 'INR';
        const priceValue = p.price_cents ? p.price_cents / 100 : (p.price || 0);
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2
        }).format(priceValue);

        // Map backend status (DRAFT, PENDING, APPROVED) to frontend status (Draft, Pending, Active)
        const statusMap: Record<string, "Draft" | "Pending" | "Active"> = {
          'DRAFT': 'Draft',
          'PENDING': 'Pending',
          'APPROVED': 'Active',
          'REJECTED': 'Pending', // Fallback for rejected
          // Backend returns title case, so handle both
          'Draft': 'Draft',
          'Pending': 'Pending',
          'Active': 'Active',
        };
        const mappedStatus = statusMap[p.status] || 'Pending';

        // Debug logging
        console.log('Product:', p.title, 'Backend Status:', p.status, 'Mapped Status:', mappedStatus);

        return {
          ...p,
          price: formattedPrice,
          status: mappedStatus,
          image: p.image_url ?? 'https://placehold.co/400x600/F5F2EB/8B7355?text=No+Image',
          images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
          name: p.name ?? 'Unnamed',
          tags: p.tags?.map((t: any) => t.name) ?? [],
          isNew: p.is_new ?? false,
        };
      }));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsUploadFormOpen(true);
  };

  const handleDeleteProduct = (product: any) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      const response = await deleteProduct(deletingProduct.product_id);

      // Update stats immediately from response
      if (response.totalUploads !== undefined) {
        setStats((prev: any) => ({
          ...prev,
          uploads: response.totalUploads,
          latestImages: response.latestImages || prev.latestImages
        }));
      }

      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  const handlePublishProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/creator-dashboard/products/${productId}/publish`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh the products list
        fetchData();
      } else {
        console.error('Failed to publish product');
      }
    } catch (error) {
      console.error('Error publishing product:', error);
    }
  };

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardConfig');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return { showStats: true, showUploads: true };
  });

  useEffect(() => {
    localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));
  }, [dashboardConfig]);

  return (
    <div>
      <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 25%, #FFE8B3 50%, #FFF4D6 75%, #FFF9E6 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
        <style>{`@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>
        <LuxeSidebar user={user} navLinks={navLinks} />
        <div className="flex-1 dashboard-theme transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
          <div className="min-h-screen dashboard-gradient p-4 md:p-8">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="mb-6 p-2 text-foreground hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="max-w-7xl mx-auto">
              <ProfileHeader
                user={user}
                onUploadClick={() => {
                  setEditingProduct(null);
                  setIsUploadFormOpen(true);
                }}
                onCustomizeClick={() => setIsCustomizeModalOpen(true)}
                onProfileUpdate={fetchData}
              />

              {dashboardConfig.showStats && <StatsCards stats={stats} />}

              {dashboardConfig.showUploads && (
                <UploadsGrid
                  uploads={uploads}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onPublish={handlePublishProduct}
                />
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>

      <UploadCollectionModal
        open={isUploadFormOpen}
        onOpenChange={setIsUploadFormOpen}
        onSuccess={fetchData}
        initialData={editingProduct}
      />

      <CustomizeDashboardModal
        open={isCustomizeModalOpen}
        onOpenChange={setIsCustomizeModalOpen}
        config={dashboardConfig}
        onConfigChange={setDashboardConfig}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-muted-foreground/20 text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the product
              "{deletingProduct?.title}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600 border-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardPage;
