import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TryOnInterstitialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    productTitle?: string;
}

const COMPLIMENTS = [
    "You look absolutely gorgeous today! ✨",
    "That style is going to look stunning on you! 💖",
    "You have such a radiant vibe! 🌟",
    "Get ready to see something amazing! 👗",
    "You're going to rock this look! 💃"
];

const STEPS = [
    {
        icon: <Wand2 className="w-5 h-5 text-purple-500" />,
        title: "AI Analysis",
        desc: "We analyze your body shape and skin tone for a perfect fit."
    },
    {
        icon: <Sparkles className="w-5 h-5 text-gold" />,
        title: "Virtual Fitting",
        desc: "Our engine drapes the fabric realistically on your avatar."
    },
    {
        icon: <Heart className="w-5 h-5 text-red-500" />,
        title: "Final Polish",
        desc: "Adding lighting and shadows for a lifelike result."
    }
];

export const TryOnInterstitialModal = ({ isOpen, onClose, onConfirm, productTitle }: TryOnInterstitialModalProps) => {
    const [compliment, setCompliment] = useState(COMPLIMENTS[0]);

    useEffect(() => {
        if (isOpen) {
            setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
                    >
                        {/* Header Gradient */}
                        <div className="relative h-32 bg-gradient-to-br from-gold/20 via-purple-500/10 to-blue-500/10 p-6 flex items-center justify-center text-center">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-2 inline-flex items-center justify-center rounded-full bg-white/80 px-3 py-1 shadow-sm backdrop-blur-md"
                                >
                                    <Sparkles className="mr-1.5 h-4 w-4 text-gold" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">AI Magic</span>
                                </motion.div>
                                <h2 className="text-xl font-serif text-charcoal">{compliment}</h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="mb-6 text-center text-sm text-gray-600">
                                Hang tight! Here's how we're creating your <span className="font-semibold text-gold">{productTitle || 'outfit'}</span> try-on:
                            </p>

                            <div className="space-y-4">
                                {STEPS.map((step, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 + (idx * 0.1) }}
                                        className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-charcoal text-sm">{step.title}</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-charcoal px-4 py-3 text-sm font-bold text-white shadow-lg shadow-charcoal/20 transition-all hover:scale-[1.02] hover:bg-black active:scale-[0.98]"
                                    style={{
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                        color: '#1a1a1a',
                                        textShadow: '0 1px 0 rgba(255,255,255,0.2)'
                                    }}
                                >
                                    <span>Start Virtual Try-On</span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
