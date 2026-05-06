'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { getCurrentUser, loginWithGoogle, logout as apiLogout } from '../api/auth-api';
import { setCurrentUserId } from '@/features/library/lib/indexed-db';
import type { AuthUser, AuthStatus, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const checkingRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setStatus('loading');
    try {
      const u = await getCurrentUser();
      setUser(u as AuthUser);
      setCurrentUserId(u.id);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleAuthStateChanged = () => {
      checkAuth();
    };

    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, [checkAuth]);

  const login = useCallback(async (credential: string) => {
    await loginWithGoogle(credential);
    await checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
