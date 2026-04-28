// ============================================
// ADMIN WALLET CREDIT
// ============================================

import { useState } from 'react';
import { adminCreditWalletApi } from '@/api/wallet.api';
import { Loader2 } from 'lucide-react';

export const AdminWalletCredit = () => {
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        const amountNum = parseFloat(amount);
        if (!userId.trim() || isNaN(amountNum) || amountNum <= 0) {
            setResult({ success: false, message: 'Valid User ID and amount are required' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await adminCreditWalletApi({
                userId: userId.trim(),
                amount: amountNum,
                description: description.trim() || undefined,
            });
            setResult({ success: true, message: res.message });
            // Reset form on success
            setUserId('');
            setAmount('');
            setDescription('');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to credit wallet';
            setResult({ success: false, message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
            <h2 className="text-white text-lg font-semibold mb-5">Credit User Wallet</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* User ID */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-1.5">User ID</label>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter user UUID"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                        required
                    />
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-1.5">Amount (₹)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="0.01"
                        step="0.01"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-1.5">
                        Description <span className="text-neutral-600">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Reason for credit"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D4AF37] hover:bg-[#c9a430] text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Crediting...' : 'Credit Wallet'}
                </button>

                {/* Result message */}
                {result && (
                    <div
                        className={`text-sm text-center py-2 rounded-lg ${result.success
                                ? 'text-emerald-400 bg-emerald-400/10'
                                : 'text-red-400 bg-red-400/10'
                            }`}
                    >
                        {result.message}
                    </div>
                )}
            </form>
        </div>
    );
};
