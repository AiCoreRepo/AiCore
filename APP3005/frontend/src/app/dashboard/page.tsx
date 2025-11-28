import React, { useState, useEffect } from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import ProfileHeader from "../../components/dashboard/ProfileHeader";
import StatsCards from "../../components/dashboard/StatsCards";
import UploadsGrid from "../../components/dashboard/UploadsGrid";
import UploadCollectionModal from "../../components/dashboard/UploadCollectionModal";
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

  const navLinks = [
    { label: "Dashboard", icon: <span>🏠</span>, href: "/creator-dashboard" },
    { label: "My Wardrobe", icon: <span>👗</span>, href: "/wardrobe" },
    { label: "Analytics", icon: <span>📊</span>, href: "/analytics" },
    { label: "Settings", icon: <span>⚙️</span>, href: "/settings" },
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

      setUploads(products.map((p: any) => ({
        ...p,
        price: p.price ? `$${p.price}` : '',
        status: p.status === 'approved' ? 'Active' : 'Pending',
        image: p.image_url ?? 'https://placehold.co/400x600/F5F2EB/8B7355?text=No+Image',
        images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
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
      await deleteProduct(deletingProduct.product_id);
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  return (
    <div>
      <div className="min-h-screen flex" style={{ background: LuxeColors.background }}>
        <LuxeSidebar user={user} navLinks={navLinks} />
        <div className="flex-1 ml-[300px] dashboard-theme">
          <div className="min-h-screen dashboard-gradient p-8">
            <div className="max-w-7xl mx-auto">
              <ProfileHeader
                user={user}
                onUploadClick={() => {
                  setEditingProduct(null);
                  setIsUploadFormOpen(true);
                }}
                onProfileUpdate={fetchData}
              />
              <StatsCards stats={stats} />
              <UploadsGrid
                uploads={uploads}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />

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
