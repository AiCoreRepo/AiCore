import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminSecretConfirm: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const email = searchParams.get('email') || '';

    const [secret, setSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!secret.trim()) {
            toast({
                title: 'Secret required',
                description: 'Please enter the admin secret.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/admin/verify-secret`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, secret }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Verification failed');
            }

            const data = await response.json();

            toast({
                title: 'Access Granted',
                description: 'Welcome, Admin.',
            });

            setTimeout(() => {
                navigate(data.redirect || '/admin-dashboard');
            }, 400);
        } catch (error: unknown) {
            console.error('Secret verification failed:', error);
            toast({
                title: 'Verification Failed',
                description: error instanceof Error ? error.message : 'Invalid secret. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <ShieldCheck className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-serif text-neutral-100">Access Denied</h2>
                    <p className="text-neutral-400">No email provided. Please authenticate via Google first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                            <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-xl" />
                            <div className="relative bg-neutral-800/80 rounded-full p-4 border border-[#D4AF37]/30">
                                <Lock className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <h1
                            className="text-3xl font-bold text-neutral-100 tracking-tight mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Admin Verification
                        </h1>
                        <div className="h-[1px] w-16 bg-[#D4AF37]/50 mx-auto my-3" />
                        <p className="text-neutral-400 text-sm">
                            Authenticated as{' '}
                            <span className="text-[#D4AF37] font-medium">{email}</span>
                        </p>
                        <p className="text-neutral-500 text-xs mt-1 uppercase tracking-widest">
                            Enter your admin secret to proceed
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="admin-secret"
                                className="block text-xs text-neutral-400 uppercase tracking-wider mb-2 font-medium"
                            >
                                Admin Secret
                            </label>
                            <div className="relative">
                                <input
                                    id="admin-secret"
                                    type={showSecret ? "text" : "password"}
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Enter your secret"
                                    className="w-full pl-4 pr-12 py-3 bg-neutral-900 border border-neutral-700/50 rounded-lg
                                             !text-white placeholder-neutral-500
                                             focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/50
                                             transition-all duration-200"
                                    autoFocus
                                    autoComplete="off"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                                >
                                    {showSecret ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !secret.trim()}
                            className="w-full py-3 px-6 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-neutral-950
                                     font-semibold rounded-lg
                                     hover:from-[#E5C04B] hover:to-[#C9A73A]
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all duration-200
                                     flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5" />
                                    Confirm Access
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-neutral-600 text-[10px] uppercase tracking-widest mt-6">
                    AiVestire Administrative Protocol
                </p>
            </div>
        </div>
    );
};

export default AdminSecretConfirm;
