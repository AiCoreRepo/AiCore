import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

/**
 * EmptyState - Displayed when there are no pending products
 * Shows elegant "All Caught Up" message with gold checkmark
 */
export const EmptyState: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20 px-4"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6"
            >
                <CheckCircle2 className="w-12 h-12 text-[#D4AF37]" />
            </motion.div>

            <h2 className="text-3xl font-bold text-neutral-100 mb-3 font-serif">
                All Caught Up
            </h2>

            <p className="text-neutral-400 text-center max-w-md">
                The Atelier is quiet today. No products are awaiting your review.
            </p>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 text-sm text-neutral-500"
            >
                New submissions will appear here automatically
            </motion.div>
        </motion.div>
    );
};
