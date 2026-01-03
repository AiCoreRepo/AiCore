import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type PopupType = 'success' | 'error' | 'info';

interface PopupData {
    id: string;
    title: string;
    message: string;
    type: PopupType;
}

interface PopupContextType {
    showPopup: (title: string, message: string, type?: PopupType) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const usePopup = () => {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider');
    }
    return context;
};

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [popups, setPopups] = useState<PopupData[]>([]);

    const showPopup = useCallback((title: string, message: string, type: PopupType = 'success') => {
        const id = Math.random().toString(36).substring(7);
        setPopups((prev) => [...prev, { id, title, message, type }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            removePopup(id);
        }, 5000);
    }, []);

    const removePopup = (id: string) => {
        setPopups((prev) => prev.filter((popup) => popup.id !== id));
    };

    return (
        <PopupContext.Provider value={{ showPopup }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
                <AnimatePresence>
                    {popups.map((popup) => (
                        <PopupItem key={popup.id} popup={popup} onClose={() => removePopup(popup.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </PopupContext.Provider>
    );
};

const PopupItem: React.FC<{ popup: PopupData; onClose: () => void }> = ({ popup, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto w-[400px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-100 overflow-hidden relative"
        >
            <div className="p-5 flex items-start gap-4">
                <div className={`mt-1 ${popup.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {popup.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div className="flex-1">
                    <h4 className="font-serif text-lg font-medium text-luxury-black mb-1">{popup.title}</h4>
                    <p className="text-stone-500 text-sm leading-relaxed">{popup.message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-stone-300 hover:text-luxury-black transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
            {/* Progress bar */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={`h-1 ${popup.type === 'error' ? 'bg-red-500' : 'bg-luxury-gold'}`}
            />
        </motion.div>
    );
};
