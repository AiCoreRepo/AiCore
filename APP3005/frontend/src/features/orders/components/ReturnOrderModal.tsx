// ============================================
// RETURN ORDER MODAL COMPONENT
// Beautiful, premium, broad split-pane design
// ============================================

import React, { useState } from 'react';
import type { ReturnOrderPayload } from '../types/order.types';
import { RETURN_REASONS } from '../utils/order.utils';
import {
    X,
    PackageX, AlertTriangle, XCircle, Ruler, Palette, ShieldAlert,
    FileQuestion, RotateCcw, MoreHorizontal, ArrowRight, Check
} from 'lucide-react';

const getReasonDetails = (value: string) => {
    switch (value) {
        case 'DAMAGED': return { icon: <PackageX className="w-5 h-5" />, desc: 'Item arrived broken or damaged during transit' };
        case 'DEFECTIVE': return { icon: <AlertTriangle className="w-5 h-5" />, desc: 'Product malfunctions or has a manufacturing defect' };
        case 'WRONG_ITEM': return { icon: <XCircle className="w-5 h-5" />, desc: 'Received a completely different item than ordered' };
        case 'SIZE_ISSUE': return { icon: <Ruler className="w-5 h-5" />, desc: 'The fit is too big or too small' };
        case 'COLOR_DIFFERENCE': return { icon: <Palette className="w-5 h-5" />, desc: 'Color significantly differs from the website images' };
        case 'QUALITY_ISSUE': return { icon: <ShieldAlert className="w-5 h-5" />, desc: 'Material or overall build quality is poor' };
        case 'NOT_AS_DESCRIBED': return { icon: <FileQuestion className="w-5 h-5" />, desc: 'Product differs from its online description' };
        case 'CHANGED_MIND': return { icon: <RotateCcw className="w-5 h-5" />, desc: 'Purchased by mistake or no longer needed' };
        case 'OTHER':
        default: return { icon: <MoreHorizontal className="w-5 h-5" />, desc: 'Any other reason not listed here' };
    }
};

interface ReturnOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: ReturnOrderPayload) => Promise<void>;
    orderNumber: string;
}

