import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/error-utils';

const AdminLogin = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const autoLogin = async () => {
            const email = searchParams.get('email') || 'admin@aivestire.com';
            const password = searchParams.get('password') || 'Admin@123456';

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    const error = new Error('Admin login failed') as ApiError;
                    error.status = response.status;
                    throw error;
                }

                const data = await response.json();

                // Store token
                localStorage.setItem('access_token', data.access_token);

                // Success toast
                toast({
                    title: "Welcome Admin",
                    description: "You've successfully signed in.",
                });

                // Redirect to admin dashboard
                setTimeout(() => {
                    navigate('/admin-dashboard');
                }, 500);

            } catch (error: unknown) {
                console.error('Auto-login failed:', error);

                toast({
                    title: "Admin Login Failed",
                    description: getErrorMessage(error, "Please check your admin credentials."),
                    variant: "destructive",
                });

                navigate('/');
            }
        };

        autoLogin();
    }, [searchParams, navigate, toast]);

    return (
        <div className="min-h-screen bg-luxury-black flex items-center justify-center p-6">
            <div className="text-center space-y-8 max-w-sm w-full">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-luxury-gold/20 blur-2xl rounded-full" />
                    <Loader2 className="w-16 h-16 text-luxury-gold animate-spin relative z-10 mx-auto" strokeWidth={1} />
                </div>

                <div className="space-y-3 relative z-10">
                    <h2 className="text-3xl font-serif text-luxury-cream tracking-tight">
                        Securing Access
                    </h2>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-[1px] w-12 bg-luxury-gold/50" />
                        <p className="text-neutral-500 text-xs uppercase tracking-[0.3em] font-medium">
                            Administrative Protocol
                        </p>
                    </div>
                </div>

                <div className="pt-8">
                    <p className="text-neutral-600 text-[10px] uppercase tracking-widest animate-pulse">
                        Authenticating credentials...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
