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
                console.log('No token found, redirecting to login');
                setIsAuthorized(false);
                return;
            }

            try {
                // Decode JWT to get user role and expiration
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userRole = payload.role;
                const exp = payload.exp;

                // Check if token is expired
                const currentTime = Math.floor(Date.now() / 1000);
                if (exp && exp < currentTime) {
                    console.log('Token expired, clearing and redirecting');
                    localStorage.removeItem('access_token');
                    setIsAuthorized(false);
                    return;
                }

                // Check if user has required role
                const hasRequiredRole = userRole === requiredRole;

                if (!hasRequiredRole) {
                    console.log(`User role ${userRole} does not match required role ${requiredRole}`);
                }

                setIsAuthorized(hasRequiredRole);
            } catch (error) {
                console.error('Error decoding token:', error);
                // Don't clear token on decode error, might be a temporary issue
                // Only clear if it's clearly invalid
                try {
                    // Try to parse again to confirm it's invalid
                    JSON.parse(atob(token.split('.')[1]));
                } catch {
                    // Token is definitely invalid, clear it
                    localStorage.removeItem('access_token');
                }
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
