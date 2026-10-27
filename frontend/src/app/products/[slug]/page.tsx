'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { catalogService } from '@/services/api';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Check,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Clock,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const found = await catalogService.getProductBySlug(slug);
        setProduct(found);
        if (found && found.images.length > 0) {
          const main = found.images.find((img) => img.isMain) || found.images[0];
          setSelectedImage(main.imageUrl);
        }
        if (found && found.colors && found.colors.length > 0) {
          setSelectedColor(found.colors[0].nameAr);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
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

  const discountPercent =
    product.previousPrice && product.previousPrice > product.price
      ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
      : null;

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2500);
    }, 450);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">
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
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/20">
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

            {/* Badges Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              {product.badge && (
                <Badge variant="luxury" className="font-bold text-xs shadow-md">
                  {product.badge}
                </Badge>
              )}
              {discountPercent && (
                <Badge variant="gold" className="font-black text-xs shadow-md">
                  خصم {discountPercent}%
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnails list if multiple */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.imageId}
                  type="button"
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    selectedImage === img.imageUrl
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border/70 opacity-70 hover:opacity-100'
                  }`}
                  aria-label="عرض صورة مصغرة للمنتج"
                >
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right / Product Information & Purchase Column */}
        <div className="flex flex-col gap-6">
          {/* Rating & SKU */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-muted-foreground">كود الموديل: {product.sku}</span>
            {product.rating && (
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Star className="h-4 w-4 fill-[#C5A059] text-[#C5A059]" aria-hidden="true" />
                <span className="text-sm">{product.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({product.reviewCount} تقييم موثق)</span>
              </div>
            )}
          </div>

          {/* Product Title & English Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              {product.nameAr}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">
              {product.nameEn}
            </p>
          </div>

          {/* Price Box */}
          <div className="flex items-baseline gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-3xl font-black text-foreground">
              {product.price.toLocaleString('ar-EG')} <span className="text-sm font-bold">ج.م</span>
            </span>
            {product.previousPrice && (
              <span className="text-base text-muted-foreground line-through">
                {product.previousPrice.toLocaleString('ar-EG')} ج.م
              </span>
            )}
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mr-auto">
              شامل ضريبة المبيعات
            </span>
          </div>

          {/* Description */}
          <div className="text-sm text-foreground/90 leading-relaxed">
            <p>{product.descriptionAr}</p>
          </div>

          {/* Color Selection if any */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                اللون / الإصدار: <span className="text-primary">{selectedColor}</span>
              </label>
              <div className="flex items-center gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.nameAr}
                    type="button"
                    onClick={() => setSelectedColor(c.nameAr)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                      selectedColor === c.nameAr
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : 'border-border text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {product.availableStock > 0 ? (
              <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>متوفر في المخزون — جاهز للشحن الفوري للمحافظات</span>
              </div>
            ) : (
              <span className="text-rose-600">غير متوفر حالياً</span>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleAddToCart}
              disabled={product.availableStock <= 0 || isAddingToCart}
              variant={isAdded ? 'secondary' : 'luxury'}
              size="lg"
              className="flex-1 gap-2.5 font-bold shadow-md min-h-[48px]"
            >
              {isAdded ? (
                <>
                  <Check className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <span className="text-emerald-700 dark:text-emerald-400">تمت الإضافة للسلة بنجاح</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                  <span>{isAddingToCart ? 'جاري الإضافة...' : 'أضف إلى سلة المشتريات'}</span>
                </>
              )}
            </Button>

            <Link href="/checkout" className="sm:w-auto">
              <Button
                variant="default"
                size="lg"
                className="w-full gap-2 font-bold min-h-[48px]"
              >
                <span>شراء سريع (دفع عند الاستلام)</span>
              </Button>
            </Link>
          </div>

          {/* Inspection and Guarantee Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
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
                <RotateCcw className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs">
                  <strong className="text-foreground block font-bold">
                    ضمان استبدال واسترجاع 14 يوماً
                  </strong>
                  <span className="text-muted-foreground">
                    سياسة إرجاع مرنة وسهلة في حالة وجود أي عيب أو عدم رضا عن المنتج.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
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

          {/* Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-border/80 pt-6 space-y-3">
              <h3 className="font-bold text-sm text-foreground">المواصفات الفنية للقطعة:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50"
                  >
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-bold text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
