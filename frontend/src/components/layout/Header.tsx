'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  ShoppingBag,
  User,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Badge } from '@/components/ui/Badge';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
}

export function Header({ cartItemCount, onOpenCart }: HeaderProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const effectiveCartCount = cartItemCount !== undefined ? cartItemCount : totalItems;
  const handleCartClick = onOpenCart || openCart;

  // Close user dropdown menu when clicking outside or pressing Escape
  React.useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  // Global keyboard shortcut for Search (Ctrl+K / Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* 1. Top Announcement Bar — Trust & Delivery Signals */}
      <div className="w-full bg-obsidian-950 text-ivory-50 text-[11px] sm:text-xs py-2 px-4 border-b border-obsidian-800">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Truck className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
              <span>شحن سريع لـ 27 محافظة في مصر</span>
            </span>
            <span className="hidden md:inline text-white/30">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-white/90">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
              <span>معاينة المنتج وفحصه قبل الاستلام والدفع عند الاستلام</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] text-white/80">
            <Link
              href="/track-order"
              className="inline-flex items-center gap-1 text-gold-500 hover:underline transition-colors font-semibold cursor-pointer"
            >
              <Truck className="h-3 w-3 text-gold-500" aria-hidden="true" />
              <span>تتبع طلبك</span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="h-3 w-3 text-gold-500" aria-hidden="true" />
              <span>ضمان استبدال 14 يوماً</span>
            </span>
            <span className="text-white/80">العملة: <strong className="text-white font-bold">ج.م (EGP)</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-all duration-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Right Section (in RTL): Mobile Hamburger + Brand Logo */}
          <div className="flex items-center gap-3 lg:gap-8">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="flex lg:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              aria-label="فتح القائمة الرئيسية للمتجر"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Bespoke Luxury Typographic Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 px-1 transition-transform active:scale-98"
              aria-label="الصفحة الرئيسية لـ VARELLION"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-obsidian-950 text-gold-500 font-serif font-black text-xl shadow-xs border border-gold-500/40">
                V
              </span>
              <div className="flex flex-col text-start">
                <span className="font-serif font-black text-lg tracking-[0.14em] text-foreground leading-none">
                  VARELLION
                </span>
                <span className="text-[9px] uppercase font-bold tracking-[0.24em] text-gold-700 leading-tight mt-0.5">
                  Accessories & Time
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold" aria-label="التنقل الرئيسي">
              {siteConfig.mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                      isActive ? 'text-foreground font-bold' : 'text-foreground/75'
                    )}
                  >
                    <span>{item.titleAr}</span>
                    {item.badge && (
                      <span className="mr-1.5 inline-block rounded-md bg-gold-100 text-gold-700 border border-gold-500/30 px-1.5 py-0.2 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-5 h-0.5 bg-gold-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Left Section (in RTL): Search, Account, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-2.5 sm:px-3 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent sm:border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="البحث عن منتجات VARELLION"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline text-xs">ابحث عن ساعة أو محفظة…</span>
              <kbd className="hidden lg:inline-flex items-center rounded border border-border bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘&nbsp;K
              </kbd>
            </button>

            {/* Account / User Trigger */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                    "border border-border bg-card hover:bg-secondary shadow-xs",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                    isUserMenuOpen && "bg-secondary border-gold-500/60 ring-2 ring-gold-500/20"
                  )}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label={`قائمة حساب المستخدم: ${user.username}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-obsidian-950 text-gold-500 border border-gold-500/40 text-xs font-black shadow-xs shrink-0">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'V'}
                  </span>
                  <span className="hidden md:inline-block max-w-[110px] truncate text-foreground font-semibold">
                    {user.username}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                      isUserMenuOpen && "rotate-180 text-foreground"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className={cn(
                      "absolute end-0 mt-2.5 w-64 rounded-xl border border-border bg-card p-2.5 shadow-xl z-50",
                      "animate-in fade-in-0 zoom-in-95 duration-150 text-xs space-y-1.5",
                      "ring-1 ring-black/5"
                    )}
                  >
                    {/* User Header Profile Card */}
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/60 border border-border/60 text-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-obsidian-950 text-gold-500 font-serif font-black text-sm border border-gold-500/35">
                        {user.username ? user.username.charAt(0).toUpperCase() : 'V'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-foreground text-xs truncate">{user.username}</p>
                          {user.role === 'ADMIN' ? (
                            <Badge variant="luxury" className="text-[9px] py-0 px-1.5 shrink-0">أدمن</Badge>
                          ) : (
                            <span className="text-[10px] text-gold-700 font-bold shrink-0">عميل VARELLION</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-1 space-y-1">
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-secondary font-semibold transition-colors text-start group"
                      >
                        <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          <User className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">الملف الشخصي وعناويني</span>
                          <span className="text-[10px] text-muted-foreground font-normal">إدارة العناوين والبيانات</span>
                        </div>
                      </Link>

                      <Link
                        href="/track-order"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-secondary font-semibold transition-colors text-start group"
                      >
                        <div className="h-7 w-7 rounded-md bg-gold-100 flex items-center justify-center text-gold-700 group-hover:bg-gold-500 group-hover:text-obsidian-950 transition-colors shrink-0">
                          <Truck className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">تتبع طلباتي</span>
                          <span className="text-[10px] text-muted-foreground font-normal">متابعة شحناتك الحالية</span>
                        </div>
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-foreground hover:bg-secondary font-bold transition-colors text-start"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-foreground shrink-0">
                              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <span>لوحة تحكم الإدارة</span>
                          </div>
                          <Badge variant="luxury" className="text-[10px] py-0 px-1.5">أدمن</Badge>
                        </Link>
                      )}
                    </div>

                    <div className="my-1 border-t border-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-start group"
                    >
                      <div className="h-7 w-7 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-xs">تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-transparent sm:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label="تسجيل الدخول إلى حسابك"
                title="تسجيل الدخول"
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}

            {/* Shopping Cart Trigger */}
            <button
              type="button"
              onClick={handleCartClick}
              className="relative flex min-h-[44px] items-center gap-2 rounded-lg bg-obsidian-950 text-white hover:bg-obsidian-850 px-3.5 transition-all border border-gold-500/30 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 cursor-pointer"
              aria-label={`سلة المشتريات، تحتوي على ${effectiveCartCount} قطع`}
            >
              <ShoppingBag className="h-4 w-4 text-gold-500" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-bold">السلة</span>
              {effectiveCartCount > 0 ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-obsidian-950 text-[11px] font-black shadow-xs animate-in zoom-in">
                  {effectiveCartCount}
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white text-[11px] font-semibold">
                  0
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* 3. Overlay Drawers & Modals */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
