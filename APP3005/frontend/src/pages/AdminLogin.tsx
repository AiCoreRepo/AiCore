import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [secret, setSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleOpenSecretModal = () => {
        // Admin Google auth is disabled by design.
        setIsSecretModalOpen(true);
    };

    const handleSecretSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast({
                title: 'Email required',
                description: 'Please enter admin email.',
                variant: 'destructive',
            });
            return;
        }

        if (!secret.trim()) {
            toast({
                title: 'Secret required',
                description: 'Please enter admin secret.',
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
                body: JSON.stringify({
                    email: email.trim(),
                    secret: secret.trim(),
                }),
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

            setIsSecretModalOpen(false);
            setSecret('');
            setShowSecret(false);

            setTimeout(() => {
                navigate(data.redirect || '/admin-dashboard');
            }, 300);
        } catch (error: unknown) {
            toast({
                title: 'Verification Failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Invalid admin credentials. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-10 shadow-2xl text-center space-y-8">
                    <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
                        <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative bg-neutral-800/80 rounded-full p-5 border border-[#D4AF37]/30">
                            <ShieldCheck className="w-12 h-12 text-[#D4AF37]" strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1
                            className="text-4xl font-bold text-neutral-100 tracking-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Admin Access
                        </h1>
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-[1px] w-16 bg-[#D4AF37]/50" />
                            <p className="text-neutral-500 text-xs uppercase tracking-[0.4em] font-medium">
                                Secure Protocol
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="button"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleOpenSecretModal}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying Secret...</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="h-5 w-5" />
                                    <span className="text-sm">Continue with Admin Secret</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-neutral-600 text-[10px] uppercase tracking-widest pt-4">
                        AiVestire Administrative Network
                    </p>
                </div>
            </div>

            <Dialog
                open={isSecretModalOpen}
                onOpenChange={(open) => {
                    setIsSecretModalOpen(open);
                    if (!open) {
                        setSecret('');
                        setShowSecret(false);
                    }
                }}
            >
                <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-neutral-100">
                            <Lock className="w-5 h-5 text-[#D4AF37]" />
                            Admin Secret Verification
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Google login for admin is disabled. Enter admin email and secret.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSecretSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-neutral-400 uppercase tracking-wider mb-2 font-medium">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@company.com"
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700/50 rounded-lg
                                         !text-white placeholder-neutral-500
                                         focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/50"
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-neutral-400 uppercase tracking-wider mb-2 font-medium">
                                Admin Secret
                            </label>
                            <div className="relative">
                                <input
                                    type={showSecret ? 'text' : 'password'}
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Enter your secret"
                                    className="w-full pl-4 pr-12 py-3 bg-neutral-950 border border-neutral-700/50 rounded-lg
                                             !text-white placeholder-neutral-500
                                             focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/50"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                                    disabled={isLoading}
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
                            disabled={isLoading || !email.trim() || !secret.trim()}
                            className="w-full py-3 px-6 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-neutral-950
                                     font-semibold rounded-lg hover:from-[#E5C04B] hover:to-[#C9A73A]
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all duration-200 flex items-center justify-center gap-2"
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
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminLogin;

