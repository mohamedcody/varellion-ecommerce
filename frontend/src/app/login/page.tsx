'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/services/api';

/**
 * Validates the redirect target to prevent Open Redirect attacks
 * Prevents non-admin customer accounts from redirecting to /admin
 */
function getSafeRedirectUrl(target: string | null, userRole?: string): string {
  if (!target) return '/';

  // Prevent protocol-relative and external redirects
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\') || target.includes(':')) {
    return '/';
  }

  // Prevent regular customer accounts from landing in /admin
  if (target.startsWith('/admin') && userRole !== 'ADMIN') {
    return '/';
  }

  return target;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      return;
    }

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login({
        identifier: cleanIdentifier,
        password,
      });

      const safeUrl = getSafeRedirectUrl(redirectParam, response.role);
      router.push(safeUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else if (err.status === 423) {
          setErrorMessage('تم قفل الحساب مؤقتاً لمدة 15 دقيقة بسبب تكرار المحاولات الخاطئة.');
        } else if (err.status === 429) {
          setErrorMessage('تم تجاوز الحد المسموح به من المحاولات. يرجى الانتظار لمدة دقيقة.');
        } else {
          setErrorMessage(err.message || 'تعذر تسجيل الدخول، يرجى المحاولة لاحقاً');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بالسيرفر');
      } else {
        setErrorMessage('تعذر تسجيل الدخول. يرجى التحقق من اتصالك بالإنترنت');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border-border/80 shadow-lg bg-card">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="inline-flex items-center justify-center mx-auto mb-1">
            <span className="text-2xl font-black tracking-widest text-[#C5A059] uppercase font-serif">
              VARELLION
            </span>
          </div>
          <CardTitle className="text-2xl font-black text-foreground">
            تسجيل دخول العميل
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            أهلاً بك مجدداً في حسابك. سجّل دخولك لمتابعة طلباتك وتأكيد مشترياتك.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Global Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Identifier Field (Email or Username) */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-identifier"
                className="text-xs font-bold text-foreground block"
              >
                اسم المستخدم أو البريد الإلكتروني <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="login-identifier"
                  type="text"
                  name="identifier"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com أو اسم المستخدم"
                  className="pr-10 text-xs h-11 rounded-lg"
                  aria-required="true"
                />
                <User
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-foreground block"
                >
                  كلمة المرور <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 pl-11 text-xs h-11 rounded-lg"
                  aria-required="true"
                />
                <Lock
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="luxury"
              size="lg"
              disabled={isSubmitting}
              className="w-full gap-2 font-bold min-h-[48px] text-sm mt-2 shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جارٍ تسجيل الدخول...</span>
                </>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 text-center border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            ليس لديك حساب بعد؟{' '}
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
              className="font-bold text-[#C5A059] hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              إنشاء حساب جديد
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>بياناتك ومعلوماتك محمية بتشفير 256-bit آمن</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-xs text-muted-foreground mt-3">جارٍ تحميل صفحة تسجيل الدخول...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
