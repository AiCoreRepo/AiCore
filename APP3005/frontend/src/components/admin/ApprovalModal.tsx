import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { animations, typography } from '@/constants/theme';
import { Product } from './ApprovalCard';

interface ApprovalModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onApprove: (productId: string, comment?: string) => Promise<void>;
    onReject: (productId: string, comment: string) => Promise<void>;
}

/**
 * ApprovalModal - Product review modal with split layout
 * Features smooth animations and approve/reject actions
 */
export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    isOpen,
    product,
    onClose,
    onApprove,
    onReject,
}) => {
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    if (!product) return null;

    const handleApprove = async () => {
        setAction('approve');
        setIsLoading(true);
        try {
            await onApprove(product.product_id, comment || undefined);
            onClose();
            setComment('');
        } catch (error) {
            console.error('Approval failed:', error);
        } finally {
            setIsLoading(false);
            setAction(null);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        setAction('reject');
        setIsLoading(true);
        try {
            await onReject(product.product_id, comment);
            onClose();
            setComment('');
        } catch (error) {
            console.error('Rejection failed:', error);
        } finally {
            setIsLoading(false);
            setAction(null);
        }
    };

    const formatPrice = (cents: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(cents / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        variants={animations.modalBackdrop}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            className="w-full max-w-6xl bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 pointer-events-auto"
                            variants={animations.modalContent}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-200" />
                            </button>

                            {/* Split Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                                {/* Left: Image */}
                                <div className="relative bg-neutral-900 flex items-center justify-center p-8">
                                    <img
                                        src={product.thumbnail || 'https://placehold.co/600x800/1a1a1a/D4AF37?text=No+Image'}
                                        alt={product.title}
                                        className="max-w-full max-h-[700px] object-contain rounded-2xl shadow-2xl"
                                    />
                                </div>

                                {/* Right: Details */}
                                <div className="flex flex-col p-8 space-y-6">
                                    {/* Header */}
                                    <div>
                                        <h2
                                            className="text-3xl font-bold text-neutral-100 mb-2"
                                            style={{ fontFamily: typography.fontSerif }}
                                        >
                                            {product.title}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-neutral-950 font-bold">
                                                {product.creator.store_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-200">
                                                    {product.creator.store_name}
                                                </p>
                                                <p className="text-xs text-neutral-500">Creator Artisan</p>
                                            </div>
                                            {product.creator.verified && (
                                                <span className="px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded-full border border-[#D4AF37]/30">
                                                    VERIFIED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-white/10" />

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                                <DollarSign className="w-4 h-4" />
                                                <span>Price</span>
                                            </div>
                                            <p className="text-xl font-bold text-[#D4AF37]">
                                                {formatPrice(product.price_cents, product.currency)}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                <span>Submitted</span>
                                            </div>
                                            <p className="text-sm font-medium text-neutral-200">
                                                {formatDate(product.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Comment Section */}
                                    <div className="flex-1 space-y-2">
                                        <label className="block text-sm font-semibold text-neutral-300">
                                            Review Comment {action === 'reject' && <span className="text-red-400">*</span>}
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder={action === 'reject' ? 'Please provide a reason for rejection...' : 'Optional feedback for the creator...'}
                                            className="w-full h-32 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4">
                                        <LuxuryButton
                                            variant="gold"
                                            icon={<CheckCircle className="w-5 h-5" />}
                                            onClick={handleApprove}
                                            isLoading={isLoading && action === 'approve'}
                                            disabled={isLoading}
                                            className="flex-1"
                                        >
                                            Approve
                                        </LuxuryButton>

                                        <LuxuryButton
                                            variant="destructive"
                                            icon={<XCircle className="w-5 h-5" />}
                                            onClick={handleReject}
                                            isLoading={isLoading && action === 'reject'}
                                            disabled={isLoading}
                                            className="flex-1"
                                        >
                                            Reject
                                        </LuxuryButton>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
