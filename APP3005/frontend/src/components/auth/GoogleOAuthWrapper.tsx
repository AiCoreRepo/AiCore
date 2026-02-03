import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthWrapperProps {
    children: ReactNode;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const GoogleOAuthWrapper = ({ children }: GoogleOAuthWrapperProps) => {
    if (!GOOGLE_CLIENT_ID) {
        // If no client ID is configured, just render children without wrapper
        console.warn('Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID in .env');
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default GoogleOAuthWrapper;
