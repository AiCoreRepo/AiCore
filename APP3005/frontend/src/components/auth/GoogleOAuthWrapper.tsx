import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthWrapperProps {
    children: ReactNode;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const RESOLVED_CLIENT_ID =
    GOOGLE_CLIENT_ID.trim().length > 0
        ? GOOGLE_CLIENT_ID
        : 'MISSING_GOOGLE_CLIENT_ID';

export const GoogleOAuthWrapper = ({ children }: GoogleOAuthWrapperProps) => {
    if (!GOOGLE_CLIENT_ID) {
        console.warn('Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID to enable Google login.');
    }

    return (
        <GoogleOAuthProvider clientId={RESOLVED_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default GoogleOAuthWrapper;
