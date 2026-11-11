'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}

export function AuthGuard({ children, fallback, requiredRole }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
        router.push(redirectUrl);
      } else if (requiredRole === 'ADMIN' && user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, requiredRole, router, user?.role]);

  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div data-testid="auth-guard-skeleton" className="container mx-auto max-w-4xl px-4 py-12 space-y-8 animate-fade-in">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48 bg-muted/60" />
          <Skeleton className="h-5 w-72 bg-muted/40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl bg-card/60 border border-border/40" />
          <Skeleton className="h-64 rounded-2xl bg-card/60 border border-border/40" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requiredRole === 'ADMIN' && user?.role !== 'ADMIN')) {
    return null;
  }

  return <>{children}</>;
}
