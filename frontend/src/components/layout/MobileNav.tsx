'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet } from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import { siteConfig } from '@/config/site';
import {
  Watch,
  Wallet,
  Sparkles,
  Phone,
  ShieldCheck,
  Truck,
  ArrowLeft,
  ChevronLeft,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      title="قائمة المتجر"
      className="max-w-xs sm:max-w-sm"
    >
      <div className="flex flex-col h-full justify-between">
        <nav aria-label="قائمة التنقل للأجهزة الذكية" className="space-y-6">
          {/* User Account / Login Bar */}
          <div className="p-3 rounded-xl border border-border/80 bg-muted/40">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-foreground truncate">{user.username}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    onClose();
                    await logout();
                  }}
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  aria-label="تسجيل الخروج"
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-between rounded-lg bg-[#12363B] text-white px-3 py-2 text-xs font-bold hover:bg-[#12363B]/90 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                  <span>تسجيل الدخول / حساب جديد</span>
                </div>
                <ChevronLeft className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
              </Link>
            )}
          </div>

          {/* Main Links */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              أقسام المتجر الرئيسية
            </p>
            <ul className="space-y-1" role="list">
              {siteConfig.mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.href.includes('watches') ? (
                          <Watch
                            className="h-4 w-4 text-[#C5A059]"
                            aria-hidden="true"
                          />
                        ) : item.href.includes('leather') ? (
                          <Wallet
                            className="h-4 w-4 text-primary"
                            aria-hidden="true"
                          />
                        ) : (
                          <Sparkles
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.titleAr}</span>
                      </div>
                      {item.badge && (
                        <Badge
                          variant={item.badgeColor || 'default'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Egypt Shipping Assurance Banner in Drawer */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Truck className="h-4 w-4" aria-hidden="true" />
              <span>شحن سريع لـ 27 محافظة في مصر</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              يحق لك فتح الطرد ومعاينة المنتج بالكامل قبل سداد أي جنيه للمندوب.
            </p>
          </div>

          {/* Customer Support & WhatsApp Direct */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              خدمة العملاء والطلب السريع
            </p>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-50 text-emerald-950 px-3 py-2 text-sm font-medium hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>طلب واستفسار عبر واتساب</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            </a>
          </div>
        </nav>

        {/* Footer info inside Drawer */}
        <div className="pt-6 border-t border-border text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-between">
            <span>العملة: <strong>الجنيه المصري (EGP)</strong></span>
            <span>الضمان: <strong>14 يوماً</strong></span>
          </div>
          <p className="text-[11px] text-center text-muted-foreground/80">
            © 2026 VARELLION Accessories
          </p>
        </div>
      </div>
    </Sheet>
  );
}
