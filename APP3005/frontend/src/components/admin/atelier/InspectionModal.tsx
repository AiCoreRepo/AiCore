import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, ChevronLeft, ChevronRight, BadgeCheck, Clock, Package } from 'lucide-react';
import { PendingProduct, useProductAction } from '@/hooks/useApprovals';
import confetti from 'canvas-confetti';

interface InspectionModalProps {
    product: PendingProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * InspectionModal - Detailed product review modal
 * Split view: 50% images / 50% details
 * Includes approve/reject actions with confetti animation
 */
export const InspectionModal: React.FC<InspectionModalProps> = ({ product, isOpen, onClose }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const productAction = useProductAction();

    if (!product) return null;

    // For now, use thumbnail as single image (can be extended for multiple images)
    const images = product.thumbnail ? [product.thumbnail] : [];

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

    const handleApprove = async () => {
        try {
            await productAction.mutateAsync({
                productId: product.product_id,
                action: 'APPROVED',
            });

            // Trigger confetti animation
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#F4D03F', '#FFD700'],
            });

            // Close modal after short delay
            setTimeout(() => {
                onClose();
                setIsRejecting(false);
                setRejectionReason('');
            }, 1000);
        } catch (error) {
            console.error('Failed to approve product:', error);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await productAction.mutateAsync({
                productId: product.product_id,
                action: 'REJECTED',
                comment: rejectionReason,
            });

            // Close modal
            onClose();
            setIsRejecting(false);
            setRejectionReason('');
        } catch (error) {
            console.error('Failed to reject product:', error);
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 md:inset-8 lg:inset-16 bg-neutral-950 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-black/70 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left Side - Images (50%) */}
                            <div className="lg:w-1/2 bg-neutral-900 relative flex items-center justify-center p-8">
                                {images.length > 0 ? (
                                    <>
                                        <img
                                            src={images[currentImageIndex]}
                                            alt={product.title}
                                            className="max-w-full max-h-full object-contain rounded-xl"
                                        />

                                        {/* Image Navigation */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>

                                                {/* Image Indicators */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                    {images.map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                                                                ? 'bg-[#D4AF37] w-6'
                                                                : 'bg-white/30'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-neutral-500">
                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-[#D4AF37]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p>No Image Available</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Side - Details (50%) */}
                            <div className="lg:w-1/2 flex flex-col overflow-hidden">
                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    {/* Header */}
                                    <div>
                                        <h1 className="text-3xl font-bold text-neutral-100 mb-2 font-serif">
                                            {product.title}
                                        </h1>
                                        <p className="text-4xl font-bold text-[#D4AF37]">
                                            {formatPrice(product.price_cents, product.currency)}
                                        </p>
                                    </div>

                                    {/* Creator Info */}
                                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-neutral-950 font-bold text-lg">
                                            {product.creator.store_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-neutral-400">Designed by</p>
                                            <p className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                                                {product.creator.store_name}
                                                {product.creator.verified && (
                                                    <BadgeCheck className="w-5 h-5 text-[#D4AF37]" />
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {product.description && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                                                Description
                                            </h3>
                                            <p className="text-neutral-300 leading-relaxed">
                                                {product.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-2 text-neutral-400 mb-1">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs uppercase tracking-wider">Uploaded</span>
                                            </div>
                                            <p className="text-sm text-neutral-200 font-medium">
                                                {formatDate(product.created_at)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-2 text-neutral-400 mb-1">
                                                <Package className="w-4 h-4" />
                                                <span className="text-xs uppercase tracking-wider">Category</span>
                                            </div>
                                            <p className="text-sm text-neutral-200 font-medium">
                                                {product.category || 'Uncategorized'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rejection Reason Input */}
                                    {isRejecting && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <label className="block text-sm font-semibold text-neutral-300">
                                                Why is this being rejected? <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Provide a clear reason for the creator..."
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                                                rows={4}
                                                autoFocus
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Sticky Footer - Actions */}
                                <div className="p-6 bg-black/40 border-t border-white/10">
                                    {!isRejecting ? (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setIsRejecting(true)}
                                                disabled={productAction.isPending}
                                                className="flex-1 px-6 py-4 bg-transparent border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                disabled={productAction.isPending}
                                                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-neutral-950 rounded-xl font-bold hover:from-[#F4D03F] hover:to-[#D4AF37] transition-all shadow-lg shadow-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-5 h-5" />
                                                Approve for Collection
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    setIsRejecting(false);
                                                    setRejectionReason('');
                                                }}
                                                disabled={productAction.isPending}
                                                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-neutral-300 rounded-xl font-semibold hover:bg-white/10 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                disabled={productAction.isPending || !rejectionReason.trim()}
                                                className="flex-1 px-6 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
