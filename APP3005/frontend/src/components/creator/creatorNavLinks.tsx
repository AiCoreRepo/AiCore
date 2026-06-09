import type { ReactNode } from "react";
import { BarChart3, LayoutDashboard, Package, Settings, Shirt, Upload } from "lucide-react";

export type CreatorNavLink = {
  label: string;
  icon: ReactNode;
  href: string;
};

export const creatorNavLinks: CreatorNavLink[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/creator-dashboard" },
  { label: "My Wardrobe", icon: <Shirt size={20} />, href: "/wardrobe" },
  { label: "Upload Product", icon: <Upload size={20} />, href: "/creator-upload" },
  { label: "Stock Management", icon: <Package size={20} />, href: "/stock-management" },
  { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
  { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
];
