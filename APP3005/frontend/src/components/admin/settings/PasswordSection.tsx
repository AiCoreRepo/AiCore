import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

/**
 * PasswordSection - Password change form with validation
 */
export const PasswordSection: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;
        return strength;
    };

    const strength = getPasswordStrength(newPassword);
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSuccess(true);
        setIsLoading(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-neutral-100 mb-2">Change Password</h3>
                <p className="text-sm text-neutral-400">
                    Update your password to keep your account secure
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Current Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            placeholder="Enter current password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                        >
                            {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            placeholder="Enter new password"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                        >
                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                        <div className="mt-2 space-y-2">
                            <div className="flex gap-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : 'bg-neutral-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-neutral-400">
                                Strength: <span className={`font-medium ${strength >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {strengthLabels[strength - 1] || 'Too Weak'}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            placeholder="Confirm new password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                        >
                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                    )}
                </div>

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Password changed successfully!</span>
                    </motion.div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || newPassword !== confirmPassword || !currentPassword}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-neutral-950 rounded-xl font-bold hover:from-[#F4D03F] hover:to-[#D4AF37] transition-all shadow-lg shadow-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
};
