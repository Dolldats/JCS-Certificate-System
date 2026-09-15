'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Auxiliary } from '../types';
import { authApi } from '../services/api';
import { INITIAL_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  activeAuxiliary: Auxiliary | 'All';
  setActiveAuxiliary: (aux: Auxiliary | 'All') => void;
  switchUser: (userId: string) => Promise<void>;
  availableUsers: User[];
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeAuxiliary, setActiveAuxiliary] = useState<Auxiliary | 'All'>('All');
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const currentUser = await authApi.getCurrentUser();
        const allUsers = await authApi.getAllUsers();
        setUser(currentUser);
        setAvailableUsers(allUsers);
        if (currentUser.role === 'GENERAL_ADMIN' && currentUser.assignedAuxiliary) {
          setActiveAuxiliary(currentUser.assignedAuxiliary);
        } else {
          setActiveAuxiliary('All');
        }
      } catch (err) {
        console.error('Failed to load user session', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const newUser = await authApi.switchUser(userId);
      setUser(newUser);
      if (newUser.role === 'GENERAL_ADMIN' && newUser.assignedAuxiliary) {
        setActiveAuxiliary(newUser.assignedAuxiliary);
      } else {
        setActiveAuxiliary('All');
      }
      const allUsers = await authApi.getAllUsers();
      setAvailableUsers(allUsers);
    } catch (err) {
      console.error('Failed to switch user', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeAuxiliary,
        setActiveAuxiliary,
        switchUser: handleSwitchUser,
        availableUsers,
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
