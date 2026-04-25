import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

interface SkinToneGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SkinToneGuideModal = ({ isOpen, onClose }: SkinToneGuideModalProps) => {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Full-screen Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[99998]"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />

                    {/* Centered Modal Container */}
                    <div
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 50 }}
                            transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 300,
                                duration: 0.5
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-5xl max-h-[95vh] overflow-y-auto"
                            style={{
                                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(212, 183, 110, 0.5)',
                                border: '3px solid rgba(212, 183, 110, 0.3)',
                            }}
                        >
                            {/* Elegant Header */}
                            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gold/30">
                                <div className="flex-1">
                                    <motion.h2
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-4xl font-serif text-charcoal mb-2 bg-gradient-to-r from-charcoal to-charcoal/70 bg-clip-text"
                                    >
                                        Skin Tone Reference Guide
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-base text-charcoal/60"
                                    >
                                        Select the tone that best matches your complexion for accurate virtual try-on
                                    </motion.p>
                                </div>
                                <motion.button
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    onClick={onClose}
                                    className="ml-4 p-3 rounded-full bg-gold/10 hover:bg-gold/20 transition-all duration-200 hover:scale-110 hover:rotate-90"
                                >
                                    <X className="w-6 h-6 text-charcoal" />
                                </motion.button>
                            </div>

                            {/* Professional Skin Tone Image - Large and Centered */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="bg-gradient-to-br from-cream/20 via-white to-ivory/20 rounded-3xl p-10 mb-8 border-2 border-gold/20 shadow-inner"
                            >
                                <img
                                    src={cloudinaryImages.guides.skinTone}
                                    alt="Professional Skin Tone Reference"
                                    className="w-full h-auto rounded-2xl"
                                    style={{
                                        maxHeight: '500px',
                                        objectFit: 'contain',
                                        margin: '0 auto',
                                        display: 'block'
                                    }}
                                />
                            </motion.div>

                            {/* Detailed Descriptions with Large Color Swatches */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
                            >
                                {[
                                    { title: "Light", color: "#F5D5C0", desc: "Fair, pale peachy beige complexion with cool or neutral undertones. Often burns easily in the sun with minimal tanning." },
                                    { title: "Medium", color: "#D4A574", desc: "Warm tan, golden beige complexion with warm undertones. Tans gradually and evenly with moderate sun exposure." },
                                    { title: "Dusky", color: "#A67C52", desc: "Rich brown, caramel complexion with warm to neutral undertones. Natural sun protection with beautiful depth." },
                                    { title: "Deep", color: "#6B4423", desc: "Dark brown, deep chocolate complexion with rich undertones. High natural sun protection and stunning richness." },
                                ].map((tone, index) => (
                                    <motion.div
                                        key={tone.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        className="bg-gradient-to-br from-cream/40 via-white to-ivory/40 rounded-2xl p-6 border-2 border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div
                                                className="w-16 h-16 rounded-2xl border-3 border-white shadow-xl flex-shrink-0"
                                                style={{
                                                    backgroundColor: tone.color,
                                                    boxShadow: `0 4px 12px ${tone.color}40, inset 0 2px 4px rgba(255,255,255,0.2)`
                                                }}
                                            ></div>
                                            <h3 className="font-bold text-charcoal text-2xl">{tone.title}</h3>
                                        </div>
                                        <p className="text-sm text-charcoal/70 leading-relaxed">
                                            {tone.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Elegant Close Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                onClick={onClose}
                                className="w-full py-5 bg-gradient-to-r from-gold via-[#D4B76E] to-gold text-charcoal font-bold text-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                            >
                                <span className="relative z-10">Perfect, I've got it!</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </motion.button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
