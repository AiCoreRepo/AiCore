import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, saveCreatorAddress, getCreatorAddress, CreatorAddressData } from "@/lib/api";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { User, LayoutDashboard, Palette, Building2, Smartphone, ShieldCheck, MapPin } from "lucide-react";
import EditProfileModal from "../dashboard/EditProfileModal";
import { useAuth } from "@/context/AuthContext";

interface DashboardConfig {
    showStats: boolean;
    showUploads: boolean;
}

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

const getNameFromEmail = (email?: string) =>
    email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "";

const SettingsContent: React.FC = () => {
    const { user, fetchUser, loading } = useAuth();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subtitle: "",
        paymentBeneficiaryName: "",
        paymentUpiId: "",
    });
    
    // Address State
    const [addressData, setAddressData] = useState<CreatorAddressData>({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: "",
    });
    const [addressError, setAddressError] = useState("");

    const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
        showStats: true,
        showUploads: true,
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [paymentError, setPaymentError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.store_name || "Creator",
                subtitle: user.subtitle || "Creator",
                paymentBeneficiaryName: user.paymentDetails?.beneficiaryName || "",
                paymentUpiId: user.paymentDetails?.upiId || "",
            });
            setPaymentError("");
            loadAddress();
        }
    }, [user]);

    async function loadAddress() {
        try {
            const profileFullName = user?.store_name || getNameFromEmail(user?.email);
            const profilePhone = user?.phone || "";
            const addr = await getCreatorAddress();
            if (addr) {
                setAddressData({
                    full_name: addr.full_name || profileFullName,
                    phone: addr.phone || profilePhone,
                    address_line1: addr.address_line1 || "",
                    address_line2: addr.address_line2 || "",
                    city: addr.city || "",
                    state: addr.state || "",
                    pincode: addr.pincode || "",
                });
            } else if (profileFullName || profilePhone) {
                setAddressData(prev => ({
                    ...prev,
                    full_name: prev.full_name || profileFullName,
                    phone: prev.phone || profilePhone,
                }));
            }
        } catch (e) {
            console.error("Failed to load address", e);
        }
    }

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
        if (field === "paymentBeneficiaryName" || field === "paymentUpiId") {
            setPaymentError("");
        }
    };

    const handleAddressChange = (field: keyof CreatorAddressData, value: string) => {
        setAddressData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
        setAddressError("");
    };

    const handleProfileUpdate = async () => {
        await fetchUser();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const beneficiaryName = formData.paymentBeneficiaryName.trim();
            const paymentUpiId = formData.paymentUpiId.trim().toLowerCase();
            const hasAnyPaymentValue = beneficiaryName.length > 0 || paymentUpiId.length > 0;

            if (hasAnyPaymentValue) {
                if (!beneficiaryName || !paymentUpiId) {
                    setPaymentError("Add both beneficiary name and UPI ID to save payout details.");
                    setIsSaving(false);
                    return;
                }

                if (!UPI_ID_REGEX.test(paymentUpiId)) {
                    setPaymentError("Enter a valid UPI ID like yourname@upi.");
                    setIsSaving(false);
                    return;
                }
            }

            // Address validation
            if (!addressData.full_name.trim() || !addressData.phone.trim() || !addressData.address_line1.trim() || 
                !addressData.city.trim() || !addressData.state.trim() || !addressData.pincode.trim()) {
                setAddressError("Please fill all required business address fields correctly.");
                setIsSaving(false);
                return;
            }

            // Save dashboard config
            localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));

            // Save profile details
            await updateProfile({
                name: formData.name,
                subtitle: formData.subtitle,
                paymentBeneficiaryName: beneficiaryName,
                paymentUpiId,
            });

            // Save address
            await saveCreatorAddress(addressData);

            await fetchUser();
            setHasChanges(false);
            setPaymentError("");
            setAddressError("");
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
        } finally {
            setIsSaving(false);
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
                    <p className="text-stone-500 text-lg font-light">Manage your account preferences, address, and payout details.</p>
                </div>
                <LuxeButton
                    variant="luxury"
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`px-8 py-6 text-base transition-all duration-300 ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}
                >
                    {isSaving ? "Saving..." : "Save Changes"}
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

            {/* Business Address Section */}
            <section className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[#F5F2EB] rounded-2xl text-luxury-gold">
                        <MapPin size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif text-luxury-black tracking-wide">Business Address</h3>
                </div>

                <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-base font-medium text-luxury-black">Full Name *</Label>
                        <Input value={addressData.full_name} onChange={(e) => handleAddressChange("full_name", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="Enter your full name" required minLength={2} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-base font-medium text-luxury-black">Contact Phone *</Label>
                        <Input type="tel" value={addressData.phone} onChange={(e) => handleAddressChange("phone", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="+91 9876543210" required pattern="^\+?[0-9]{10,13}$" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-base font-medium text-luxury-black">Address Line 1 *</Label>
                        <Input value={addressData.address_line1} onChange={(e) => handleAddressChange("address_line1", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="House No, Building, Street Area" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-base font-medium text-luxury-black">Address Line 2 (Optional)</Label>
                        <Input value={addressData.address_line2} onChange={(e) => handleAddressChange("address_line2", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="Locality, Landmark, etc." />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-base font-medium text-luxury-black">City *</Label>
                        <Input value={addressData.city} onChange={(e) => handleAddressChange("city", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="e.g. Mumbai" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-base font-medium text-luxury-black">State *</Label>
                        <Input value={addressData.state} onChange={(e) => handleAddressChange("state", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="e.g. Maharashtra" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-base font-medium text-luxury-black">Pincode *</Label>
                        <Input type="text" inputMode="numeric" value={addressData.pincode} onChange={(e) => handleAddressChange("pincode", e.target.value)} className="h-12 bg-[#F5F2EB]/30 border-stone-200 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg" placeholder="6-digit postal code" maxLength={6} required pattern="^[0-9]{6}$" />
                    </div>
                </div>
                {addressError && <p className="mt-4 text-sm font-medium text-red-600">{addressError}</p>}
            </section>

            <section className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[#F5F2EB] rounded-2xl text-luxury-gold">
                        <Building2 size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif text-luxury-black tracking-wide">Payout Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <Label className="text-base font-medium text-luxury-black">Settlement Gateway</Label>
                        <Input
                            value="PayU"
                            disabled
                            className="h-12 bg-[#F5F2EB]/40 border-stone-200 text-stone-600 text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-base font-medium text-luxury-black">Payout Method</Label>
                        <Input
                            value="UPI"
                            disabled
                            className="h-12 bg-[#F5F2EB]/40 border-stone-200 text-stone-600 text-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="paymentBeneficiaryName" className="text-base font-medium text-luxury-black">
                            Beneficiary Name
                        </Label>
                        <Input
                            id="paymentBeneficiaryName"
                            value={formData.paymentBeneficiaryName}
                            onChange={(e) => handleInputChange("paymentBeneficiaryName", e.target.value)}
                            className="h-12 bg-[#F5F2EB]/30 border-stone-200 !text-[#1B150C] caret-[#1B150C] placeholder:!text-stone-500 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg"
                            placeholder="Name on receiving UPI account"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentUpiId" className="text-base font-medium text-luxury-black">
                            UPI ID
                        </Label>
                        <div className="relative">
                            <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                            <Input
                                id="paymentUpiId"
                                value={formData.paymentUpiId}
                                onChange={(e) => handleInputChange("paymentUpiId", e.target.value)}
                                className="h-12 pl-11 bg-[#F5F2EB]/30 border-stone-200 !text-[#1B150C] caret-[#1B150C] placeholder:!text-stone-500 focus:border-luxury-gold focus:ring-luxury-gold/20 text-lg"
                                placeholder="yourname@upi"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[#E8D9BC] bg-[#FCF8F1] p-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck size={18} className="text-luxury-gold mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-luxury-black">
                                Creator payouts will be settled through PayU to this UPI ID.
                            </p>
                            <p className="text-sm text-stone-500">
                                Enter only the receiving UPI ID. Never enter your UPI PIN or OTP here.
                            </p>
                        </div>
                    </div>
                </div>

                {paymentError && (
                    <p className="mt-4 text-sm font-medium text-red-600">{paymentError}</p>
                )}
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
