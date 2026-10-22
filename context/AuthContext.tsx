'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Auxiliary } from '../types';
import { loginReal, clearLocalRecords, authApi } from '../services/api';
import { getAuthToken } from '../services/backendClient';
import { useToast } from '../components/ui/Toast';

interface AuthContextType {
  user: User | null;
  activeAuxiliary: Auxiliary | 'All';
  setActiveAuxiliary: (aux: Auxiliary | 'All') => void;
  login: (memberId: string, password: string) => Promise<User>;
  isLoading: boolean;
  authTransition: 'signing-in' | 'signing-out' | null;
  completeAuthTransition: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeAuxiliary, setActiveAuxiliary] = useState<Auxiliary | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [authTransition, setAuthTransition] = useState<AuthContextType['authTransition']>(null);
  const completeAuthTransition = useCallback(() => setAuthTransition(null), []);

  // On mount, restore user from sessionStorage if a valid token exists.
  // Runs in an effect (not during render) so server prerender and first
  // client render match, avoiding a hydration mismatch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getAuthToken();
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('jcs_current_user') : null;
        // An expired session must not be restored — the token is dead, so
        // restoring the profile would leave the admin on a half-signed-in page.
        const expiresAtRaw =
          typeof window !== 'undefined' ? sessionStorage.getItem('jcs_expires_at') : null;
        const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;
        const isExpired = Number.isFinite(expiresAt) && expiresAt <= Date.now();
        if (token && stored && !isExpired) {
          const restored: User = JSON.parse(stored);
          if (cancelled) return;
          setUser(restored);
          if (restored.role === 'GENERAL_ADMIN' && restored.assignedAuxiliary) {
            setActiveAuxiliary(restored.assignedAuxiliary);
          } else {
            setActiveAuxiliary('All');
          }
          // The role in browser storage is only for rendering — ask the server
          // whether the session is still valid. If it is not, end the sign-in
          // instead of leaving a dead session on screen.
          const valid = await authApi.validateSession(restored.memberId);
          if (cancelled) return;
          if (!valid) {
            sessionStorage.removeItem('jcs_access_token');
            sessionStorage.removeItem('jcs_expires_at');
            sessionStorage.removeItem('jcs_current_user');
            clearLocalRecords();
            setUser(null);
            setActiveAuxiliary('All');
            try {
              window.history.replaceState(null, '', '/login');
            } catch {}
          }
        } else if (isExpired) {
          // Drop the dead session so the next load starts clean.
          sessionStorage.removeItem('jcs_access_token');
          sessionStorage.removeItem('jcs_expires_at');
          sessionStorage.removeItem('jcs_current_user');
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
    setAuthTransition('signing-in');
    setIsLoading(true);
    let succeeded = false;
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
      succeeded = true;
      toast.success('Logged in successfully!');
      return backendUser;
    } finally {
      setIsLoading(false);
      if (!succeeded) setAuthTransition(null);
    }
  };

  const handleLogout = () => {
    setAuthTransition('signing-out');
    toast.info('Logged out successfully!');
    try {
      sessionStorage.removeItem('jcs_access_token');
      sessionStorage.removeItem('jcs_expires_at');
      sessionStorage.removeItem('jcs_current_user');
      sessionStorage.removeItem('jcs_member_events');
    } catch {}
    // Remove the cached personal records (participants, certificates, audit
    // log, admins) so the next person on this device cannot read them in
    // DevTools. The server still holds everything and re-sends it on the next
    // sign-in; template designs are kept.
    clearLocalRecords();
    // Drop the in-memory session immediately.
    setUser(null);
    setActiveAuxiliary('All');
    // Stop the Back button from restoring a signed-in view.
    try {
      window.history.replaceState(null, '', '/login');
    } catch {}
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeAuxiliary,
        setActiveAuxiliary,
        login: handleLogin,
        isLoading,
        authTransition,
        completeAuthTransition,
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
