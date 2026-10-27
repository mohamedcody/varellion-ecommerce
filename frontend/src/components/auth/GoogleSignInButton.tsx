'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/services/api';

// Fallback client ID from client_secret / backend env if NEXT_PUBLIC_GOOGLE_CLIENT_ID is not explicitly in .env
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '1003559537454-c93rrfj1ka0pjabj10g02eado3c9r2jg.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  safeRedirectUrl?: string;
  onError?: (message: string) => void;
  text?: 'signin' | 'signup';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
  }
}

/**
 * Official Google Multi-color Brand SVG Icon
 */
export function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.37 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  safeRedirectUrl = '/',
  onError,
  text = 'signin',
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const googleContainerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);

  /**
   * Handle the ID Token returned by Google Identity Services
   */
  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      const idToken = response?.credential;
      if (!idToken) {
        const errorMsg = 'لم يتم استلام تصريح الدخول من Google';
        if (onError) onError(errorMsg);
        return;
      }

      setIsSubmitting(true);
      try {
        await loginWithGoogle(idToken);
        router.push(safeRedirectUrl);
      } catch (err) {
        let msg = 'فشل تسجيل الدخول عبر Google. يرجى المحاولة لاحقاً.';
        if (err instanceof ApiError) {
          if (err.status === 401) {
            msg = 'رمز الدخول غير صالح أو منتهي الصلاحية.';
          } else if (err.status === 429) {
            msg = 'تم تجاوز عدد المحاولات المسموح به. يرجى الانتظار دقيقة.';
          } else if (err.message) {
            msg = err.message;
          }
        } else if (err instanceof Error && err.message) {
          msg = err.message;
        }

        if (onError) onError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginWithGoogle, router, safeRedirectUrl, onError]
  );

  /**
   * Initialize Google Identity Services when script is ready
   */
  const initGsi = useCallback(() => {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setIsInitializing(false);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleContainerRef.current) {
        googleContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: text === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: '100%',
          locale: 'ar',
        });
        setButtonRendered(true);
      }
    } catch (e) {
      console.warn('[GoogleSignInButton] Failed to initialize Google Identity Services:', e);
    } finally {
      setIsInitializing(false);
    }
  }, [handleCredentialResponse, text]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true);
      initGsi();
    }
  }, [initGsi]);

  /**
   * Fallback trigger when user clicks the custom styled button
   */
  const handleFallbackClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      if (onError) onError('Google Client ID غير مهيأ في الإعدادات.');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt was suppressed by browser, user can click the official button directly
          const iframeBtn = googleContainerRef.current?.querySelector('div[role="button"]') as HTMLElement | null;
          if (iframeBtn) {
            iframeBtn.click();
          }
        }
      });
    } else {
      if (onError) onError('جارٍ تحميل خدمات Google، يرجى المحاولة بعد لحظات.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Load Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setIsScriptLoaded(true);
          initGsi();
        }}
        onError={() => {
          setIsInitializing(false);
          console.warn('[GoogleSignInButton] Google GSI script failed to load.');
        }}
      />

      {/* Primary container where Google renders its official secure iframe button */}
      <div
        ref={googleContainerRef}
        className={`w-full flex justify-center transition-all ${
          buttonRendered && !isSubmitting ? 'block min-h-[44px]' : 'hidden'
        }`}
        aria-label="تسجيل الدخول باستخدام حساب Google"
      />

      {/* Styled accessible fallback button during script load or while submitting */}
      {(!buttonRendered || isSubmitting) && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting || !GOOGLE_CLIENT_ID}
          onClick={handleFallbackClick}
          className="w-full gap-2.5 font-bold min-h-[44px] text-xs sm:text-sm border-border/80 bg-background hover:bg-muted/60 transition-colors shadow-xs"
          aria-label={text === 'signup' ? 'إنشاء حساب باستخدام حساب Google' : 'تسجيل الدخول باستخدام حساب Google'}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              <span>جارٍ التحقق من حساب Google...</span>
            </>
          ) : isInitializing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
              <span>جارٍ إعداد Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon className="h-4 w-4" />
              <span>{text === 'signup' ? 'إنشاء حساب عبر Google' : 'المتابعة باستخدام Google'}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
