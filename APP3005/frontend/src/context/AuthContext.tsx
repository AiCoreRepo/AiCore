import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getProfile as fetchProfile } from '../lib/api';

interface User {
  user_id: string;
  email: string;
  role: string;
  store_name?: string;
  avatar?: string;
  subtitle?: string;
  try_ons_used?: number;
  max_try_ons?: number;
  try_on_permission?: string;
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

  const fetchUser = async () => {
    console.log('🔄 fetchUser called');
    setLoading(true);
    try {
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
      setUser(null);
      console.log('👤 User state set to: null');
    } finally {
      setLoading(false);
      console.log('⏸️ Loading set to: false');
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user...');
    localStorage.removeItem('access_token');
    setUser(null);
    console.log('✅ User logged out successfully');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 Checking auth token:', token ? '✅ Token exists' : '❌ No token');
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }

    // Listen for storage changes (login/logout from other tabs or same tab)
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

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-refresh', handleAuthRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-refresh', handleAuthRefresh);
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