import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/lib/api";

interface EditProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        name: string;
        subtitle: string;
        avatar: string;
    };
    onSuccess: () => void;
}

const EditProfileModal = ({ open, onOpenChange, user, onSuccess }: EditProfileModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        subtitle: user.subtitle,
        avatar: user.avatar,
    });

    useEffect(() => {
        if (open) {
            setFormData({
                name: user.name,
                subtitle: user.subtitle,
                avatar: user.avatar,
            });
        }
    }, [open, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile(formData);
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dashboard-theme bg-foreground text-primary-foreground max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-primary-foreground">
                        Edit Profile
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Subtitle</label>
                        <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            className="w-full px-4 py-2 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Avatar URL</label>
                        <input
                            type="text"
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            className="w-full px-4 py-2 bg-muted-foreground/20 border border-muted-foreground/30 rounded-lg text-primary-foreground focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <LuxeButton
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </LuxeButton>
                        <LuxeButton
                            type="submit"
                            variant="luxury"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </LuxeButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileModal;
