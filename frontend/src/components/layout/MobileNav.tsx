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
  Truck,
  ChevronLeft,
  User,
  LogOut,
  ShieldCheck,
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
      className="max-w-xs sm:max-w-sm bg-background"
    >
      <div className="flex flex-col h-full justify-between">
        <nav aria-label="قائمة التنقل للأجهزة الذكية" className="space-y-6">
          {/* User Account / Login Bar */}
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0E0F11] text-[#C5A059] font-serif font-black text-sm border border-[#C5A059]/40">
                      {user.username ? user.username.charAt(0).toUpperCase() : 'V'}
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
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    aria-label="تسجيل الخروج"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex min-h-[40px] items-center gap-1.5 px-2.5 py-2 rounded-lg bg-secondary hover:bg-ivory-200 text-xs font-semibold text-foreground transition-colors border border-border"
                  >
                    <User className="h-3.5 w-3.5 text-foreground shrink-0" aria-hidden="true" />
                    <span className="truncate">الملف الشخصي</span>
                  </Link>

                  <Link
                    href="/track-order"
                    onClick={onClose}
                    className="flex min-h-[40px] items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#FAF4E8] hover:bg-[#F2E8D5] text-xs font-semibold text-[#876725] transition-colors border border-[#C5A059]/30"
                  >
                    <Truck className="h-3.5 w-3.5 text-[#876725] shrink-0" aria-hidden="true" />
                    <span className="truncate">تتبع طلباتي</span>
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-between rounded-lg bg-[#0E0F11] text-white px-3.5 py-2 text-xs font-bold hover:bg-obsidian-850 transition-colors shadow-xs border border-[#C5A059]/35"
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
                        'flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'text-foreground hover:bg-secondary'
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
                          className="text-[10px] px-2 py-0.5"
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
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
              <span>معاينة وفحص قبل الدفع</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              افحص ساعتك أو محفظتك وتأكد من جودتها وخامتها مع المندوب قبل دفع أي مبلغ. شحن لـ 27 محافظة في مصر.
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
              className="flex min-h-[44px] items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-50 text-emerald-950 px-3.5 py-2 text-sm font-semibold hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
        <div className="pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p className="font-serif font-black tracking-widest text-foreground">VARELLION</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">ساعات فاخرة وجلود طبيعية 100%</p>
        </div>
      </div>
    </Sheet>
  );
}
