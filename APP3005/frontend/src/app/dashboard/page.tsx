import React, { useState, useEffect } from "react";
import UploadProductForm from "../../components/dashboard/UploadProductForm";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import StatsRow from "../../components/dashboard/StatsRow";
import ClothingGrid from "../../components/dashboard/ClothingGrid";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { deleteProduct } from "../../lib/api";
import { getDashboardMetrics, getCreatorProducts } from "../../lib/api";

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Example user data for sidebar (replace with real user context)
  const user = {
    name: "Julia Schneider",
    avatar: "/images/placeholder_avatar.jpg",
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
      // Map backend metrics to expected frontend fields for StatsRow
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
      })));
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      
      <div className="min-h-screen" style={{ background: LuxeColors.background }}>
            <LuxeSidebar user={user} navLinks={navLinks} />
            <div className="ml-[300px] min-h-screen flex-1">
              <div className="max-w-7xl mx-auto px-8 py-12 space-y-10">
                <div className="flex items-center justify-between pb-10">
                  <h1 className="text-5xl font-serif text-[#2D2D2D] font-bold tracking-wide">Creator Dashboard</h1>
                  <button
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)] hover:from-[#B8860B] hover:to-[#D4AF37] transition-all duration-200 flex items-center gap-2 text-lg"
                    onClick={() => setIsUploadFormOpen(true)}
                  >
                    + Upload New Collection
                  </button>
                </div>
                <StatsRow stats={stats} />
                <div>
                  <h2 className="font-serif text-2xl text-[#8B7355] mb-4">Uploads</h2>
                  <ClothingGrid
                    uploads={uploads}
                    loading={loading}
                    onEdit={(item) => {
                      setEditProduct(item);
                      setIsUploadFormOpen(true);
                    }}
                    onDelete={(item) => {
                      setDeleteProductId(item.product_id);
                      setConfirmOpen(true);
                    }}
                  />
                  <ConfirmDialog
                    open={confirmOpen}
                    title="Delete Product"
                    description="Are you sure you want to delete this product? This action cannot be undone."
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={async () => {
                      if (deleteProductId) {
                        await deleteProduct(deleteProductId);
                        setConfirmOpen(false);
                        setDeleteProductId(null);
                        fetchData();
                      }
                    }}
                  />
                </div>
                <UploadProductForm
                  open={isUploadFormOpen}
                  onOpenChange={(open) => {
                    setIsUploadFormOpen(open);
                    if (!open) setEditProduct(null);
                  }}
                  onSuccess={fetchData}
                  initialData={editProduct}
                />
              </div>
            </div>
      </div>
    </div>
  );
};

export default DashboardPage;
