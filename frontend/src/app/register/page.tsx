'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ApiError } from '@/services/api';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

function getSafeRedirectUrl(target: string | null, userRole?: string): string {
  if (!target) return '/';
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\') || target.includes(':')) {
    return '/';
  }
  if (target.startsWith('/admin') && userRole !== 'ADMIN') {
    return '/';
  }
  return target;
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Username validation (matches backend: min 3, max 50)
    if (!cleanUsername) {
      errors.username = 'اسم المستخدم مطلوب';
    } else if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      errors.username = 'يجب أن يكون اسم المستخدم بين 3 و 50 حرفاً';
    } else if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(cleanUsername)) {
      errors.username = 'اسم المستخدم يجب ألا يحتوي على مسافات أو رموز خاصة';
    }

    // Email validation
    if (!cleanEmail) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    // Password validation (matches backend: min 8 characters)
    if (!password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 8) {
      errors.password = 'كلمة المرور يجب ألا تقل عن 8 أحرف';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'يرجى تأكيد كلمة المرور';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const safeUrl = getSafeRedirectUrl(redirectParam, response.role);
      router.push(safeUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.validationErrors) {
          setFieldErrors(err.validationErrors);
        }

        const msg = err.message || '';
        if (msg.includes('Email is already registered')) {
          setFieldErrors((prev) => ({ ...prev, email: 'هذا البريد الإلكتروني مسجل بالفعل' }));
          setErrorMessage('البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول أو استخدام بريد آخر.');
        } else if (msg.includes('Username is already taken')) {
          setFieldErrors((prev) => ({ ...prev, username: 'اسم المستخدم مأخوذ بالفعل' }));
          setErrorMessage('اسم المستخدم مستخدم مسبقاً، يرجى اختيار اسم مستخدم آخر.');
        } else if (err.status === 429) {
          setErrorMessage('تم تجاوز الحد المسموح به من المحاولات. يرجى الانتظار دقيقة.');
        } else {
          setErrorMessage(msg || 'تعذر إنشاء الحساب، يرجى التأكد من البيانات المدخلة.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بالسيرفر');
      } else {
        setErrorMessage('تعذر إنشاء الحساب. يرجى التحقق من اتصالك بالإنترنت');
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
            إنشاء حساب عميل جديد
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            انضم إلى مجتمع VARELLION للاستمتاع بتجربة تسوق راقية ومتابعة فورية لطلباتك.
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

            {/* Username Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-username"
                className="text-xs font-bold text-foreground block"
              >
                اسم المستخدم <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => ({ ...prev, username: '' }));
                    }
                  }}
                  placeholder="مثال: ahmed_fawzy"
                  className={`pr-10 text-xs h-11 rounded-lg ${
                    fieldErrors.username ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                  aria-invalid={!!fieldErrors.username}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                />
                <User
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
              </div>
              {fieldErrors.username && (
                <p id="username-error" className="text-[11px] text-rose-600 font-semibold">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="text-xs font-bold text-foreground block"
              >
                البريد الإلكتروني <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="name@example.com"
                  className={`pr-10 text-xs h-11 rounded-lg ${
                    fieldErrors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                <Mail
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-[11px] text-rose-600 font-semibold">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="text-xs font-bold text-foreground block"
              >
                كلمة المرور (8 أحرف كحد أدنى) <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`pr-10 pl-11 text-xs h-11 rounded-lg ${
                    fieldErrors.password ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
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
              {fieldErrors.password && (
                <p id="password-error" className="text-[11px] text-rose-600 font-semibold">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-confirm-password"
                className="text-xs font-bold text-foreground block"
              >
                تأكيد كلمة المرور <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`pr-10 pl-11 text-xs h-11 rounded-lg ${
                    fieldErrors.confirmPassword ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                <Lock
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-[11px] text-rose-600 font-semibold">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="luxury"
              size="lg"
              disabled={isSubmitting}
              className="w-full gap-2 font-bold min-h-[48px] text-sm mt-3 shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جارٍ إنشاء الحساب وتأكيد التسجيل...</span>
                </>
              ) : (
                <span>إنشاء الحساب</span>
              )}
            </Button>

            {/* Divider: OR REGISTER WITH */}
            <div className="relative my-4" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card text-muted-foreground px-3 font-medium">أو التسجيل السريع عبر</span>
              </div>
            </div>

            {/* Google Sign-In Integration */}
            <GoogleSignInButton
              safeRedirectUrl={getSafeRedirectUrl(redirectParam)}
              onError={(msg) => setErrorMessage(msg)}
              text="signup"
            />
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 text-center border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <Link
              href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
              className="font-bold text-[#C5A059] hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              تسجيل الدخول
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>بياناتك الشخصية مشفرة ومحمية وفق سياسة خصوصية صارمة</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-xs text-muted-foreground mt-3">جارٍ تحميل صفحة إنشاء الحساب...</p>
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
