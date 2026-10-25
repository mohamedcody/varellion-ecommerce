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
    <footer className="w-full border-t border-border bg-[#1C2426] text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        تذييل صفحة متجر VARELLION
      </h2>

      {/* 1. Value Guarantee Badges Banner */}
      <div className="border-b border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#12363B] text-[#C5A059] border border-[#2D7F83]/30">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">معاينة قبل الدفع</h3>
              <p className="text-xs text-white/60">يحق لك فحص المنتج قبل سداد أي مبلغ</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#12363B] text-[#C5A059] border border-[#2D7F83]/30">
              <Banknote className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">الدفع عند الاستلام</h3>
              <p className="text-xs text-white/60">سداد نقدي مريح ومتاح لكل المحافظات</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#12363B] text-[#C5A059] border border-[#2D7F83]/30">
              <RotateCcw className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">ضمان استبدال 14 يوماً</h3>
              <p className="text-xs text-white/60">استرجاع وتبديل مرن وسريع</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#12363B] text-[#C5A059] border border-[#2D7F83]/30">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">شحن لـ 27 محافظة</h3>
              <p className="text-xs text-white/60">توصيل لباب بيتك خلال 24-72 ساعة</p>
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
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12363B] text-white font-black text-lg shadow-sm border border-[#2D7F83]/40">
                V
              </span>
              <div>
                <span className="font-black text-xl tracking-wider text-white">
                  VARELLION
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-[#79B8B8]">
                  Accessories
                </span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm">
              براند مصري راقٍ متخصص في الساعات الفاخرة، المصنوعات والمحافظ الجلدية الطبيعية 100%، وحاملات البطاقات الذكية، وإكسسوارات الرجل العصري.
            </p>

            <div className="pt-2 text-xs text-white/80 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>جمهورية مصر العربية — خدمة وتوصيل لجميع المحافظات</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>خدمة العملاء: يومياً من 10 صباحاً حتى 10 مساءً</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              أقسام المنتجات
            </h3>
            <ul className="space-y-2 text-xs text-white/70" role="list">
              <li>
                <Link href="/products?category=watches" className="hover:text-white transition-colors">
                  ساعات يد فاخرة رجالية
                </Link>
              </li>
              <li>
                <Link href="/products?category=leather-goods" className="hover:text-white transition-colors">
                  محافظ جلد طبيعي وحاملات كروت
                </Link>
              </li>
              <li>
                <Link href="/products?category=accessories" className="hover:text-white transition-colors">
                  إكسسوارات رجالية وملحقات تقنية
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="hover:text-white transition-colors">
                  القطع الأكثر مبيعاً في مصر
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              خدمة العملاء والضمان
            </h3>
            <ul className="space-y-2 text-xs text-white/70" role="list">
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  تتبع حالة طلبك
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-white transition-colors">
                  سياسة الاسترجاع والمعاينة
                </Link>
              </li>
              <li>
                <Link href="/shipping-rates" className="hover:text-white transition-colors">
                  أسعار ومواعيد الشحن للمحافظات
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Contact & COD Notice */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              تواصل وطلب سريع
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              تحتاج مساعدة أو استفسار عن مقاس أو خامة؟ فريقنا جاهز لمساعدتك عبر واتساب:
            </p>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>محادثة فورية عبر واتساب</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar: Copyright & Payment Badges */}
      <div className="border-t border-white/10 bg-[#121819] py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© 2026 VARELLION Accessories. جميع الحقوق محفوظة — صنع وتطوير بأعلى معايير الجودة.</p>
          
          {/* Payment Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded bg-white/10 px-2 py-1 text-white font-medium">الدفع عند الاستلام (COD)</span>
            <span className="rounded bg-white/10 px-2 py-1 text-white font-medium">فيزا / ماستركارد</span>
            <span className="rounded bg-white/10 px-2 py-1 text-white font-medium">ميزة (Meeza)</span>
            <span className="rounded bg-white/10 px-2 py-1 text-white font-medium">فودافون كاش ومحافظ المحمول</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