export const ReturnOrderModal: React.FC<ReturnOrderModalProps> = ({
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!selectedReason) {
            alert('Please select a return reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm({
                return_reason: selectedReason as any,
                custom_reason: selectedReason === 'OTHER' ? customReason : undefined,
                feedback: feedback || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to request return:', error);
            alert('Failed to request return. Please try again.');
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)' }}
            onClick={handleClose}
        >
            <div
                className="w-full max-w-[1000px] h-[90vh] sm:h-[85vh] md:h-[80vh] bg-[#FDFBF7] rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Panel: Information & Brand Aesthetic (Hidden on very small screens) */}
                <div className="hidden md:flex flex-col w-[35%] bg-[#1A150D] p-10 text-[#FDFBF7] relative overflow-hidden flex-shrink-0 border-r border-[#C9A55C]/20">
                    {/* Decorative Gradients */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#C9A55C] rounded-full blur-[120px] opacity-15 translate-x-32 -translate-y-32"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C9A55C] rounded-full blur-[120px] opacity-10 -translate-x-32 translate-y-32"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Icon & Title */}
                        <div className="mb-10">
                            <div className="w-14 h-14 bg-[#2C2416] rounded-2xl flex items-center justify-center mb-6 shadow-inner shadow-[#C9A55C]/20 border border-[#C9A55C]/30">
                                <RotateCcw className="w-7 h-7 text-[#C9A55C]" />
                            </div>
                            <h2 className="text-4xl font-serif mb-2 tracking-wide font-medium text-white">Return Item</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-[1px] bg-[#C9A55C]"></div>
                                <p className="text-[#C9A55C] font-semibold text-xs tracking-[0.2em] uppercase">
                                    {orderNumber}
                                </p>
                            </div>
                        </div>

                        {/* Process Timeline */}
                        <div className="mt-auto space-y-8">
                            <h4 className="text-white/60 text-xs tracking-widest uppercase font-semibold mb-6">Return Process</h4>

                            <div className="flex gap-4 items-start group">
                                <div className="w-8 h-8 rounded-full bg-[#C9A55C]/10 flex items-center justify-center flex-shrink-0 border border-[#C9A55C]/30 group-hover:bg-[#C9A55C] group-hover:text-[#1A150D] transition-colors duration-300">
                                    <span className="text-[#C9A55C] group-hover:text-[#1A150D] font-bold text-sm transition-colors duration-300">1</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium mb-1.5 text-base">Select a Reason</h5>
                                    <p className="text-[#999999] text-sm leading-relaxed">Help us understand why you're returning this item to improve our collection.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start group">
                                <div className="w-8 h-8 rounded-full bg-[#C9A55C]/10 flex items-center justify-center flex-shrink-0 border border-[#C9A55C]/30 group-hover:bg-[#C9A55C] group-hover:text-[#1A150D] transition-colors duration-300">
                                    <span className="text-[#C9A55C] group-hover:text-[#1A150D] font-bold text-sm transition-colors duration-300">2</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium mb-1.5 text-base">Schedule Pickup</h5>
                                    <p className="text-[#999999] text-sm leading-relaxed">We will coordinate a convenient time for a seamless doorstep pickup.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start group">
                                <div className="w-8 h-8 rounded-full bg-[#C9A55C]/10 flex items-center justify-center flex-shrink-0 border border-[#C9A55C]/30 group-hover:bg-[#C9A55C] group-hover:text-[#1A150D] transition-colors duration-300">
                                    <span className="text-[#C9A55C] group-hover:text-[#1A150D] font-bold text-sm transition-colors duration-300">3</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium mb-1.5 text-base">Get Refund</h5>
                                    <p className="text-[#999999] text-sm leading-relaxed">Once verified at our atelier, your refund will be initiated instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Form Content */}
                <div className="flex-1 flex flex-col relative bg-[#FDFBF7]">

                    {/* Header (Mobile Only) & Close Button */}
                    <div className="flex items-center justify-between p-6 border-b border-[#E0E0D8] md:border-none md:absolute md:top-0 md:right-0 md:w-full md:justify-end md:p-6 md:z-20">
                        <div className="md:hidden">
                            <h2 className="text-xl font-bold text-[#2C2416]">Return Item</h2>
                            <p className="text-xs text-[#999999] mt-1 font-mono">Order {orderNumber}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2.5 bg-white border border-[#E0E0D8] text-[#999999] hover:text-[#2C2416] hover:border-[#C9A55C] shadow-sm rounded-full transition-all focus:outline-none"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:px-10 md:pt-16 md:pb-10 scrollbar-thin scrollbar-thumb-[#E0E0D8]">
                        <div className="max-w-3xl mx-auto">

                            {/* Section Title */}
                            <div className="mb-6 hidden md:block">
                                <h3 className="text-2xl font-bold text-[#2C2416]">Return Details</h3>
                                <p className="text-[#6B6B6B] text-sm mt-1">Please provide the specifics of your request.</p>
                            </div>

                            {/* Reason Grid */}
                            <div className="mb-6">
                                <label className="block text-[14px] font-bold text-[#2C2416] mb-3 flex items-center gap-2">
                                    Select the main reason <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {RETURN_REASONS.map((reason) => {
                                        const isSelected = selectedReason === reason.value;
                                        const detail = getReasonDetails(reason.value);
                                        return (
                                            <button
                                                key={reason.value}
                                                type="button"
                                                onClick={() => setSelectedReason(reason.value)}
                                                className={`group flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden ${isSelected
                                                    ? 'border-[#C9A55C] bg-white shadow-[0_4px_15px_rgb(201,165,92,0.12)] ring-1 ring-[#C9A55C]/10'
                                                    : 'border-[#EBE6D8] bg-white hover:border-[#C9A55C]/40 hover:shadow-md hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSelected ? 'bg-[#C9A55C] text-white shadow-md shadow-[#C9A55C]/30' : 'bg-[#F5F3EE] text-[#6B6B6B] group-hover:bg-[#C9A55C]/10 group-hover:text-[#C9A55C]'
                                                    }`}>
                                                    {detail.icon}
                                                </div>
                                                <div className="flex-1 mt-0.5">
                                                    <h4 className={`font-bold text-[13px] mb-1 transition-colors leading-tight ${isSelected ? 'text-[#2C2416]' : 'text-[#4A3D24]'}`}>
                                                        {reason.label.replace(reason.emoji, '').trim()}
                                                    </h4>
                                                    <p className="text-[11px] text-[#999999] leading-snug pr-4">
                                                        {detail.desc}
                                                    </p>
                                                </div>

                                                {/* Checkmark indicator top corner relative to card */}
                                                <div className={`absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-[#C9A55C] scale-100 opacity-100' : 'bg-transparent border-2 border-[#E0E0D8] scale-90 opacity-40 group-hover:border-[#C9A55C]/40'
                                                    }`}>
                                                    <Check className={`w-2.5 h-2.5 text-white transition-all duration-300 delay-100 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} strokeWidth={3.5} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Reason Input */}
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${selectedReason === 'OTHER' ? 'max-h-[120px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                                <label className="block text-[14px] font-bold text-[#2C2416] mb-2">
                                    Please specify your reason <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="E.g., The fabric feels different than expected"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-[#EBE6D8] bg-white text-[#2C2416] placeholder-[#999999] focus:outline-none focus:border-[#C9A55C] focus:ring-4 focus:ring-[#C9A55C]/10 transition-all text-[14px]"
                                    required={selectedReason === 'OTHER'}
                                />
                            </div>

                            {/* Additional Feedback */}
                            <div className="mb-2">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-[14px] font-bold text-[#2C2416]">
                                        Additional Notes <span className="text-[#999999] font-medium text-xs ml-1">(Optional)</span>
                                    </label>
                                    <span className={`text-xs font-semibold ${feedback.length > MAX_FEEDBACK_LENGTH * 0.9 ? 'text-red-500' : 'text-[#999999]'}`}>
                                        {feedback.length} / {MAX_FEEDBACK_LENGTH}
                                    </span>
                                </div>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                                    placeholder="Tell us what went wrong so we can improve your future experiences..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-[#EBE6D8] bg-white text-[#2C2416] placeholder-[#999999] text-[14px] focus:outline-none focus:border-[#C9A55C] focus:ring-4 focus:ring-[#C9A55C]/10 transition-all resize-none"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 md:px-10 py-5 bg-white border-t border-[#E0E0D8] z-10 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-[#4A3D24] font-bold hover:bg-[#F5F3EE] transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#E0E0D8]"
                        >
                            Cancel Request
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedReason}
                            className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-[#2C2416] text-[#C9A55C] font-bold hover:bg-[#1A150D] shadow-lg shadow-[#2C2416]/20 transition-all disabled:opacity-50 disabled:bg-[#E0E0D8] disabled:text-[#999999] disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-[#C9A55C]/30 flex justify-center items-center gap-2 group"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Confirm Return</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReturnOrderModal;
