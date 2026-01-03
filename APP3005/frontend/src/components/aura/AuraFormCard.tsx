import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { PhotoUploadZone } from "./PhotoUploadZone";
import { BodyAttributesForm } from "./BodyAttributesForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./aura-styles.css";

interface BodyAttributes {
    height?: number;
    weight?: number;
    skinTone?: string;
    gender?: string;
    bodyShape?: string;
    ageRange?: string;
    hairStyle?: string;
}

interface AuraFormCardProps {
    onCreateAura: (photoFile: File, attributes: BodyAttributes) => void;
    isProcessing: boolean;
}

export const AuraFormCard = ({ onCreateAura, isProcessing }: AuraFormCardProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [attributes, setAttributes] = useState<BodyAttributes>({});

    const handlePhotoSelect = (file: File, preview: string) => {
        setPhotoFile(file);
        setPhotoPreview(preview);
    };

    const handlePhotoRemove = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleCreateAura = () => {
        if (photoFile) {
            onCreateAura(photoFile, attributes);
        }
    };

    const handleSkip = () => {
        navigate("/");
    };

    const isFormValid = photoFile !== null;

    return (
        <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-cream via-ivory to-cream overflow-hidden">
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 lg:py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-xl"
                >
                    {/* Card Container - Golden Background */}
                    <div
                        className="bg-gradient-to-br from-gold/5 via-cream/80 to-gold/10 backdrop-blur-sm rounded-3xl shadow-2xl border border-gold/30 p-6 sm:p-8 lg:p-10 overflow-y-auto hide-scrollbar"
                        style={{ maxHeight: "85vh" }}
                    >
                        {/* Welcome Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-6"
                        >
                            <p className="text-sm text-charcoal/60 mb-1">
                                Welcome back,
                            </p>
                            <p className="text-lg font-bold bg-gradient-to-r from-gold via-gold to-charcoal bg-clip-text text-transparent">
                                {user?.email || "User"}
                            </p>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl md:text-5xl font-serif text-charcoal mb-3 leading-tight"
                        >
                            Create Your Aura
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm text-charcoal/60 mb-8"
                        >
                            Build your personalized AI model for virtual try-on and styling recommendations.
                        </motion.p>

                        {/* Photo Upload Zone */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mb-8"
                        >
                            <PhotoUploadZone
                                onPhotoSelect={handlePhotoSelect}
                                photoPreview={photoPreview}
                                onRemove={handlePhotoRemove}
                            />
                        </motion.div>

                        {/* Body Attributes Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="mb-8"
                        >
                            <BodyAttributesForm
                                attributes={attributes}
                                onChange={setAttributes}
                            />
                        </motion.div>

                        {/* Stunning Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="space-y-4"
                        >
                            {/* Create Aura Button - Stunning Design */}
                            <button
                                onClick={handleCreateAura}
                                disabled={!isFormValid || isProcessing}
                                className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-r from-gold via-[#D4B76E] to-gold transition-all duration-300 ${isFormValid && !isProcessing ? 'opacity-100' : 'opacity-0'}`}></div>
                                <div className={`absolute inset-0 bg-gray-200 ${isFormValid && !isProcessing ? 'opacity-0' : 'opacity-100'}`}></div>

                                {/* Shine Effect */}
                                {isFormValid && !isProcessing && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                )}

                                {/* Button Content */}
                                <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                                    {isProcessing ? (
                                        <>
                                            <Sparkles className="w-5 h-5 text-charcoal animate-spin" />
                                            <span className="font-bold text-base text-charcoal">Creating Your Aura...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className={`w-5 h-5 transition-colors ${isFormValid ? 'text-charcoal' : 'text-gray-500'}`} />
                                            <span className={`font-bold text-base transition-colors ${isFormValid ? 'text-charcoal' : 'text-gray-500'}`}>
                                                Create My Aura
                                            </span>
                                            <ArrowRight className={`w-5 h-5 transition-all ${isFormValid ? 'text-charcoal group-hover:translate-x-1' : 'text-gray-500'}`} />
                                        </>
                                    )}
                                </div>

                                {/* Bottom Glow */}
                                {isFormValid && !isProcessing && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-gold/40 blur-xl group-hover:bg-gold/60 transition-all"></div>
                                )}
                            </button>

                            {/* Skip Button - Elegant Design */}
                            <button
                                onClick={handleSkip}
                                disabled={isProcessing}
                                className="group w-full px-8 py-3.5 rounded-2xl font-semibold text-sm border-2 border-gold/30 text-charcoal/70 hover:border-gold hover:text-charcoal hover:bg-gold/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>Skip for now</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>

                        {/* Helper Text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                            className="mt-6 text-center"
                        >
                            <p className="text-xs text-charcoal/50">
                                ⏱️ Takes approximately 20 seconds to generate your personalized Aura
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
