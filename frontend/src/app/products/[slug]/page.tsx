'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { catalogService } from '@/services/api';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    let isCancelled = false;

    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const found = await catalogService.getProductBySlug(slug);
        if (!isCancelled) {
          setProduct(found);
          if (found && found.images.length > 0) {
            const main = found.images.find((img) => img.isMain) || found.images[0];
            setSelectedImage(main.imageUrl);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load product detail:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    loadProduct();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h2 className="text-2xl font-bold text-foreground mb-3">المنتج غير متوفر</h2>
        <p className="text-sm text-muted-foreground mb-6">
          عذراً، لم نتمكن من العثور على المنتج المطلوب. قد يكون قد نفد من المخزون أو تم تغيير رابطه.
        </p>
        <Link href="/products">
          <Button variant="luxury" size="lg" className="min-h-[44px]">
            العودة لكتالوج المنتجات
          </Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product || product.availableStock <= 0) return;
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const handleFastBuy = () => {
    if (!product || product.availableStock <= 0) return;
    addItem(product, 1);
    openCart();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl text-start">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="مسار التنقل">
        <Link href="/" className="hover:text-foreground transition-colors">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">
          المنتجات
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground truncate max-w-xs">{product.nameAr}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Left / Gallery Column */}
        <div className="flex flex-col gap-4">
          {/* Main Visual Display */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.nameAr}
                className="h-full w-full object-cover object-center transition-all duration-300"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                لا توجد صورة
              </div>
            )}

            {/* Out of Stock Overlay */}
            {product.availableStock <= 0 && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="outline" className="bg-card/95 text-rose-700 border-rose-300 font-bold text-xs shadow-md">
                  نفد من المخزون
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails list if multiple */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2" role="group" aria-label="صور المنتج الإضافية">
              {product.images.map((img, idx) => (
                <button
                  key={img.imageId || idx}
                  type="button"
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                    selectedImage === img.imageUrl
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-xs'
                      : 'border-border/80 opacity-70 hover:opacity-100 hover:border-ivory-300'
                  }`}
                  aria-label={`عرض صورة رقم ${idx + 1} من ${product.images.length}`}
                  aria-pressed={selectedImage === img.imageUrl}
                >
                  <img src={img.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right / Product Information & Purchase Column */}
        <div className="flex flex-col gap-6">
          {/* SKU & Category */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-muted-foreground">كود الموديل: {product.sku}</span>
            <span className="font-semibold text-[#876725] tracking-wide">
              {product.category?.nameAr || 'منتج أصلي'}
            </span>
          </div>

          {/* Product Title & English Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight text-balance">
              {product.nameAr}
            </h1>
            {product.nameEn && (
              <p lang="en" className="font-serif text-xs font-semibold tracking-widest uppercase text-[#876725] mt-1.5">
                {product.nameEn}
              </p>
            )}
          </div>

          {/* Price Box */}
          <div className="flex items-baseline justify-between p-4 rounded-xl bg-card border border-border shadow-2xs">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground tabular-nums">
                {product.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-sm font-bold text-muted-foreground">ج.م</span>
            </div>

            <div className="text-xs font-medium text-muted-foreground">
              تُحسب مصاريف الشحن عند تأكيد الطلب
            </div>
          </div>

          {/* Arabic Detailed Description */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-foreground">تفاصيل ومواصفات القطعة:</h2>
            <div className="text-sm text-foreground/90 leading-relaxed bg-card p-4 rounded-xl border border-border shadow-2xs">
              <p>{product.descriptionAr}</p>
            </div>
          </div>

          {/* Structured Craftsmanship & Technical Specs Table */}
          <div className="space-y-2 pt-1">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
              <span>المواصفات الفنية والحرفية المعتمدة:</span>
            </h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden text-xs shadow-2xs">
              <table className="w-full text-start border-collapse">
                <caption className="sr-only">المواصفات الفنية ومواد تصنيع المنتج</caption>
                <thead className="bg-muted/40 border-b border-border/60 font-semibold text-muted-foreground">
                  <tr>
                    <th scope="col" className="p-2.5 text-start font-semibold">المعيار / الخاصية</th>
                    <th scope="col" className="p-2.5 text-start font-semibold border-r border-border/60">المواصفات وخامات التصنيع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {product.category?.slug?.includes('watch') || product.nameEn?.toLowerCase().includes('watch') ? (
                    <>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">نوع الماكينة والحركة</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">كوارتز يابانية دقيقة (Precision Quartz)</td>
                      </tr>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">مادة الهيكل والمينا</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">فولاذ مقاوم للصدأ 316L فائق الصلابة</td>
                      </tr>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">زجاج الساعة</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">كريستال مقوى ضد الخدوش والانعكاس</td>
                      </tr>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">مقاومة الماء</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">3ATM / 30 متراً (مقاومة للرذاذ والاستخدام اليومي)</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">نوع وخامة الجلد</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">جلد طبيعي 100% مدبوغ نباتياً (Full-Grain)</td>
                      </tr>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">الحماية والتقنية</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">حماية RFID مدمجة لمنع سرقة البطاقات</td>
                      </tr>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">التشطيب والخياطة</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">خياطة يدوية معززة بخيوط شمعية مقاومة للتلف</td>
                      </tr>
                      <tr>
                        <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">ملمس وجودة الخامة</th>
                        <td className="p-2.5 font-bold text-foreground border-r border-border/40">ملمس ناعم وطبيعي يكتسب مظهراً أعمق مع الاستخدام</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* English Craftsmanship Note */}
          {product.descriptionEn && (
            <div className="text-xs text-muted-foreground leading-relaxed italic border-r-2 border-[#C5A059] pr-3">
              <p>{product.descriptionEn}</p>
            </div>
          )}

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {product.availableStock > 0 ? (
              <div className="inline-flex items-center gap-2 text-emerald-800 bg-[#EAF7EE] px-3 py-1 rounded-md border border-emerald-200/50">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>
                  متوفر في المخزون
                  {product.availableStock <= 5 ? ` (متبقي ${product.availableStock} قطع فقط)` : ' — جاهز للشحن الفوري للمحافظات'}
                </span>
              </div>
            ) : (
              <span className="text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-md">
                غير متوفر حالياً
              </span>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleAddToCart}
              disabled={product.availableStock <= 0}
              variant={isAdded ? 'secondary' : 'luxury'}
              size="lg"
              className="flex-1 gap-2.5 font-bold shadow-xs min-h-[48px]"
            >
              {isAdded ? (
                <>
                  <Check className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-800">تمت الإضافة للسلة</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5 text-[#C5A059]" aria-hidden="true" />
                  <span>أضف إلى سلة المشتريات</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleFastBuy}
              disabled={product.availableStock <= 0}
              variant="outline"
              size="lg"
              className="sm:w-auto gap-2 font-bold min-h-[48px]"
            >
              <span>عرض السلة ومراجعة الطلب</span>
            </Button>
          </div>

          {/* Inspection and Guarantee Banner */}
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs">
                  <strong className="text-foreground block font-bold">
                    معاينة مجانية قبل دفع أي قرش للمندوب
                  </strong>
                  <span className="text-muted-foreground">
                    يحق لك فتح الشحنة وفحص جودة المنتج والتأكد من مطابقتها للمواصفات أمام المندوب.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs">
                  <strong className="text-foreground block font-bold">
                    ضمان استبدال واسترجاع 14 يوماً
                  </strong>
                  <span className="text-muted-foreground">
                    سياسة إرجاع مرنة وسهلة في حالة وجود أي عيب أو رغبة في استبدال المقاس.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs">
                  <strong className="text-foreground block font-bold">
                    توصيل آمن لـ 27 محافظة مصرية
                  </strong>
                  <span className="text-muted-foreground">
                    خلال 24-48 ساعة داخل القاهرة والجيزة، ومن 2-3 أيام لباقي المحافظات.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
