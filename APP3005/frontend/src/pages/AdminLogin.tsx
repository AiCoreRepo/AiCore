import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { getErrorMessage } from '@/lib/error-utils';
import { googleAuth } from '@/lib/api';

const AdminLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                // We use the same googleAuth API as users, but with role: 'ADMIN'
                const result = await googleAuth({
                    token: tokenResponse.access_token,
                    role: 'ADMIN',
                });

                toast({
                    title: "Identity Verified",
                    description: "Please confirm your admin secret to proceed.",
                });

                // Redirect to secret confirmation page
                navigate(`/admin-secret-confirm?email=${encodeURIComponent(result.user.email)}`);

            } catch (error: unknown) {
                toast({
                    title: "Authentication Failed",
                    description: getErrorMessage(error, "You do not have administrative access."),
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            toast({
                title: "Google Sign-In Failed",
                description: "Could not connect to Google. Please try again.",
                variant: "destructive",
            });
        },
        flow: 'implicit',
    });

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
                            onClick={() => handleGoogleLogin()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="text-sm">Sign in as Administrator</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-neutral-600 text-[10px] uppercase tracking-widest pt-4">
                        AiVestire Administrative Network
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

