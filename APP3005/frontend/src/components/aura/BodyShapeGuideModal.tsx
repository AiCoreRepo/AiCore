import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { IMG } from "@/constants/cloudinary-images";

interface BodyShapeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BodyShapeGuideModal = ({ isOpen, onClose }: BodyShapeGuideModalProps) => {
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
                            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-6xl max-h-[95vh] overflow-y-auto"
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
                                        Body Shape Reference Guide
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-base text-charcoal/60"
                                    >
                                        Choose the shape that best matches your silhouette for personalized recommendations
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

                            {/* Professional Body Shape Image - Large and Centered */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="bg-gradient-to-br from-cream/20 via-white to-ivory/20 rounded-3xl p-10 mb-8 border-2 border-gold/20 shadow-inner"
                            >
                                <img
                                    src={IMG.bodyShapesGuide}
                                    alt="Professional Body Shape Reference"
                                    className="w-full h-auto rounded-2xl"
                                    style={{
                                        maxHeight: '600px',
                                        objectFit: 'contain',
                                        margin: '0 auto',
                                        display: 'block'
                                    }}
                                />
                            </motion.div>

                            {/* Detailed Descriptions Grid */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
                            >
                                {[
                                    { title: "Rectangle", desc: "Athletic, straight build with shoulders and hips aligned. Minimal waist definition with balanced proportions throughout." },
                                    { title: "Pear Shape", desc: "Smaller upper body with defined waist. Fuller hips and thighs create a feminine, curvy lower body silhouette." },
                                    { title: "Apple Shape", desc: "Broader shoulders and bust with fuller midsection. Slimmer hips and legs create an inverted proportion balance." },
                                    { title: "Hourglass", desc: "Balanced shoulders and hips with dramatically defined waist. Classic curvy, feminine silhouette with symmetry." },
                                    { title: "Inverted Triangle", desc: "Broad, athletic shoulders with narrow waist and hips. Strong upper body with slimmer, toned lower body." },
                                ].map((shape, index) => (
                                    <motion.div
                                        key={shape.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        className="bg-gradient-to-br from-cream/40 via-white to-ivory/40 rounded-2xl p-6 border-2 border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gold to-[#D4B76E]"></div>
                                            <h3 className="font-bold text-charcoal text-xl">{shape.title}</h3>
                                        </div>
                                        <p className="text-sm text-charcoal/70 leading-relaxed">
                                            {shape.desc}
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
