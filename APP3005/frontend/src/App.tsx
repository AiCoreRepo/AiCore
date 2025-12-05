import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
import AdminDashboardPage from "./app/admin-dashboard/page";
import AdminLogin from "./pages/AdminLogin";
import { PopupProvider } from "./components/common/popups/PopupTime";
import { SidebarProvider } from "./context/SidebarContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PopupProvider>
            <SidebarProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/creator-login" element={<CreatorLogin />} />
                <Route path="/ai-try-on" element={<AiTryOn />} />
                <Route path="/creator-dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/wardrobe" element={<WardrobePage />} />

                <Route path="/analytics" element={<AnalyticsPage />} />

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

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </PopupProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

