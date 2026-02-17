import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface OrderCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { reason: string; customReason?: string; feedback?: string }) => void;
    orderNumber: string;
    isLoading?: boolean;
}

const CANCELLATION_REASONS = [
    { value: 'CHANGE_OF_MIND', label: 'Changed my mind' },
    { value: 'FOUND_BETTER_PRICE', label: 'Found a better price elsewhere' },
    { value: 'DELIVERY_TIME_TOO_LONG', label: 'Delivery time is too long' },
    { value: 'ORDERED_BY_MISTAKE', label: 'Ordered by mistake' },
    { value: 'INCORRECT_ADDRESS', label: 'Incorrect delivery address' },
    { value: 'WANT_TO_CHANGE_VARIANT', label: 'Want to change size/color' },
    { value: 'FINANCIAL_REASONS', label: 'Financial reasons' },
    { value: 'OTHER', label: 'Other reason' },
];

export const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    orderNumber,
    isLoading = false,
}) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [errors, setErrors] = useState<{ reason?: string; customReason?: string }>({});

    const validateForm = () => {
        const newErrors: { reason?: string; customReason?: string } = {};

        if (!selectedReason) {
            newErrors.reason = 'Please select a reason for cancellation';
        }

        if (selectedReason === 'OTHER' && customReason.trim().length < 10) {
            newErrors.customReason = 'Please provide a detailed reason (at least 10 characters)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        onConfirm({
            reason: selectedReason,
            customReason: selectedReason === 'OTHER' ? customReason : undefined,
            feedback: feedback.trim() || undefined,
        });
    };

    const handleClose = () => {
        if (!isLoading) {
            setSelectedReason('');
            setCustomReason('');
            setFeedback('');
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="relative px-8 py-6 border-b border-[#E0E0D8] bg-gradient-to-r from-[#FDFBF7] to-white">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-[#6B6B6B]" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-50 rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif text-[#2C2416] mb-1">
                                Cancel Order
                            </h2>
                            <p className="text-sm text-[#6B6B6B]">
                                Order #{orderNumber}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Warning Notice */}
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                            <strong>Important:</strong> Once cancelled, this order cannot be reinstated.
                            Please ensure you want to proceed with the cancellation.
                        </p>
                    </div>

                    {/* Cancellation Reason */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[#2C2416] mb-3">
                            Why are you cancelling this order? <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {CANCELLATION_REASONS.map((reason) => (
                                <label
                                    key={reason.value}
                                    className={`
                                        flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                                        ${selectedReason === reason.value
                                            ? 'border-[#C9A55C] bg-[#FDFBF7]'
                                            : 'border-[#E0E0D8] hover:border-[#C9A55C]/50 bg-white'
                                        }
                                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="cancellation-reason"
                                        value={reason.value}
                                        checked={selectedReason === reason.value}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        disabled={isLoading}
                                        className="w-4 h-4 text-[#C9A55C] border-[#D0D0C8] focus:ring-[#C9A55C]"
                                    />
                                    <span className="ml-3 text-sm text-[#2C2416]">{reason.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.reason && (
                            <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
                        )}
                    </div>

                    {/* Custom Reason (shown only when OTHER is selected) */}
                    {selectedReason === 'OTHER' && (
                        <div className="mb-6 animate-fadeIn">
                            <label className="block text-sm font-medium text-[#2C2416] mb-2">
                                Please specify your reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                disabled={isLoading}
                                placeholder="Tell us why you're cancelling this order..."
                                rows={3}
                                className={`
                                    w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none
                                    ${errors.customReason
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-[#E0E0D8] focus:border-[#C9A55C]'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            />
                            <div className="flex justify-between items-center mt-1">
                                {errors.customReason ? (
                                    <p className="text-sm text-red-600">{errors.customReason}</p>
                                ) : (
                                    <p className="text-xs text-[#999999]">Minimum 10 characters</p>
                                )}
                                <p className="text-xs text-[#999999]">{customReason.length}/500</p>
                            </div>
                        </div>
                    )}

                    {/* Feedback Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[#2C2416] mb-2">
                            Share your feedback to help us improve
                        </label>
                        <p className="text-xs text-[#6B6B6B] mb-3">
                            Your feedback helps us serve you better. Let us know how we can improve our service or products.
                        </p>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            disabled={isLoading}
                            placeholder="What could we have done better? How can we improve your experience with our brand?"
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-[#E0E0D8] rounded-lg focus:outline-none focus:border-[#C9A55C] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            maxLength={1000}
                        />
                        <p className="text-xs text-[#999999] mt-1 text-right">{feedback.length}/1000</p>
                    </div>

                    {/* Trust Message */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💙 <strong>We value your trust.</strong> Your feedback is confidential and helps us enhance our products and services for all our customers.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-[#E0E0D8] bg-[#FDFBF7] flex gap-4">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 border-2 border-[#D0D0C8] bg-white text-[#2C2416] font-medium rounded-lg hover:bg-[#FAF9F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Keep Order
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Cancelling...</span>
                            </>
                        ) : (
                            'Confirm Cancellation'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};
