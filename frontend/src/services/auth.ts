import { requestApi } from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';

/**
 * Customer Authentication Service Layer
 * Directly integrated with real Spring Boot backend (/api/auth)
 * Relies on HttpOnly cookie for refresh token, keeping tokens out of localStorage.
 */
export const authService = {
  /**
   * Authenticate customer with identifier (email or username) and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return await requestApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: credentials.identifier.trim(),
        password: credentials.password,
      }),
    });
  },

  /**
   * Register a new customer account
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return await requestApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });
  },

  /**
   * Authenticate customer via Google ID Token
   * POST /api/auth/google with { idToken }
   */
  async googleLogin(idToken: string): Promise<AuthResponse> {
    return await requestApi<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  /**
   * Refresh session using the HttpOnly refresh_token cookie
   * Sends empty body; browser attaches cookie automatically via credentials: 'include'
   */
  async refreshToken(): Promise<AuthResponse> {
    return await requestApi<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
  },

  /**
   * Logout customer and invalidate HttpOnly refresh token cookie on server
   */
  async logout(): Promise<{ message: string }> {
    return await requestApi<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },
};
