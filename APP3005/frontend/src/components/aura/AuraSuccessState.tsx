import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuraFramedImage } from "./AuraFramedImage";

interface AuraSuccessStateProps {
    avatarUrl?: string;
    onViewDetails?: () => void;
}

export const AuraSuccessState = ({ avatarUrl, onViewDetails }: AuraSuccessStateProps) => {
    const navigate = useNavigate();

    const handleStartShopping = () => {
        navigate("/");
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
        >
            {/* Animated Checkmark */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                }}
                className="flex justify-center"
            >
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">
                    Your Aura is Ready!
                </h2>
                <p className="text-base text-grey-soft">
                    Your personalized AI model is ready for virtual try-on.
                </p>
            </motion.div>

            {/* Avatar Preview */}
            {avatarUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center"
                >
                    <div className="relative w-full max-w-xs overflow-hidden rounded-[24px] border-2 border-gold bg-[#F5EDDD] shadow-[0_18px_48px_rgba(201,165,95,0.2)] aspect-[2/3]">
                        <AuraFramedImage
                            src={avatarUrl}
                            alt="Your Aura Avatar"
                            className="h-full w-full"
                            foregroundClassName="h-full w-full object-contain object-center"
                            loading="eager"
                        />
                    </div>
                </motion.div>
            )}

            {/* CTA Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3 pt-4"
            >
                <button
                    onClick={handleStartShopping}
                    className="w-full px-8 py-4 rounded-full font-medium text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, #C9A75F 0%, #D4B76E 100%)",
                        color: "#0F0F10",
                        boxShadow: "0 8px 32px rgba(201, 165, 92, 0.4)",
                        border: "1px solid rgba(201, 165, 92, 0.6)",
                    }}
                >
                    Start Shopping
                    <ArrowRight className="w-5 h-5" />
                </button>

                {onViewDetails && (
                    <button
                        onClick={onViewDetails}
                        className="w-full text-sm text-gold hover:text-gold-light transition-colors font-medium"
                    >
                        View Aura Details
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
};
