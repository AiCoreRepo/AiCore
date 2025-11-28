import { useState } from "react";
import { ChevronDown, Plus, X, Settings } from "lucide-react";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import EditProfileModal from "./EditProfileModal";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface ProfileHeaderProps {
    user: {
        name: string;
        avatar: string;
        role: string;
        subtitle: string;
    };
    onUploadClick: () => void;
    onCustomizeClick?: () => void;
    onProfileUpdate?: () => void;
}

const ProfileHeader = ({ user, onUploadClick, onCustomizeClick, onProfileUpdate }: ProfileHeaderProps) => {
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-3xl font-light mb-6">
                    <span className="text-muted-foreground">Creator</span>{" "}
                    <span className="font-semibold text-foreground">Dashboard</span>
                </h1>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="w-20 h-20 rounded-full overflow-hidden bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    </button>

                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-semibold text-foreground">{user.name}</h2>
                            <span className="px-3 py-1 bg-gold text-primary-foreground text-xs font-medium rounded-full">
                                {user.role.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {user.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 items-end w-64">
                <LuxeButton
                    onClick={onUploadClick}
                    variant="luxury-outline"
                    className="w-full flex items-center justify-center gap-2 rounded-full h-12 text-base hover:bg-gold/10 transition-all duration-300"
                >
                    <Plus size={18} />
                    <span>Upload Collection</span>
                </LuxeButton>

                <div className="flex flex-col gap-2 w-full">
                    <LuxeButton
                        onClick={() => setIsEditProfileOpen(true)}
                        variant="ghost"
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/50 hover:bg-gold/10 border border-transparent hover:border-gold/20 rounded-xl text-foreground transition-all duration-300 group"
                    >
                        <span className="font-medium">Edit Profile</span>
                        <ChevronDown size={18} className="text-muted-foreground group-hover:text-gold transition-colors" />
                    </LuxeButton>



                    <LuxeButton
                        onClick={onCustomizeClick}
                        variant="ghost"
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/50 hover:bg-gold/10 border border-transparent hover:border-gold/20 rounded-xl text-foreground transition-all duration-300 group"
                    >
                        <span className="font-medium">Customize Dashboard</span>
                        <Settings size={18} className="text-muted-foreground group-hover:text-gold transition-colors" />
                    </LuxeButton>
                </div>
            </div>

            <EditProfileModal
                open={isEditProfileOpen}
                onOpenChange={setIsEditProfileOpen}
                user={user}
                onSuccess={() => {
                    if (onProfileUpdate) onProfileUpdate();
                    else window.location.reload();
                }}
            />

            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                    <div className="relative">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                        />
                        <DialogClose className="absolute -top-10 right-0 text-white hover:text-gold transition-colors">
                            <X size={32} />
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProfileHeader;
