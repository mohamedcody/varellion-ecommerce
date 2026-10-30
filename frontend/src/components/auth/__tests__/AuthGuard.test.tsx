import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthGuard } from '../AuthGuard';
import * as AuthContextModule from '@/context/AuthContext';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/profile',
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when authenticated and loaded', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'ahmed', email: 'ahmed@test.com', role: 'USER' },
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );
    expect(screen.getByText('Protected Content')).toBeDefined();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders loading skeleton and does not redirect while loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      accessToken: null,
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
    expect(screen.getByTestId('auth-guard-skeleton')).toBeDefined();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to /login?redirect=/profile when not authenticated and not loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fprofile');
  });
});
