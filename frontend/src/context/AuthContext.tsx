'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Silent Session Hydration on Initial Mount:
   * Calls /api/auth/refresh with credentials: 'include'.
   * If an active HttpOnly refresh_token cookie exists, backend returns a fresh access token.
   * If cookie is absent/expired, silently falls back to unauthenticated guest mode.
   * STRICT SECURITY: Refresh token from JSON is completely ignored; localStorage is NEVER used.
   */
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const res = await authService.refreshToken();
        if (isMounted && res.accessToken) {
          setAccessToken(res.accessToken);
          setUser({
            email: res.email,
            username: res.username,
            role: res.role || 'USER',
          });
        }
      } catch {
        // Expected for guest visitors without active session
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login handler:
   * Sets in-memory user and accessToken.
   * Ignores response.refreshToken (relying solely on the HttpOnly cookie set by backend).
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    const res = await authService.login(credentials);
    setAccessToken(res.accessToken);
    setUser({
      email: res.email,
      username: res.username,
      role: res.role || 'USER',
    });
    return res;
  }, []);

  /**
   * Register handler:
   * Backend automatically authenticates upon registration and issues tokens + HttpOnly cookie.
   * Sets in-memory user and accessToken.
   */
  const register = useCallback(async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await authService.register(data);
    setAccessToken(res.accessToken);
    setUser({
      email: res.email,
      username: res.username,
      role: res.role || 'USER',
    });
    return res;
  }, []);

  /**
   * Google OAuth Login handler:
   * Passes verified Google ID Token to backend (/api/auth/google)
   * Sets in-memory user and accessToken.
   * Ignores response.refreshToken (relying solely on the HttpOnly cookie set by backend).
   */
  const loginWithGoogle = useCallback(async (idToken: string): Promise<AuthResponse> => {
    const res = await authService.googleLogin(idToken);
    setAccessToken(res.accessToken);
    setUser({
      email: res.email,
      username: res.username,
      role: res.role || 'USER',
    });
    return res;
  }, []);

  /**
   * Logout handler:
   * Informs backend to clear the HttpOnly cookie and clears in-memory state.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[AuthContext] Backend logout failed or unreachable:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, accessToken, isLoading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
