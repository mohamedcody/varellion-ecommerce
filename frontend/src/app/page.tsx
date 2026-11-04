import Link from 'next/link';
import { catalogService } from '@/services/api';
import { Product, Category } from '@/types';
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
  let bestSellers: Product[] = [];
  let categories: Category[] = [];
  let hasCatalogError = false;

  try {
    const [fetchedBestSellers, fetchedCategories] = await Promise.all([
      catalogService.getBestSellers(4),
      catalogService.getCategories(),
    ]);
    bestSellers = fetchedBestSellers;
    categories = fetchedCategories;
  } catch (err) {
    console.error('[HomePage] Catalog fetch error fallback:', err);
    hasCatalogError = true;
  }

  const flagshipProduct = bestSellers.length > 0 ? bestSellers[0] : null;
  const flagshipImage =
    flagshipProduct?.images?.find((img) => img.isMain)?.imageUrl ||
    flagshipProduct?.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=85';

  return (
    <div className="flex flex-col items-center">
      {/* 1. Hero Section — Asymmetric Luxury Editorial (3-Second Conversion Formula) */}
      <section className="relative w-full overflow-hidden border-b border-border bg-gradient-to-b from-obsidian-900/5 via-background to-background py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Right Column (in RTL): Brand Story & Conversion CTAs */}
            <div className="lg:col-span-7 space-y-6 text-start">
              {/* Brand Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-100 px-3.5 py-1 text-xs font-bold text-gold-700 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
                <span className="font-serif tracking-wider uppercase">VARELLION — HAUTE HORLOGERIE & CUIR</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.18] text-balance">
                ساعات يد فاخرة ومصنوعات جلد طبيعي 100% تعكس هيبتك اليومية
              </h1>

              {/* Value Description */}
              <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
                اختر قطعتك الاستثنائية من <strong className="text-foreground font-bold">VARELLION</strong>. دقة الماكينات الكوارتز اليابانية، الفولاذ المقاوم للصدأ 316L، وجلود العجل الطبيعية المدبوغة نباتياً، مع ميزة <span className="text-foreground font-bold">المعاينة والفحص قبل الاستلام</span> وشحن مباشر لكافة محافظات مصر.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/products?category=watches">
                  <Button variant="luxury" size="lg" className="gap-2.5 shadow-sm min-h-[48px] px-6">
                    <span>استكشف مجموعة الساعات</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/products?category=leather-goods">
                  <Button variant="outline" size="lg" className="gap-2 min-h-[48px] px-6">
                    <span>محافظ وحاملات كروت</span>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground border-t border-border/60">
                <span className="flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-gold-500" aria-hidden="true" />
                  <span>معاينة القطعة قبل الدفع</span>
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <Truck className="h-4 w-4 text-gold-500" aria-hidden="true" />
                  <span>شحن لـ 27 محافظة في مصر</span>
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <Banknote className="h-4 w-4 text-gold-500" aria-hidden="true" />
                  <span>الدفع عند الاستلام (COD)</span>
                </span>
              </div>
            </div>

            {/* Left Column (in RTL): Hero Visual Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-gold-500/30 bg-obsidian-900 shadow-xl group">
                <img
                  src={flagshipImage}
                  alt={flagshipProduct?.nameAr || 'ساعة VARELLION الفاخرة'}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                
                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/90 via-obsidian-950/30 to-transparent flex flex-col justify-end p-6 text-white text-start">
                  <Badge variant="luxury" className="self-start text-[10px] font-bold mb-2">
                    {flagshipProduct?.isFeatured ? 'الإصدار الرائد المميز' : 'الأكثر طلباً ومبيعاً'}
                  </Badge>
                  <h3 className="font-serif font-black text-lg sm:text-xl text-white tracking-wide">
                    {flagshipProduct?.nameAr || 'ساعة فارليون كرونوغراف'}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-1">
                    {flagshipProduct?.descriptionAr || 'دقة واحترافية لا تضاهى بتصميم يعكس هيبتك اليومية.'}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/20">
                    <span className="text-lg font-black text-gold-500 tabular-nums">
                      {flagshipProduct ? flagshipProduct.price.toLocaleString('ar-EG') : '1,850'}{' '}
                      <span className="text-xs font-bold text-white/80">ج.م</span>
                    </span>
                    <Link
                      href={flagshipProduct ? `/products/${flagshipProduct.slug}` : '/products'}
                      className="text-xs font-bold text-white hover:text-gold-500 flex items-center gap-1 transition-colors"
                    >
                      <span>عرض تفاصيل القطعة</span>
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. 4 Egyptian Confidence Drivers Bar */}
      <section className="w-full border-b border-border bg-card py-8 px-4 sm:px-6 lg:px-8" aria-label="مميزات وثقة الشراء">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-background hover:border-ivory-300 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2 text-start">
              <div className="p-2.5 rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/25 shrink-0 shadow-2xs">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">معاينة وفحص قبل الدفع</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <CardDescription className="text-xs leading-relaxed">
                افتح الشحنة وافحص ساعتك ومشترياتك وتأكد من الجودة والخامة بنفسك قبل سداد أي مبلغ للمندوب.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border bg-background hover:border-ivory-300 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2 text-start">
              <div className="p-2.5 rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/25 shrink-0 shadow-2xs">
                <Banknote className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">الدفع عند الاستلام</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <CardDescription className="text-xs leading-relaxed">
                خدمة Cash on Delivery متاحة لكافة الطلبات في 27 محافظة بدون الحاجة لبطاقة بنكية مسبقة.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border bg-background hover:border-ivory-300 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2 text-start">
              <div className="p-2.5 rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/25 shrink-0 shadow-2xs">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">ضمان استبدال 14 يوماً</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <CardDescription className="text-xs leading-relaxed">
                حق كامل ومكفول لاستبدال أو إرجاع المنتج بسهولة وفقاً للائحة جهاز حماية المستهلك المصري.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border bg-background hover:border-ivory-300 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2 text-start">
              <div className="p-2.5 rounded-lg bg-obsidian-950 text-gold-500 border border-gold-500/25 shrink-0 shadow-2xs">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">تغطية 27 محافظة مصرية</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <CardDescription className="text-xs leading-relaxed">
                شحن سريع ومؤمن لباب بيتك أينما كنت في القاهرة، الجيزة، الإسكندرية، الدلتا أو الصعيد.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Best Sellers Section (Live Product Showcase) */}
      <section className="w-full py-14 sm:py-18 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="container mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-start">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 mb-1">
                <Award className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
                <span>الخيارات الأكثر طلباً في مصر</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                الأكثر طلباً ومبيعاً
              </h2>
            </div>
            <Link href="/products" className="text-xs font-bold text-foreground hover:text-gold-700 flex items-center gap-1 min-h-[44px] transition-colors">
              <span>تصفح كل التشكيلة</span>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Grid of Best Sellers */}
          {hasCatalogError ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card text-center my-4">
              <p className="text-sm text-muted-foreground mb-3">
                جارٍ تحديث معروضات الكتالوج. يمكنك استعراض كافة القطع المتاحة مباشرة.
              </p>
              <Link href="/products">
                <Button variant="luxury" size="sm">
                  الانتقال إلى الكتالوج الفاخر
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Curated Category Visual Cards (Rich Tactile Photography) */}
      <section className="w-full py-14 sm:py-18 px-4 sm:px-6 lg:px-8 bg-secondary/30 border-b border-border">
        <div className="container mx-auto max-w-7xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              استكشف مجموعاتنا الحصرية
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              صُممت كل فئة بعناية فائقة لتلبي طموح الرجل العصري الباحث عن الهيبة والعملية في أدق التفاصيل.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              // High-resolution photography mapping based on real category
              const categoryCover =
                cat.slug === 'watches'
                  ? 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'
                  : cat.slug === 'leather-goods'
                  ? 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80'
                  : 'https://images.unsplash.com/photo-1611591475883-c5a58fb89bfd?auto=format&fit=crop&w=800&q=80';

              return (
                <Link
                  key={cat.categoryId}
                  href={`/products?category=${cat.slug}`}
                  className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-border bg-obsidian-900 p-6 min-h-[280px] shadow-xs hover:border-gold-500/50 hover:shadow-lg transition-all text-start"
                >
                  {/* Real Tactile Photography */}
                  <img
                    src={categoryCover}
                    alt={cat.nameAr}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-65 group-hover:opacity-75"
                    loading="lazy"
                  />

                  {/* Deep Obsidian Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/50 to-transparent" />

                  {/* Content Overlay */}
                  <div className="relative z-10 text-white space-y-2">
                    <Badge variant="luxury" className="text-[10px] font-bold">
                      {cat.productCount ? `${cat.productCount} معروضات متوفرة` : 'تشكيلة حصرية'}
                    </Badge>
                    <h3 className="text-xl font-bold text-white group-hover:text-gold-500 transition-colors">
                      {cat.nameAr}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                      {cat.descriptionAr}
                    </p>
                    <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-gold-500">
                      <span>استكشف المجموعة</span>
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Brand Craftsmanship & Quality Guarantee Section */}
      <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl rounded-2xl border border-border bg-card p-8 sm:p-12 lg:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center text-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-100 px-3.5 py-1 text-xs font-bold text-gold-700">
                <Gem className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
                <span>معايير صناعة VARELLION الصارمة</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight">
                فخامة تشعر بها في أدق التفاصيل
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                نحن لا نبيع مجرد إكسسوارات، بل نبتكر قطعاً تمنحك الثقة في كل خطوة. نعتمد جلود البقر الطبيعية الكاملة التي تزداد جمالاً مع الاستخدام اليومي، والفولاذ المقاوم للصدأ 316L ليقاوم الصدأ والتآكل مدى الحياة.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>جلود طبيعية 100% مدبوغة نباتياً بدون أي مشتقات صناعية رديئة.</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>زجاج مقاوم للخدش وحركات كوارتز يابانية دقيقة لا تخذل وقتك.</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>حق المعاينة الكاملة وتجربة القطعة على يدك قبل دفع ثمنها.</span>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/products">
                  <Button variant="luxury" size="lg" className="min-h-[48px] px-8 shadow-xs">
                    <span>تسوق التشكيلة الفاخرة الآن</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Highlight */}
            <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border shadow-md">
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80"
                alt="حرفية تصنيع ساعات VARELLION"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/85 via-transparent to-transparent flex items-end p-6">
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
