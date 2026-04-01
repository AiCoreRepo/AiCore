import { useState, useEffect } from "react";
import { ChevronDown, Plus, X, Settings } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import TermsModal from "../TermsModal";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { acceptCreatorTerms, getCreatorTermsStatus } from "@/lib/api";

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
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [isCheckingTerms, setIsCheckingTerms] = useState(true);
    const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);

    // Check if creator has accepted terms on mount
    useEffect(() => {
        checkTermsStatus();
    }, []);

    const checkTermsStatus = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                return;
            }

            const data = await getCreatorTermsStatus(token);
            setHasAcceptedTerms(data.accepted);
        } catch (error) {
            console.error('Error checking terms status:', error);
        } finally {
            setIsCheckingTerms(false);
        }
    };

    const handleUploadClick = () => {
        if (hasAcceptedTerms) {
            // Terms already accepted, proceed to upload
            onUploadClick();
        } else {
            // Show terms modal
            setIsTermsModalOpen(true);
        }
    };

    const handleAcceptTerms = async () => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            alert('Authentication required. Please log in again.');
            return;
        }

        setIsAcceptingTerms(true);

        try {
            await acceptCreatorTerms(token);
            setHasAcceptedTerms(true);
            setIsTermsModalOpen(false);
            onUploadClick();
        } catch (error) {
            console.error('Error accepting terms:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to accept terms. Please try again.';
            alert(message);
        } finally {
            setIsAcceptingTerms(false);
        }
    };

    const handleDeclineTerms = () => {
        setIsTermsModalOpen(false);
    };

    return (
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6 md:gap-0">
            <div>
                <h1 className="text-3xl font-light mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <span className="text-neutral-600">Creator</span>{" "}
                    <span className="font-semibold text-neutral-900">Dashboard</span>
                </h1>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="w-20 h-20 rounded-full overflow-hidden cursor-zoom-in hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg ring-2 ring-white/40"
                    >
                        {user.avatar && user.avatar.startsWith('http') ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#F4E4C1] via-[#FFE8B3] to-[#F4E4C1] flex items-center justify-center">
                                <span className="text-2xl font-bold text-neutral-800">
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                            </div>
                        )}
                    </button>

                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'Playfair Display', serif" }}>{user.name}</h2>
                            <span className="px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-neutral-900 text-xs font-bold rounded-full shadow-md border border-[#D4AF37]/30">
                                {user.role.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-neutral-600 mt-1.5 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {user.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 items-end w-full md:w-64">
                <button
                    onClick={handleUploadClick}
                    disabled={isCheckingTerms}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl h-11 text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] border border-[#FFE8B3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: 'linear-gradient(135deg, #F4E4C1 0%, #FFE8B3 100%)',
                        color: '#1a1a1a',
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>{isCheckingTerms ? 'Loading...' : 'Upload Collection'}</span>
                </button>

                <div className="flex flex-col gap-2 w-full">
                    <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-neutral-800 text-sm font-medium transition-all duration-300 group backdrop-blur-sm hover:bg-white/60"
                        style={{
                            background: 'rgba(255, 255, 255, 0.4)',
                            border: '1px solid rgba(244, 228, 193, 0.5)',
                            boxShadow: '0 2px 8px rgba(244, 228, 193, 0.15)',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        <span>Edit Profile</span>
                        <ChevronDown size={16} className="text-neutral-500 group-hover:text-neutral-700 transition-colors" />
                    </button>

                    <button
                        onClick={onCustomizeClick}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-neutral-800 text-sm font-medium transition-all duration-300 group backdrop-blur-sm hover:bg-white/60"
                        style={{
                            background: 'rgba(255, 255, 255, 0.4)',
                            border: '1px solid rgba(244, 228, 193, 0.5)',
                            boxShadow: '0 2px 8px rgba(244, 228, 193, 0.15)',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        <span>Customize Dashboard</span>
                        <Settings size={16} className="text-neutral-500 group-hover:text-neutral-700 transition-colors" />
                    </button>
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

            <TermsModal
                isOpen={isTermsModalOpen}
                onAccept={handleAcceptTerms}
                onDecline={handleDeclineTerms}
                isSubmitting={isAcceptingTerms}
            />

            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                    <div className="relative">
                        {user.avatar && user.avatar.startsWith('http') ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-96 h-96 rounded-lg shadow-2xl object-cover"
                            />
                        ) : (
                            <div className="w-96 h-96 rounded-lg shadow-2xl bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
                                <span className="text-9xl font-bold text-neutral-950">
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                            </div>
                        )}
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
