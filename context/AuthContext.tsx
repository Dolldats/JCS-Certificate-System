'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Auxiliary } from '../types';
import { loginReal } from '../services/api';
import { getAuthToken } from '../services/backendClient';

interface AuthContextType {
  user: User | null;
  activeAuxiliary: Auxiliary | 'All';
  setActiveAuxiliary: (aux: Auxiliary | 'All') => void;
  login: (memberId: string, password: string) => Promise<void>;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeAuxiliary, setActiveAuxiliary] = useState<Auxiliary | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user from sessionStorage if a valid token exists.
  // Runs in an effect (not during render) so server prerender and first
  // client render match, avoiding a hydration mismatch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getAuthToken();
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('jcs_current_user') : null;
        if (token && stored) {
          const restored: User = JSON.parse(stored);
          if (cancelled) return;
          setUser(restored);
          if (restored.role === 'GENERAL_ADMIN' && restored.assignedAuxiliary) {
            setActiveAuxiliary(restored.assignedAuxiliary);
          } else {
            setActiveAuxiliary('All');
          }
        }
      } catch {
        // Ignore parse errors — user will need to log in again
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (memberId: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: backendUser } = await loginReal(memberId, password);
      setUser(backendUser);
      // Persist user profile so it survives a page refresh within the same session
      sessionStorage.setItem('jcs_current_user', JSON.stringify(backendUser));
      if (backendUser.role === 'GENERAL_ADMIN' && backendUser.assignedAuxiliary) {
        setActiveAuxiliary(backendUser.assignedAuxiliary);
      } else {
        setActiveAuxiliary('All');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('jcs_access_token');
      sessionStorage.removeItem('jcs_expires_at');
      sessionStorage.removeItem('jcs_current_user');
    } catch {}
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeAuxiliary,
        setActiveAuxiliary,
        login: handleLogin,
        isLoading,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
