import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatedComplimentText } from '@/components/AnimatedComplimentText';

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
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
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
                        className="relative w-full max-w-sm overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-[#E8DCC4] px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5E8C8]">
                                    <Sparkles className="h-4 w-4 text-[#9A7437]" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A7437]">Virtual Try-On</p>
                                    <h2 className="truncate text-sm font-semibold text-[#2C2416]">Ready to create your look?</h2>
                                </div>
                            </div>
                            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DCC4]" aria-label="Close">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4">
                            <AnimatedComplimentText
                                text={compliment}
                                className="block font-serif text-base leading-6 text-[#2C2416]"
                                caretClassName="text-[#D4AF37]"
                                speedMs={80}
                                startDelayMs={100}
                                unit="word"
                            />
                            <p className="mt-2 text-xs leading-5 text-[#6B5D4F]">
                                AI will fit <span className="font-semibold text-[#2C2416]">{productTitle || 'this outfit'}</span> to your saved Aura.
                            </p>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 rounded-xl border border-[#E8DCC4] bg-white px-3 py-2.5 text-xs font-semibold text-[#6B5D4F]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition active:scale-[0.98]"
                                    style={{
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                        color: '#1a1a1a',
                                        textShadow: '0 1px 0 rgba(255,255,255,0.2)'
                                    }}
                                >
                                    <span>Start Try-On</span>
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
