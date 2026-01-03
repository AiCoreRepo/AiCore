import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/lib/api";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { User, LayoutDashboard, Palette } from "lucide-react";
import EditProfileModal from "../dashboard/EditProfileModal";
import { useAuth } from "@/context/AuthContext";

interface DashboardConfig {
    showStats: boolean;
    showUploads: boolean;
}

const SettingsContent: React.FC = () => {
    const { user, fetchUser, loading } = useAuth();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subtitle: "",
    });
    const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
        showStats: true,
        showUploads: true,
    });
    const [hasChanges, setHasChanges] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.store_name || "Creator",
                subtitle: user.subtitle || "Creator",
            });
        }
    }, [user]);

    useEffect(() => {
        const saved = localStorage.getItem('dashboardConfig');
        if (saved) {
            setDashboardConfig(JSON.parse(saved));
        }
    }, []);

    const handleConfigChange = (key: keyof DashboardConfig) => {
        const newConfig = { ...dashboardConfig, [key]: !dashboardConfig[key] };
        setDashboardConfig(newConfig);
        setHasChanges(true);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleProfileUpdate = async () => {
        await fetchUser();
    };

    const handleSave = async () => {
        try {
            // Save dashboard config
            localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));

            // Save profile details
            await updateProfile({
                name: formData.name,
                subtitle: formData.subtitle,
            });

            await fetchUser();
            setHasChanges(false);
            toast({
                title: "Settings Saved",
                description: "Your changes have been successfully saved.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h2 className="text-2xl font-serif text-luxury-black">Unable to load profile</h2>
                <LuxeButton onClick={() => window.location.reload()}>Retry</LuxeButton>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h2 className="text-4xl font-serif text-luxury-black tracking-tight">Settings</h2>
                    <p className="text-stone-500 text-lg font-light">Manage your account preferences and dashboard layout.</p>
                </div>
                <LuxeButton
                    variant="luxury"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`px-8 py-6 text-base transition-all duration-300 ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}
                >
                    Save Changes
                </LuxeButton>
            </div>

            {/* Profile Section */}
            <section className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[#F5F2EB] rounded-2xl text-luxury-gold">
                        <User size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif text-luxury-black tracking-wide">Profile Settings</h3>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-stone-100 ring-4 ring-[#F5F2EB] relative group cursor-pointer" onClick={() => setIsEditProfileOpen(true)}>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.store_name || user?.email || "Creator")}&background=C6A87C&color=fff`}
                                alt="Profile"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.store_name || user?.email || "Creator")}&background=C6A87C&color=fff`;
                                }}
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-xs font-medium tracking-wider uppercase">Change</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditProfileOpen(true)}
                            className="text-sm text-luxury-gold hover:text-luxury-gold/80 font-medium underline-offset-4 hover:underline"
                        >
                            Change Photo
                        </button>
                    </div>

                    <div className="flex-1 space-y-6 max-w-xl">
                        <div className="space-y-2">
                            <Label htmlFor="storeName" className="text-base font-medium text-luxury-black">Store Name</Label>
                            <Input
                                id="storeName"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg"
                                placeholder="Enter your store name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subtitle" className="text-base font-medium text-luxury-black">Subtitle / Role</Label>
                            <Input
                                id="subtitle"
                                value={formData.subtitle}
                                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                                className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg"
                                placeholder="e.g. Fashion Designer"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard Customization Section */}
            <section className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[#F5F2EB] rounded-2xl text-luxury-gold">
                        <LayoutDashboard size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif text-luxury-black tracking-wide">Dashboard Layout</h3>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5F2EB]/50 transition-colors">
                        <div className="space-y-1">
                            <Label htmlFor="show-stats" className="text-lg font-medium text-luxury-black cursor-pointer">Stats Overview</Label>
                            <p className="text-stone-500 font-light">Show performance metrics at the top of your dashboard</p>
                        </div>
                        <Switch
                            id="show-stats"
                            checked={dashboardConfig.showStats}
                            onCheckedChange={() => handleConfigChange("showStats")}
                            className="data-[state=checked]:bg-luxury-gold scale-125"
                        />
                    </div>

                    <div className="h-px bg-stone-100" />

                    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5F2EB]/50 transition-colors">
                        <div className="space-y-1">
                            <Label htmlFor="show-uploads" className="text-lg font-medium text-luxury-black cursor-pointer">Recent Uploads</Label>
                            <p className="text-stone-500 font-light">Show your gallery of uploaded products</p>
                        </div>
                        <Switch
                            id="show-uploads"
                            checked={dashboardConfig.showUploads}
                            onCheckedChange={() => handleConfigChange("showUploads")}
                            className="data-[state=checked]:bg-luxury-gold scale-125"
                        />
                    </div>
                </div>
            </section>

            {/* Appearance Section (Placeholder) */}
            <section className="bg-white/60 rounded-3xl p-8 border border-stone-100 shadow-sm opacity-70">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-400">
                        <Palette size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif text-stone-400 tracking-wide">Appearance (Coming Soon)</h3>
                </div>
                <p className="text-stone-400 font-light pl-2">Theme customization options will be available in a future update.</p>
            </section>

            {user && (
                <EditProfileModal
                    open={isEditProfileOpen}
                    onOpenChange={setIsEditProfileOpen}
                    user={{
                        name: user.store_name || "",
                        avatar: user.avatar || "",
                        subtitle: user.subtitle || ""
                    }}
                    onSuccess={handleProfileUpdate}
                />
            )}
        </div>
    );
};

export default SettingsContent;
