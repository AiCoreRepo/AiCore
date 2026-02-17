// ============================================
// CANCEL ORDER MODAL COMPONENT
// Glassmorphism modal for cancelling orders
// ============================================

import React, { useState } from 'react';
import type { CancelOrderPayload } from '../types/order.types';
import { CANCEL_REASONS } from '../utils/order.utils';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: CancelOrderPayload) => Promise<void>;
    orderNumber: string;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    orderNumber,
}) => {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const MAX_FEEDBACK_LENGTH = 500;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason) {
            alert('Please select a cancellation reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm({
                reason: reason === 'other' ? customReason : reason,
                custom_reason: reason === 'other' ? customReason : undefined,
                feedback: feedback || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert('Failed to cancel order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setReason('');
            setCustomReason('');
            setFeedback('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={handleClose}
        >
            <div
                className="glass-morphism modal-content w-full max-w-md rounded-2xl p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Cancel Order</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Order #{orderNumber}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isSubmitting}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Reason Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for cancellation *
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        >
                            <option value="">Select a reason</option>
                            {CANCEL_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Reason (only if "Other" is selected) */}
                    {reason === 'other' && (
                        <div className="animate-slide-up">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Please specify *
                            </label>
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Enter your reason"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>
                    )}

                    {/* Feedback */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional feedback (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                            placeholder="Your feedback helps us improve..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">
                                Your feedback helps us improve.
                            </p>
                            <span className={`text-xs transition-colors ${feedback.length > MAX_FEEDBACK_LENGTH * 0.9
                                    ? 'text-orange-500 font-medium'
                                    : 'text-gray-400'
                                }`}>
                                {feedback.length}/{MAX_FEEDBACK_LENGTH}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Keep Order
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all disabled:opacity-50 button-primary relative overflow-hidden"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                                    <span>Cancelling...</span>
                                </div>
                            ) : (
                                'Cancel Order'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CancelOrderModal;
