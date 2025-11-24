import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getProfile as fetchProfile } from '../lib/api';

interface User {
  user_id: string;
  email: string;
  role: string;
  store_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const userData = await fetchProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, fetchUser }}>
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