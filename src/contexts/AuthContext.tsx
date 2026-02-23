'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authApi, clearTokens, setTokens, getUserType, getToken } from '@/lib/api';
import { User, UserType } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  login: (username: string, password: string, userType: UserType) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'instacrew_user';

function loadUserFromCookie(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = Cookies.get(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from cookie only on client (avoids SSR/client hydration mismatch)
  useEffect(() => {
    const stored = loadUserFromCookie();
    if (stored) setUserState(stored);
    setIsLoading(false);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      Cookies.set(USER_KEY, JSON.stringify(u), { expires: 30, secure: isSecure, sameSite: 'lax' });
    } else {
      Cookies.remove(USER_KEY);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string, userType: UserType) => {
      const response = await authApi.login({ username, password, user_type: userType });
      const data = response.data;
      setTokens(data.access_token, data.refresh_token, data.user_type, data.expires_in);
      const userData: User = {
        user_id: data.user_id,
        user_type: data.user_type,
        username: data.username,
        email: data.email,
        signup_completed: data.signup_completed,
      };
      setUser(userData);
    },
    [setUser]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  }, [setUser]);

  const userType = user?.user_type || getUserType() || null;
  const isAuthenticated = !!user || !!getToken();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        userType,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
