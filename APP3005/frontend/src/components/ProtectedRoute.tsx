import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole: 'CREATOR' | 'ADMIN' | 'BUYER';
    redirectTo?: string;
}

export const ProtectedRoute = ({ children, requiredRole, redirectTo = '/' }: ProtectedRouteProps) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('access_token');

            if (!token) {
                setIsAuthorized(false);
                return;
            }

            try {
                // Decode JWT to get user role
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userRole = payload.role;

                setIsAuthorized(userRole === requiredRole);
            } catch (error) {
                console.error('Error decoding token:', error);
                setIsAuthorized(false);
            }
        };

        checkAuth();
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
