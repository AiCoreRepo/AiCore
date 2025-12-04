import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface AuraPromptDialogProps {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export const AuraPromptDialog = ({ isOpen, onAccept, onDecline }: AuraPromptDialogProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50"
                        onClick={onDecline}
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md bg-luxury-black rounded-2xl shadow-2xl border-2 border-gold p-8 relative"
                            style={{
                                background: "linear-gradient(135deg, #0F0F10 0%, #1a1a1a 100%)",
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onDecline}
                                className="absolute top-4 right-4 text-luxury-cream hover:text-gold transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40">
                                    <Sparkles className="w-8 h-8 text-gold" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl md:text-3xl font-serif text-luxury-cream text-center mb-3">
                                Create Your Aura?
                            </h2>

                            {/* Description */}
                            <p className="text-base text-luxury-cream/70 text-center mb-6">
                                Build your personalized AI model for virtual try-on and get styling recommendations tailored just for you.
                            </p>

                            {/* Benefits List */}
                            <div className="space-y-2 mb-8">
                                <div className="flex items-start gap-2">
                                    <span className="text-gold mt-1">✓</span>
                                    <p className="text-sm text-luxury-cream/80">Try on clothes virtually before buying</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-gold mt-1">✓</span>
                                    <p className="text-sm text-luxury-cream/80">Get personalized style recommendations</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-gold mt-1">✓</span>
                                    <p className="text-sm text-luxury-cream/80">See how outfits look on your body type</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={onAccept}
                                    className="w-full px-6 py-3 rounded-full font-medium text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                    style={{
                                        background: "linear-gradient(135deg, #C9A75F 0%, #D4B76E 100%)",
                                        color: "#0F0F10",
                                        boxShadow: "0 8px 32px rgba(201, 165, 92, 0.4)",
                                        border: "1px solid rgba(201, 165, 92, 0.6)",
                                    }}
                                >
                                    Yes, Create My Aura
                                </button>

                                <button
                                    onClick={onDecline}
                                    className="w-full px-6 py-3 rounded-full font-medium text-base border-2 border-gold/40 text-luxury-cream hover:border-gold hover:bg-gold/10 transition-all duration-300"
                                >
                                    Maybe Later
                                </button>
                            </div>

                            {/* Helper Text */}
                            <p className="text-xs text-luxury-cream/50 text-center mt-4">
                                You can create your Aura anytime from your profile settings
                            </p>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
