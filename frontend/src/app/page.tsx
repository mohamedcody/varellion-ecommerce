import Link from 'next/link';
import { catalogService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ProductCard } from '@/components/product/ProductCard';
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
  Award,
  Gem,
  CheckCircle2,
} from 'lucide-react';

export default async function HomePage() {
  const [bestSellers, categories] = await Promise.all([
    catalogService.getBestSellers(4),
    catalogService.getCategories(),
  ]);

  return (
    <div className="flex flex-col items-center">
      {/* 1. Hero Section — 3-Second Conversion Formula */}
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
              <Button variant="luxury" size="lg" className="gap-2.5 shadow-md min-h-[48px]">
                <span>استكشف الساعات الأكثر طلباً</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/products?category=leather-goods">
              <Button variant="outline" size="lg" className="gap-2 min-h-[48px]">
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

      {/* 2. 4 Trust Pillars Bar (The Crucial Egyptian Confidence Drivers) */}
      <section className="w-full border-b border-border/80 bg-card py-8 px-4 sm:px-6 lg:px-8" aria-label="مميزات وثقة الشراء">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/80 bg-background hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">معاينة قبل الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                افتح الشحنة وافحص قطعتك وتأكد من الجودة والخامة بنفسك قبل دفع أي مليم للمندوب.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Banknote className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">الدفع عند الاستلام</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                خدمة Cash on Delivery متوفرة لكافة الطلبات دون الحاجة لبطاقة بنكية مسبقة.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <RotateCcw className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">استرجاع واستبدال 14 يوماً</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                حرية تامة لاستبدال أو إرجاع المنتج بكل سهولة وأمان طبقا لحماية المستهلك.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Truck className="h-5 w-5 text-sky-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">شحن لـ 27 محافظة</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                توصيل سريع ومؤمن لباب بيتك أينما كنت في القاهرة، الإسكندرية، الدلتا أو الصعيد.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Best Sellers Section (Live Product Showcase) */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 border-b border-border/80">
        <div className="container mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                <Award className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
                <span>الخيارات المفضلة لعملائنا في مصر</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                الأكثر طلباً ومبيعاً
              </h2>
            </div>
            <Link href="/products" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 min-h-[44px]">
              <span>تصفح كل التشكيلة</span>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Grid of Best Sellers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curated Category Visual Cards */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-muted/20 border-b border-border/80">
        <div className="container mx-auto max-w-7xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              استكشف مجموعاتنا الحصرية
            </h2>
            <p className="text-sm text-muted-foreground">
              صُممت كل فئة بعناية لتلبي احتياجات الرجل العصري الباحث عن التميز والعملية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.categoryId}
                href={`/products?category=${cat.slug}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-[#C5A059]/30 bg-gradient-to-br from-[#12363B] via-[#0d262a] to-[#081719] p-6 min-h-[240px] shadow-sm hover:border-[#C5A059] hover:shadow-xl transition-all"
              >
                {/* Subtle Luxury Pattern / Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C5A059]/10 via-transparent to-transparent pointer-events-none" />

                {/* Content Overlay */}
                <div className="relative z-10 text-white space-y-2">
                  <Badge variant="luxury" className="bg-[#12363B] text-[#C5A059] border-[#C5A059]/40 text-[11px] font-bold">
                    {cat.productCount ? `${cat.productCount} معروضات متوفرة` : 'تشكيلة حصرية'}
                  </Badge>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#C5A059] transition-colors">
                    {cat.nameAr}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                    {cat.descriptionAr}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#C5A059]">
                    <span>استكشف المجموعة</span>
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Brand Craftsmanship & Guarantee Section */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl rounded-3xl border border-primary/25 bg-gradient-to-br from-[#12363B]/10 via-background to-[#C5A059]/10 p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                <Gem className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
                <span>معايير صناعة VARELLION</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
                فخامة تشعر بها في أدق التفاصيل
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                نحن لا نبيع مجرد إكسسوارات، بل نبتكر قطعاً تمنحك الثقة في كل خطوة. نختار جلود البقر الطبيعية الكاملة التي تزداد جمالاً مع الاستخدام اليومي، ونعتمد الفولاذ المقاوم للصدأ 316L ليقاوم الصدأ والتآكل مدى الحياة.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>جلود طبيعية 100% مدبوغة نباتياً بدون أي مشتقات صناعية رديئة.</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>زجاج مقاوم للخدش وحركات كوارتز يابانية دقيقة لا تخذل وقتك.</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>حق المعاينة الكاملة وتجربة القطعة على يدك قبل دفع ثمنها.</span>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/products">
                  <Button variant="luxury" size="lg" className="min-h-[48px] shadow-md">
                    <span>تسوق التشكيلة الفاخرة الآن</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Highlight */}
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border/80 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80"
                alt="حرفية تصنيع ساعات VARELLION"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <span className="text-sm font-bold text-white">
                  ساعة VARELLION Emerald Chronograph — دقة الفولاذ والياقوت
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
