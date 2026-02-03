import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface AuraWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuraWelcomeModal = ({ isOpen, onClose }: AuraWelcomeModalProps) => {
    const navigate = useNavigate();

    const handleCreateAura = () => {
        onClose();
        navigate('/aura-profile');
    };

    const handleSkip = () => {
        onClose();
        // User stays on collection page
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#FDFBF7] to-[#F8F4EC] border-2 border-[#D4AF37]/30">
                <div className="relative p-6">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-[#6B5D4F] hover:text-[#D4AF37] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C4A137] flex items-center justify-center shadow-lg">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-serif text-center text-[#2C2416] mb-2">
                        Welcome to AiVestire!
                    </h2>

                    {/* Subtitle */}
                    <p className="text-center text-[#6B5D4F] mb-6">
                        Create your Aura to unlock personalized AI try-ons and discover styles that perfectly match your unique profile.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                            </div>
                            <p className="text-sm text-[#2C2416]">
                                <span className="font-semibold">AI-Powered Try-Ons</span> - See how clothes look on you before buying
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                            </div>
                            <p className="text-sm text-[#2C2416]">
                                <span className="font-semibold">Personalized Recommendations</span> - Get styles matched to your body type
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                            </div>
                            <p className="text-sm text-[#2C2416]">
                                <span className="font-semibold">Save Time & Money</span> - Shop with confidence
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleCreateAura}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C4A137] hover:from-[#C4A137] hover:to-[#B49127] text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Create My Aura
                        </Button>
                        <Button
                            onClick={handleSkip}
                            variant="ghost"
                            className="w-full text-[#6B5D4F] hover:text-[#2C2416] hover:bg-[#F8F4EC] py-6"
                        >
                            Skip for Now
                        </Button>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-center text-[#9B8B7E] mt-4">
                        You can create your Aura anytime from your dashboard
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
