import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { LayoutDashboard, Eye, EyeOff } from "lucide-react";

interface DashboardConfig {
    showStats: boolean;
    showUploads: boolean;
}

interface CustomizeDashboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: DashboardConfig;
    onConfigChange: (config: DashboardConfig) => void;
}

const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
    open,
    onOpenChange,
    config,
    onConfigChange,
}) => {
    const handleToggle = (key: keyof DashboardConfig) => {
        onConfigChange({
            ...config,
            [key]: !config[key],
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dashboard-theme bg-foreground text-primary-foreground sm:max-w-[425px] border-muted-foreground/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-primary-foreground">
                        <LayoutDashboard className="w-5 h-5 text-luxury-gold" />
                        Customize Dashboard
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Choose which sections you want to see on your dashboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between space-x-4 rounded-xl border border-muted-foreground/20 p-4 bg-muted-foreground/10 hover:bg-muted-foreground/20 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-lg bg-muted-foreground/20 text-primary-foreground">
                                {config.showStats ? <Eye size={20} /> : <EyeOff size={20} />}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="show-stats" className="text-base font-medium text-primary-foreground cursor-pointer">
                                    Stats Overview
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    View your performance metrics and analytics
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="show-stats"
                            checked={config.showStats}
                            onCheckedChange={() => handleToggle("showStats")}
                            className="data-[state=checked]:bg-luxury-gold"
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-xl border border-muted-foreground/20 p-4 bg-muted-foreground/10 hover:bg-muted-foreground/20 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-lg bg-muted-foreground/20 text-primary-foreground">
                                {config.showUploads ? <Eye size={20} /> : <EyeOff size={20} />}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="show-uploads" className="text-base font-medium text-primary-foreground cursor-pointer">
                                    Recent Uploads
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Manage your latest product uploads
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="show-uploads"
                            checked={config.showUploads}
                            onCheckedChange={() => handleToggle("showUploads")}
                            className="data-[state=checked]:bg-luxury-gold"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <LuxeButton onClick={() => onOpenChange(false)} className="w-full sm:w-auto" variant="luxury">
                        Done
                    </LuxeButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CustomizeDashboardModal;
