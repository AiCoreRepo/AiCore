// ============================================
// REPLACE ORDER MODAL COMPONENT
// Modal for requesting order replacement
// ============================================

import React, { useState } from 'react';
import type { ReplaceOrderPayload } from '../types/order.types';
import { REPLACEMENT_REASONS } from '../utils/order.utils';

interface ReplaceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: ReplaceOrderPayload) => Promise<void>;
    orderNumber: string;
}

export const ReplaceOrderModal: React.FC<ReplaceOrderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    orderNumber,
}) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [customReason, setCustomReason] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const MAX_FEEDBACK_LENGTH = 500;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReason) {
            alert('Please select a replacement reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm({
                replace_reason: selectedReason as any,
                custom_reason: selectedReason === 'OTHER' ? customReason : undefined,
                feedback: feedback || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to request replacement:', error);
            alert('Failed to request replacement. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setSelectedReason('');
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
                className="glass-morphism modal-content w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto smooth-scroll"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="animate-rotate inline-block">🔁</span> Replace Item
                        </h2>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Reason Selection - Chips */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select reason for replacement *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {REPLACEMENT_REASONS.map((reason) => (
                                <button
                                    key={reason.value}
                                    type="button"
                                    onClick={() => setSelectedReason(reason.value)}
                                    className={`
                    chip p-4 rounded-xl border-2 text-left transition-all
                    ${selectedReason === reason.value
                                            ? 'border-purple-500 bg-purple-50 chip-selected'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }
                  `}
                                >
                                    <div className="text-2xl mb-1">{reason.emoji}</div>
                                    <div className="text-xs font-medium text-gray-700">
                                        {reason.label.replace(reason.emoji, '').trim()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Reason (only if "OTHER" is selected) */}
                    {selectedReason === 'OTHER' && (
                        <div className="animate-slide-up">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Please specify the reason *
                            </label>
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Enter your reason"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>
                    )}

                    {/* Additional Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional notes (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                            placeholder="Any additional details about the issue..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-xs transition-colors ${feedback.length > MAX_FEEDBACK_LENGTH * 0.9
                                    ? 'text-orange-500 font-medium'
                                    : 'text-gray-400'
                                }`}>
                                {feedback.length}/{MAX_FEEDBACK_LENGTH}
                            </span>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-purple-800">
                                <p className="font-medium mb-1">Replacement Process:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Your request will be reviewed within 24 hours</li>
                                    <li>Original item pickup will be scheduled</li>
                                    <li>New item will be dispatched after pickup</li>
                                    <li>No additional charges for replacement</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedReason}
                            className="flex-1 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all disabled:opacity-50 button-primary relative overflow-hidden"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                'Request Replacement'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReplaceOrderModal;
