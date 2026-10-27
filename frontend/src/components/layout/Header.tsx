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
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Badge } from '@/components/ui/Badge';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { useCart } from '@/context/CartContext';
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
  const effectiveCartCount = cartItemCount !== undefined ? cartItemCount : totalItems;
  const handleCartClick = onOpenCart || openCart;

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
      <div className="w-full bg-[#12363B] text-white text-[11px] sm:text-xs py-2 px-4 border-b border-[#17565D]">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1 font-medium">
              <Truck className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
              <span>شحن سريع لـ 27 محافظة في مصر</span>
            </span>
            <span className="hidden md:inline text-white/40">|</span>
            <span className="hidden md:inline-flex items-center gap-1 text-white/90">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
              <span>معاينة المنتج قبل الاستلام والدفع عند الاستلام</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] text-white/80">
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="h-3 w-3 text-[#C5A059]" aria-hidden="true" />
              <span>ضمان استبدال 14 يوماً</span>
            </span>
            <span>العملة: <strong>ج.م (EGP)</strong></span>
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
              className="flex lg:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              aria-label="فتح القائمة الرئيسية للمتجر"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 px-1.5 transition-transform active:scale-98"
              aria-label="الصفحة الرئيسية لـ VARELLION"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12363B] text-white font-black text-lg shadow-sm border border-[#2D7F83]/40">
                V
              </span>
              <div className="flex flex-col text-start">
                <span className="font-black text-lg tracking-wider text-[#12363B] leading-none">
                  VARELLION
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#717F82] leading-tight">
                  Accessories
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" aria-label="التنقل الرئيسي">
              {siteConfig.mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative py-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                      isActive ? 'text-primary font-bold' : 'text-foreground/80'
                    )}
                  >
                    <span>{item.titleAr}</span>
                    {item.badge && (
                      <span className="mr-1.5 inline-block rounded-full bg-[#C5A059]/20 text-[#8C6D23] px-1.5 py-0.2 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-5 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Left Section (in RTL): Search, Account, Cart */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-2.5 sm:px-3 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent sm:border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="البحث عن منتجات VARELLION"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline text-xs">ابحث عن ساعة أو محفظة…</span>
              <kbd className="hidden lg:inline-flex items-center rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘&nbsp;K
              </kbd>
            </button>

            {/* Account / Admin Trigger */}
            <Link
              href="/admin"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="حسابي أو لوحة التحكم"
              title="لوحة الإدارة"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </Link>

            {/* Shopping Cart Trigger */}
            <button
              type="button"
              onClick={handleCartClick}
              className="relative flex min-h-[44px] items-center gap-2 rounded-lg bg-primary/10 px-3 text-primary hover:bg-primary/20 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label={`سلة المشتريات، تحتوي على ${effectiveCartCount} قطع`}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-bold">السلة</span>
              {effectiveCartCount > 0 ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12363B] text-white text-[11px] font-bold shadow-xs animate-in zoom-in">
                  {effectiveCartCount}
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[11px] font-semibold">
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
