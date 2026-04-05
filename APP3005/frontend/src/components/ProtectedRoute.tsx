import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getValidAccessToken } from '@/lib/api';
import { clearStoredAuthTokens, getJwtRole } from '@/lib/auth-token';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole: 'CREATOR' | 'ADMIN' | 'BUYER';
    redirectTo?: string;
}

export const ProtectedRoute = ({ children, requiredRole, redirectTo = '/' }: ProtectedRouteProps) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;

        const checkAuth = async () => {
            const token = await getValidAccessToken();

            if (cancelled) {
                return;
            }

            if (!token) {
                console.log('No valid token found, redirecting to login');
                clearStoredAuthTokens();
                setIsAuthorized(false);
                return;
            }

            const userRole = getJwtRole(token);
            const hasRequiredRole = userRole === requiredRole;

            if (!hasRequiredRole) {
                console.log(`User role ${userRole} does not match required role ${requiredRole}`);
            }

            setIsAuthorized(hasRequiredRole);
        };

        void checkAuth();

        return () => {
            cancelled = true;
        };
    }, [requiredRole]);

    // Show loading state while checking
    if (isAuthorized === null) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
            </div>
        );
    }

    // Redirect if not authorized
    if (!isAuthorized) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
