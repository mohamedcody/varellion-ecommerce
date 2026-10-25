import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Banknote,
  Watch,
  Wallet,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section — 3-Second Conversion Formula */}
      <section className="relative w-full overflow-hidden border-b border-border/80 bg-gradient-to-b from-[#12363B]/5 via-background to-background py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl text-center space-y-6">
          
          {/* Brand Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>الفخامة الرجالية اليومية — صُنعت لتدوم بأعلى جودة</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
            ساعات يد فاخرة ومصنوعات جلد طبيعي 100% تعكس هيبتك
          </h1>

          {/* Value Description */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
            اختر قطعتك الاستثنائية من <strong className="text-foreground">VARELLION</strong>. دقة في التصميم، جلود أصلية متينة، وفولاذ مقاوم للصدأ، مع ميزة <span className="text-foreground font-semibold">المعاينة قبل الدفع</span> وشحن لكافة محافظات مصر.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/products?category=watches">
              <Button variant="luxury" size="lg" className="gap-2.5 shadow-md">
                <span>استكشف الساعات الأكثر طلباً</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/products?category=leather-goods">
              <Button variant="outline" size="lg" className="gap-2">
                <span>محافظ وحاملات كروت</span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          {/* Subtle Stock & Trust Indicator */}
          <p className="text-xs text-muted-foreground pt-2">
            ⭐ انضم لأكثر من 1,500 عميل في مصر اختاروا الفخامة المضمونة
          </p>
        </div>
      </section>

      {/* 4 Trust Pillars Bar (The Crucial Egyptian Confidence Drivers) */}
      <section className="w-full border-b border-border/80 bg-card py-8 px-4 sm:px-6 lg:px-8" aria-label="مميزات وثقة الشراء">
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="border-border/80 bg-background hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">معاينة قبل الدفع</CardTitle>
                <CardDescription className="text-xs">افحص منتجك قبل السداد</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              يحق لك فتح الطرد وفحص خامة الساعة أو المحفظة والتأكد من مطابقتها قبل دفع أي مبالغ للمندوب.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background hover:border-[#C5A059]/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-[#C5A059]/15 text-[#C5A059] shrink-0">
                <Banknote className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">الدفع عند الاستلام</CardTitle>
                <CardDescription className="text-xs">Cash on Delivery (COD)</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              سدد قيمة طلبك نقداً براحة تامة عند وصول المندوب لباب منزلك في أي محافظة داخل جمهورية مصر.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">ضمان استبدال 14 يوماً</CardTitle>
                <CardDescription className="text-xs">استرجاع وتبديل فوري</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              سياسة إرجاع واستبدال واضحة وموثقة تضمن لك راحة البال الكاملة وحقك في التبديل دون أي تعقيد.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background hover:border-[#C5A059]/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-[#C5A059]/15 text-[#C5A059] shrink-0">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">تغطية 27 محافظة</CardTitle>
                <CardDescription className="text-xs">توصيل سريع لباب منزلك</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              شحن مؤمن لجميع محافظات مصر (القاهرة والجيزة والإسكندرية والدلتا والصعيد والمحافظات الساحلية).
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-6xl space-y-10">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">تشكيلات VARELLION</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                تسوق حسب القسم الرئيسي
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>مشاهدة الكتالوج كاملاً</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Watches Category Card */}
            <Link
              href="/products?category=watches"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#12363B] text-[#C5A059] shadow-sm">
                  <Watch className="h-6 w-6" aria-hidden="true" />
                </div>
                <Badge variant="gold" className="text-[10px]">الأعلى مبيعاً</Badge>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  ساعات يد رجالية فاخرة
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ساعات ميكانيكية وكلاسيكية من الفولاذ المقاوم للصدأ وزجاج مقاوم للخدش، بتصاميم تناسب العمل والمناسبات.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                <span>استكشف الساعات</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </div>
            </Link>

            {/* Leather Goods Category Card */}
            <Link
              href="/products?category=leather-goods"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#12363B] text-white shadow-sm">
                  <Wallet className="h-6 w-6" aria-hidden="true" />
                </div>
                <Badge variant="luxury" className="text-[10px]">جلد طبيعي 100%</Badge>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  المحافظ وحاملات البطاقات
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  محافظ جلد طبيعي مدبوغ يدوياً مع حماية RFID من سرقة بيانات البطاقات، عملية ونحيفة جداً في الجيب.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                <span>استكشف الجلديات</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </div>
            </Link>

            {/* Men's Accessories Category Card */}
            <Link
              href="/products?category=accessories"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground shadow-sm">
                  <Sparkles className="h-6 w-6 text-[#C5A059]" aria-hidden="true" />
                </div>
                <Badge variant="secondary" className="text-[10px]">إكسسوارات متكاملة</Badge>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  إكسسوارات وملحقات رجالية
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  أزرار أكمام فخمة، أساور جلد ومعدن راقية، وملحقات تقنية ذكية تكتمل بها إطلالتك اليومية.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                <span>استكشف الإكسسوارات</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </div>
            </Link>

          </div>

        </div>
      </section>
    </div>
  );
}
