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
        const initiateGoogleAuth = () => {
            window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google/admin`;
        };

        const timer = setTimeout(initiateGoogleAuth, 1000);
        return () => clearTimeout(timer);
    }, []);

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
