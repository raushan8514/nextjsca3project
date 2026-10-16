import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Subscription } from '../types';
import { api, getStoredToken, setStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setSubscription(data.subscription);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      setStoredToken(null);
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setStoredToken(res.token);
    await refreshUser();
    setIsAuthModalOpen(false);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register({ name, email, password: pass });
    setStoredToken(res.token);
    await refreshUser();
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setSubscription(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isLoading,
        isAdmin,
        isAuthModalOpen,
        authModalMode,
        login,
        register,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
