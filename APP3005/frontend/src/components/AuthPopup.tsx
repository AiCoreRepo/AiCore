import { useEffect, useState } from 'react';
import { X, Sparkles, User, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthPopupProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'login' | 'aura';
    onAction: () => void;
}

const greetings = [
    "Hey cutie! 💕",
    "Hey beautiful! ✨",
    "Hey gorgeous! 🌟",
    "Hey there! 👋",
    "Hello lovely! 💫"
];

const getRandomGreeting = () => {
    return greetings[Math.floor(Math.random() * greetings.length)];
};

export const AuthPopup = ({ isOpen, onClose, type, onAction }: AuthPopupProps) => {
    const [greeting, setGreeting] = useState(getRandomGreeting());

    useEffect(() => {
        if (isOpen) {
            setGreeting(getRandomGreeting());
        }
    }, [isOpen]);

    const content = type === 'login'
        ? {
            icon: User,
            title: "Login Required",
            message: "You need to be logged in to access this amazing feature!",
            actionText: "Login Now",
            gradient: "from-purple-500 to-pink-500"
        }
        : {
            icon: Camera,
            title: "Create Your Aura First",
            message: "Let's create your personalized Aura to unlock AI-powered fashion magic!",
            actionText: "Create Aura",
            gradient: "from-amber-500 to-orange-500"
        };

    const Icon = content.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Popup */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative w-full max-w-md"
                        >
                            {/* Card */}
                            <div className="relative bg-gradient-to-br from-white via-[#FFF8F0] to-white rounded-3xl shadow-2xl border-2 border-[#D4AF37]/30 overflow-hidden">
                                {/* Animated Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#D4AF37_1px,transparent_1px)] bg-[length:24px_24px]"></div>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-all duration-300 hover:scale-110 z-10"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>

                                {/* Content */}
                                <div className="relative p-8 text-center">
                                    {/* Animated Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                        className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${content.gradient} flex items-center justify-center mb-6 shadow-lg`}
                                    >
                                        <Icon className="w-10 h-10 text-white" />
                                    </motion.div>

                                    {/* Greeting with Sparkles */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-center justify-center gap-2 mb-3"
                                    >
                                        <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#B8941F] bg-clip-text text-transparent">
                                            {greeting}
                                        </h2>
                                        <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                                    </motion.div>

                                    {/* Title */}
                                    <motion.h3
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-xl font-semibold text-[#2C2416] mb-3"
                                    >
                                        {content.title}
                                    </motion.h3>

                                    {/* Message */}
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-gray-600 mb-8 leading-relaxed"
                                    >
                                        {content.message}
                                    </motion.p>

                                    {/* Action Buttons */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="flex flex-col gap-3"
                                    >
                                        <button
                                            onClick={onAction}
                                            className={`w-full py-4 rounded-2xl bg-gradient-to-r ${content.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                                        >
                                            {content.actionText}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-300"
                                        >
                                            Maybe Later
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
