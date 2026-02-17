import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OTPVerification from "./pages/OTPVerification";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import CreatorLogin from "./pages/CreatorLogin";
import AiTryOn from "./pages/AiTryOn";
import DashboardPage from "./app/dashboard/page";
import SettingsPage from "./app/settings/page";
import WardrobePage from "./app/wardrobe/page";
import AnalyticsPage from "./app/analytics/page";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import UserForgotPassword from "./pages/UserForgotPassword";
import AuraDashboard from "./pages/AuraDashboard";
import AuraProfile from "./pages/AuraProfile";
import LetAIDecidePage from "./pages/LetAIDecidePage";
import BulkUploadPage from "./app/bulk-upload";
import AdminDashboardPage from "./app/admin-dashboard/page";
const AtelierApprovalPage = lazy(() => import("./app/admin-approvals/page"));
const CartPage = lazy(() => import("./pages/CartPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
import CollectionPage from "./pages/CollectionPage";
import AdminCollectionPage from "./app/admin-collection/page";
import AdminTryOnApprovals from "./app/admin-tryon-approvals/page";
import AdminOrdersPage from "./app/admin-orders/page";
import ArtisansPage from "./app/admin-artisans/page";
import ClientelePage from "./app/admin-clientele/page";
import AdminSettingsPage from "./app/admin-settings/page";
import AdminLogin from "./pages/AdminLogin";
import AdminCSVUploadPage from "./pages/AdminCSVUploadPage";
import { PopupProvider } from "./components/common/popups/PopupTime";
import { SidebarProvider } from "./context/SidebarContext";
import { ProfileSidebarProvider } from "./context/ProfileSidebarContext";
import { ProfileSidebarSlide } from "./components/user/ProfileSidebarSlide";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useActivityTracking } from "./hooks/useActivityTracking";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsCondition from "./pages/TermsCondition";
import RefundPolicy from "./pages/RefundPolicy";
import { MyOrdersPage } from "./features/orders";
import { OrderTrackingPage } from "./features/orders/OrderTrackingPage";
import UserDashboard from "./pages/UserDashboard";

const queryClient = new QueryClient();

// Activity Tracking Wrapper Component
const ActivityTracker = () => {
  useActivityTracking();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ActivityTracker />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <PopupProvider>
                <SidebarProvider>
                  <ProfileSidebarProvider>
                    <ProfileSidebarSlide />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/collection" element={<CollectionPage />} />
                      <Route path="/product/:id" element={<ProductDetailsPage />} />
                      <Route path="/cart" element={
                        <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div></div>}>
                          <CartPage />
                        </Suspense>
                      } />
                      <Route path="/wishlist" element={
                        <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div></div>}>
                          <WishlistPage />
                        </Suspense>
                      } />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/verify-otp" element={<OTPVerification />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/creator-login" element={<CreatorLogin />} />
                      <Route path="/ai-try-on" element={<AiTryOn />} />
                      <Route path="/let-ai-decide" element={<LetAIDecidePage />} />

                      {/* User Dashboard Routes */}
                      <Route path="/user-dashboard" element={<UserDashboard />} />
                      <Route path="/my-orders" element={<MyOrdersPage />} />
                      <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />

                      {/* Protected Creator Routes */}
                      <Route path="/creator-dashboard" element={
                        <ProtectedRoute requiredRole="CREATOR" redirectTo="/login">
                          <DashboardPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute requiredRole="CREATOR" redirectTo="/login">
                          <SettingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/wardrobe" element={
                        <ProtectedRoute requiredRole="CREATOR" redirectTo="/login">
                          <WardrobePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/analytics" element={
                        <ProtectedRoute requiredRole="CREATOR" redirectTo="/login">
                          <AnalyticsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/bulk-upload" element={
                        <ProtectedRoute requiredRole="CREATOR" redirectTo="/login">
                          <BulkUploadPage />
                        </ProtectedRoute>
                      } />

                      {/* User Auth Routes */}
                      <Route path="/user-login" element={<UserLogin />} />
                      <Route path="/user-signup" element={<UserSignup />} />
                      <Route path="/user-forgot-password" element={<UserForgotPassword />} />

                      {/* Aura Dashboard Route */}
                      <Route path="/aura-dashboard" element={<AuraDashboard />} />
                      <Route path="/aura-profile" element={<AuraProfile />} />



                      {/* Admin Routes */}
                      <Route path="/admin-login" element={<AdminLogin />} />
                      <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                      <Route path="/admin-approvals" element={
                        <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div></div>}>
                          <AtelierApprovalPage />
                        </Suspense>
                      } />
                      <Route path="/admin-tryon-approvals" element={<AdminTryOnApprovals />} />
                      <Route path="/admin-orders" element={<AdminOrdersPage />} />
                      <Route path="/admin-collection" element={<AdminCollectionPage />} />
                      <Route path="/admin-artisans" element={<ArtisansPage />} />
                      <Route path="/admin-clientele" element={<ClientelePage />} />
                      <Route path="/admin-settings" element={<AdminSettingsPage />} />
                      <Route path="/admin-csv-upload" element={<AdminCSVUploadPage />} />

                      {/* Payment Route */}
                      <Route path="/payment" element={
                        <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div></div>}>
                          <PaymentPage />
                        </Suspense>
                      } />

                      {/* Legal Pages */}
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-conditions" element={<TermsCondition />} />
                      <Route path="/refund-policy" element={<RefundPolicy />} />

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ProfileSidebarProvider>
                </SidebarProvider>
              </PopupProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
