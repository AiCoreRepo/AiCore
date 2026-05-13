import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import ProfileHeader from "../../components/dashboard/ProfileHeader";
import StatsCards from "../../components/dashboard/StatsCards";
import UploadsGrid from "../../components/dashboard/UploadsGrid";
import CustomizeDashboardModal from "../../components/dashboard/CustomizeDashboardModal";
import { Pagination } from "../../components/common/Pagination";
import { getDashboardMetrics, getCreatorProducts, deleteProduct, getProfile } from "../../lib/api";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
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
import { Menu, AlertCircle } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import type { DashboardStats } from "@/types/dashboard";

const MAX_PRODUCTS = 30;
const defaultStats: DashboardStats = {
  totalProducts: 0,
  uploads: 0,
  likes: 0,
  totalLikes: 0,
  totalViews: 0,
  totalComments: 0,
  earningsCents: 0,
  revenueLastMonthCents: 0,
  soldUnits: 0,
  averagePriceCents: 0,
  totalInventoryUnits: 0,
  soldOutProducts: 0,
  remainingSlots: MAX_PRODUCTS,
  productLimit: MAX_PRODUCTS,
  currency: "INR",
  statusBreakdown: {
    active: 0,
    pending: 0,
    draft: 0,
    rejected: 0,
  },
  latestImages: [],
  topProduct: null,
  lastUploadDaysAgo: null,
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);

  const [user, setUser] = useState({
    name: "Loading...",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    role: "Creator",
    subtitle: "",
  });

  const fetchProfileData = async () => {
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
  };

  const fetchMetricsData = async () => {
    try {
      const metrics = await getDashboardMetrics();
      setStats({
        ...defaultStats,
        ...metrics,
        likes: metrics.likes ?? metrics.totalLikes ?? 0,
        totalLikes: metrics.totalLikes ?? metrics.likes ?? 0,
        totalProducts: metrics.totalProducts ?? metrics.totalUploads ?? 0,
        uploads: metrics.uploads ?? metrics.totalUploads ?? metrics.totalProducts ?? 0,
        earningsCents: metrics.earningsCents ?? metrics.revenueLastMonthCents ?? 0,
        revenueLastMonthCents: metrics.revenueLastMonthCents ?? metrics.earningsCents ?? 0,
        latestImages: metrics.latestImages || [],
        statusBreakdown: {
          ...defaultStats.statusBreakdown,
          ...(metrics.statusBreakdown || {}),
        },
      });
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  };

  const mapProduct = (p: any) => {
    const normalizedImageUrls: string[] = Array.isArray(p?.images)
      ? p.images
          .map((img: any) => (typeof img === 'string' ? img : img?.url))
          .filter((u: any) => typeof u === 'string' && u.length > 0)
      : [];

    const currency = p.currency || 'INR';
    const priceValue = p.price_cents ? p.price_cents / 100 : (p.price || 0);
    const formattedPrice = typeof priceValue === 'string' ? priceValue : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(priceValue);

    const statusMap: Record<string, "Draft" | "Pending" | "Active" | "Rejected"> = {
      'DRAFT': 'Draft',
      'PENDING': 'Pending',
      'APPROVED': 'Active',
      'REJECTED': 'Rejected',
      'Draft': 'Draft',
      'Pending': 'Pending',
      'Active': 'Active',
      'Rejected': 'Rejected',
    };
    const mappedStatus = statusMap[p.status] || 'Pending';

    return {
      ...p,
      price: formattedPrice,
      status: mappedStatus,
      image: p.image_url ?? normalizedImageUrls[0] ?? 'https://placehold.co/400x600/F5F2EB/8B7355?text=No+Image',
      images: normalizedImageUrls.length > 0 ? normalizedImageUrls : (p.image_url ? [p.image_url] : []),
      name: p.name ?? p.title ?? 'Unnamed',
      tags: p.tags?.map((t: any) => typeof t === 'string' ? t : t.name) ?? [],
      isNew: p.is_new ?? false,
    };
  };

  const fetchProductsData = async (page: number, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await getCreatorProducts(page);
      let products = [];
      let meta = { totalPages: 1 };

      if (Array.isArray(response)) {
        products = response;
      } else {
        products = response.data || [];
        meta = response.meta || { totalPages: 1 };
      }

      setTotalPages(meta?.totalPages || 1);
      setUploads(products.map(mapProduct));
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfileData(),
      fetchMetricsData(),
      fetchProductsData(currentPage, true)
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (currentPage === 1 && uploads.length === 0) {
      fetchData();
    } else {
      fetchProductsData(currentPage);
    }
  }, [currentPage]);

  // ── Upload with limit enforcement ────────────────────────────────
  const handleUploadClick = () => {
    const currentUploads = stats.totalProducts || stats.uploads || 0;
    if (currentUploads >= MAX_PRODUCTS) {
      setIsLimitDialogOpen(true);
      return;
    }
    navigate('/creator-upload');
  };

  const handleUploadSuccess = () => {
    setEditingProduct(null);
    fetchData();
  };

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
      fetchData();
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
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      if (response.ok) fetchData();
      else console.error('Failed to publish product');
    } catch (error) {
      console.error('Error publishing product:', error);
    }
  };

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardConfig');
      if (saved) return JSON.parse(saved);
    }
    return { showStats: true, showUploads: true };
  });

  useEffect(() => {
    localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));
  }, [dashboardConfig]);

  return (
    <div>
      <div className="min-h-screen flex overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 25%, #FFE8B3 50%, #FFF4D6 75%, #FFF9E6 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
        <style>{`@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>
        <LuxeSidebar user={user} navLinks={creatorNavLinks} />
        <div
          className="flex-1 dashboard-theme min-w-0 transition-all duration-300 ease-in-out"
          style={{ marginLeft: isMobile ? "0px" : sidebarWidth }}
        >
          <div className="min-h-screen dashboard-gradient px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
            {isMobile && (
              <button onClick={toggleSidebar} className="mb-6 p-2 text-foreground hover:bg-white/10 rounded-lg transition-colors" aria-label="Open menu">
                <Menu size={24} />
              </button>
            )}
            <div className="max-w-7xl mx-auto">
              <ProfileHeader
                user={user}
                onUploadClick={handleUploadClick}
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


      <CustomizeDashboardModal
        open={isCustomizeModalOpen}
        onOpenChange={setIsCustomizeModalOpen}
        config={dashboardConfig}
        onConfigChange={setDashboardConfig}
      />

      {/* Delete Confirmation Dialog */}
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

      {/* ── Product Limit Reached Dialog ──────────────────────────── */}
      <AlertDialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
        <AlertDialogContent
          className="border-none p-0"
          style={{
            maxWidth: '440px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #FFFDF8 0%, #FFF9EF 50%, #FFFDF8 100%)',
            border: '2px solid rgba(201,165,95,0.4)',
            boxShadow: '0 20px 60px rgba(201,165,95,0.25), 0 0 40px rgba(201,165,95,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Top gold accent bar */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #C9A75F, #D4B76E, #C9A75F)',
            boxShadow: '0 2px 12px rgba(201,165,95,0.4)',
          }} />

          <div style={{ padding: '32px 28px 28px' }}>
            <AlertDialogHeader>
              {/* Gold icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(201,165,95,0.15), rgba(201,165,95,0.05))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(201,165,95,0.25)',
                }}>
                  <AlertCircle size={28} style={{ color: '#C9A75F' }} />
                </div>
              </div>

              <AlertDialogTitle style={{
                textAlign: 'center',
                fontFamily: "'Playfair Display', serif",
                fontSize: '22px', fontWeight: 700, color: '#2C2416',
              }}>
                Collection Limit Reached
              </AlertDialogTitle>

              <AlertDialogDescription style={{
                textAlign: 'center', fontSize: '14px',
                lineHeight: 1.6, color: 'rgba(44,36,22,0.65)', marginTop: '8px',
              }}>
                You've uploaded <strong style={{ color: '#C9A75F', fontWeight: 700 }}>{stats.totalProducts || stats.uploads || MAX_PRODUCTS}</strong> of{' '}
                <strong style={{ color: '#C9A75F', fontWeight: 700 }}>{MAX_PRODUCTS}</strong> allowed products.
                <br />
                Please delete an existing product to make room for a new one.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Usage progress bar */}
            <div style={{
              margin: '20px 0', padding: '14px 16px', borderRadius: '12px',
              background: 'rgba(201,165,95,0.06)', border: '1px solid rgba(201,165,95,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(44,36,22,0.5)' }}>
                  Usage
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#C9A75F' }}>
                  {stats.totalProducts || stats.uploads || MAX_PRODUCTS}/{MAX_PRODUCTS}
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(201,165,95,0.12)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg, #C9A75F, #D4B76E)',
                  width: `${Math.min((((stats.totalProducts || stats.uploads || MAX_PRODUCTS)) / MAX_PRODUCTS) * 100, 100)}%`,
                  boxShadow: '0 0 8px rgba(201,165,95,0.4)',
                }} />
              </div>
            </div>

            <AlertDialogFooter style={{ display: 'flex', justifyContent: 'center' }}>
              <AlertDialogAction
                onClick={() => setIsLimitDialogOpen(false)}
                style={{
                  width: '100%', height: '44px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '13px', color: '#2C2416',
                  border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #C9A75F 0%, #D4B76E 100%)',
                  boxShadow: '0 4px 16px rgba(201,165,95,0.3)',
                }}
              >
                Got It
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardPage;
