import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getProfile as fetchProfile } from '../lib/api';
import { getUserDisplayName, getUserProfileImageUrl } from '../lib/profile-image';

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

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    setUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await fetchProfile();

      // Map backend 'name' to 'store_name' if needed
      const mappedUser = {
        ...userData,
        store_name: userData.name || userData.store_name,
        avatar: getUserProfileImageUrl({
          ...userData,
          store_name: userData.name || userData.store_name,
        }) || undefined,
      };
      setUser(mappedUser);
      localStorage.setItem('user_email', mappedUser.email);
      localStorage.setItem('user_name', getUserDisplayName(mappedUser));
    } catch (error) {
      // Check if it's an authentication error (401)
      const apiError = error as { status?: number };
      if (apiError.status === 401) {
        logout();
      } else {
        setUser(null);
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
      }
    } finally {
      setLoading(false);
    }
  };

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      fetchUser();
    } else {
      setUser(null);
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
      setLoading(false);
    }

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        const newToken = e.newValue;
        if (newToken) {
          fetchUser();
        } else {
          setUser(null);
          localStorage.removeItem('user_name');
          localStorage.removeItem('user_email');
        }
      }
    };

    // Listen for custom auth-refresh event (for same-tab login)
    const handleAuthRefresh = () => {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        fetchUser();
      } else {
        setUser(null);
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
      }
    };

    // Listen for custom auth-error event (for 401 errors from API calls)
    const handleAuthError = () => {
      logout();
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
