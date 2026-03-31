import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Item?',
    description = 'Are you sure you want to delete this item? This action cannot be undone.'
}) => {
    // Prevent background scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-700/60 rounded-2xl shadow-2xl shadow-black/50 animate-[slideUp_300ms_ease-out] overflow-hidden">
                {/* Top gradient bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-500/50 to-rose-600/50" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-100 mb-1">{title}</h3>
                            <p className="text-sm text-neutral-400 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-50 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
            {/* Keyframe styles shared with other modals usually, but added here just in case this mounts alone */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};
