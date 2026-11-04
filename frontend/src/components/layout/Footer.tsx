import Link from 'next/link';
import { siteConfig } from '@/config/site';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Banknote,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-obsidian-800 bg-obsidian-950 text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        تذييل صفحة متجر VARELLION
      </h2>

      {/* 1. Value Guarantee Badges Banner */}
      <div className="border-b border-obsidian-800 py-8 px-4 sm:px-6 lg:px-8 bg-obsidian-900">
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/30 shadow-xs">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ivory-50">معاينة قبل الدفع</h3>
              <p className="text-xs text-white/70">يحق لك فحص المنتج وخامته قبل سداد أي مبلغ</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/30 shadow-xs">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ivory-50">الدفع عند الاستلام</h3>
              <p className="text-xs text-white/70">سداد نقدي مريح ومتاح لكل الـ 27 محافظة</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/30 shadow-xs">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ivory-50">ضمان استبدال 14 يوماً</h3>
              <p className="text-xs text-white/70">استرجاع وتبديل مرن وسريع وفقاً للقانون</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/30 shadow-xs">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ivory-50">شحن لـ 27 محافظة</h3>
              <p className="text-xs text-white/70">توصيل لباب بيتك خلال 24 إلى 72 ساعة</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation & Business Info */}
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-obsidian-950 text-gold-500 font-serif font-black text-xl shadow-xs border border-gold-500/40">
                V
              </span>
              <div>
                <span className="font-serif font-black text-xl tracking-[0.14em] text-white">
                  VARELLION
                </span>
                <span lang="fr" className="block text-[9px] uppercase font-bold tracking-[0.24em] text-gold-500">
                  Haute Horlogerie & Cuir
                </span>
              </div>
            </div>

            <p className="text-xs text-white/75 leading-relaxed max-w-sm">
              براند مصري راقٍ متخصص في الساعات الفاخرة، المصنوعات والمحافظ الجلدية الطبيعية 100%، وحاملات البطاقات الذكية، وإكسسوارات الرجل العصري.
            </p>

            <div className="pt-2 text-xs text-white/80 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold-500" aria-hidden="true" />
                <span>جمهورية مصر العربية — خدمة وتوصيل لجميع المحافظات</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-500" aria-hidden="true" />
                <span>خدمة العملاء: يومياً من 10 صباحاً حتى 10 مساءً</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ivory-50 uppercase tracking-wider">
              أقسام المنتجات
            </h3>
            <ul className="space-y-2 text-xs text-white/75" role="list">
              <li>
                <Link href="/products?category=watches" className="hover:text-gold-500 transition-colors">
                  ساعات يد فاخرة رجالية
                </Link>
              </li>
              <li>
                <Link href="/products?category=leather-goods" className="hover:text-gold-500 transition-colors">
                  محافظ جلد طبيعي وحاملات كروت
                </Link>
              </li>
              <li>
                <Link href="/products?category=accessories" className="hover:text-gold-500 transition-colors">
                  إكسسوارات رجالية راقية
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="hover:text-gold-500 transition-colors">
                  القطع الأكثر مبيعاً في مصر
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ivory-50 uppercase tracking-wider">
              خدمة العملاء والضمان
            </h3>
            <ul className="space-y-2 text-xs text-white/75" role="list">
              <li>
                <Link href="/track-order" className="hover:text-gold-500 transition-colors">
                  تتبع حالة طلبك
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-gold-500 transition-colors">
                  سياسة الاسترجاع والمعاينة
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-gold-500 transition-colors">
                  أسعار ومواعيد الشحن للمحافظات
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-gold-500 transition-colors">
                  الشروط والأحكام وضمان الأصالة
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Contact & COD Notice */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ivory-50 uppercase tracking-wider">
              تواصل وطلب سريع
            </h3>
            <p className="text-xs text-white/75 leading-relaxed">
              تحتاج مساعدة أو استفسار عن مقاس أو خامة؟ فريقنا جاهز لمساعدتك عبر واتساب:
            </p>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>محادثة فورية عبر واتساب</span>
              <span className="sr-only">(يفتح في نافذة أو تطبيق جديد)</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar: Copyright & Payment Badges */}
      <div className="border-t border-obsidian-850 bg-obsidian-950 py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© 2026 VARELLION Accessories. جميع الحقوق محفوظة — صُنعت لتدوم بأعلى جودة.</p>
          
          {/* Payment Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white font-medium">الدفع عند الاستلام (COD)</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white font-medium">فيزا / ماستركارد</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white font-medium">ميزة (Meeza)</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white font-medium">فودافون كاش ومحافظ المحمول</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
