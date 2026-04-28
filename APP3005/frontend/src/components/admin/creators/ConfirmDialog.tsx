import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;

}

/**
 * ConfirmDialog – Generic confirmation modal used by the admin dashboard
 * Supports danger / warning / success variants with framer-motion animations.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      iconBg: 'bg-red-500/10 border border-red-500/20',
      confirm: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border border-amber-500/20',
      confirm: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    success: {
      icon: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
      confirm: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors"
                onClick={onCancel}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-5', styles.iconBg)}>
                <AlertTriangle className={cn('w-7 h-7', styles.icon)} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-neutral-100 mb-2">{title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">{message}</p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2',
                    styles.confirm,
                  )}
                >
                  {isLoading && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
