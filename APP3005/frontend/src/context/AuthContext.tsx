import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getProfile as fetchProfile } from '../lib/api';
import { clearStoredAuthTokens, getStoredAccessToken } from '../lib/auth-token';

interface User {
  user_id: string;
  email: string;
  role: string;
  store_name?: string;
  avatar?: string;
  subtitle?: string;
  paymentDetails?: {
    gateway: string;
    method: string;
    beneficiaryName: string;
    upiId: string;
    updatedAt?: string;
  } | null;
  try_ons_used?: number;
  max_try_ons?: number;
  try_on_permission?: string;
  age_range?: string;
  dob?: string;
  needs_dob_collection?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = (shouldRedirect: boolean) => {
    console.log('🚪 Logging out user...');
    clearStoredAuthTokens();
    setUser(null);
    console.log('✅ User logged out successfully');

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const logout = () => {
    clearSession(true);
  };

  const fetchUser = async () => {
    console.log('🔄 fetchUser called');
    setLoading(true);
    try {
      const token = getStoredAccessToken() || localStorage.getItem('access_token');
      if (!token) {
        console.log('❌ No token found, skipping fetch');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('📡 Fetching user profile from /auth/me...');
      const userData = await fetchProfile();
      console.log('📦 Received user data:', userData);

      // Map backend 'name' to 'store_name' if needed
      const mappedUser = {
        ...userData,
        store_name: userData.name || userData.store_name
      };
      setUser(mappedUser);
      console.log('✅ User authenticated:', userData.email, '| Role:', userData.role);
      console.log('👤 User state set to:', mappedUser);
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      console.error('🔍 Error details:', (error as Error).message);

      // Check if it's an authentication error (401)
      const apiError = error as { status?: number };
      if (apiError.status === 401) {
        console.log('🔒 Token expired or invalid, clearing session...');
        clearSession(false);
      } else {
        console.log('⚠️ Non-auth profile fetch failed, preserving current user state');
      }
    } finally {
      setLoading(false);
      console.log('⏸️ Loading set to: false');
    }
  };

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 Checking auth token:', token ? '✅ Token exists' : '❌ No token');

    if (token) {
      // Validate the token by fetching user profile
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        console.log('🔄 Token changed in storage');
        const newToken = e.newValue;
        if (newToken) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
    };

    // Listen for custom auth-refresh event (for same-tab login)
    const handleAuthRefresh = () => {
      console.log('🔄 Auth refresh event triggered');
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        fetchUser();
      } else {
        setUser(null);
      }
    };

    // Listen for custom auth-error event (for 401 errors from API calls)
    const handleAuthError = () => {
      console.log('🔒 Auth error event triggered - revalidating session');
      void fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-refresh', handleAuthRefresh);
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-refresh', handleAuthRefresh);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
