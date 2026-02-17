// ============================================
// TOAST NOTIFICATION COMPONENT
// Bottom floating toast with slide animation
// ============================================

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    onClose,
}) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = {
        success: {
            icon: '✓',
            bgColor: 'bg-green-600',
            textColor: 'text-white',
        },
        error: {
            icon: '✕',
            bgColor: 'bg-red-600',
            textColor: 'text-white',
        },
        info: {
            icon: 'ℹ',
            bgColor: 'bg-blue-600',
            textColor: 'text-white',
        },
        warning: {
            icon: '⚠',
            bgColor: 'bg-orange-600',
            textColor: 'text-white',
        },
    };

    const { icon, bgColor, textColor } = config[type];

    return (
        <div className="toast-enter-active animate-slide-up">
            <div
                className={`
          flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl
          ${bgColor} ${textColor}
          backdrop-blur-sm
        `}
            >
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 font-bold">
                    {icon}
                </div>
                <p className="font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Toast Container Component
interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type?: ToastType }>;
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onRemove,
}) => {
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
};

export default Toast;
