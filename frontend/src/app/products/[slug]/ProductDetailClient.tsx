'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';

export interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const initialImage =
    (product as any).primaryImage ||
    product.images?.find((img) => img.isMain)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    '';

  const [selectedImage, setSelectedImage] = useState<string>(initialImage);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const { addItem, openCart } = useCart();

  const handleAddToCart = () => {
    if (!product || product.availableStock <= 0) return;
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const handleFastBuy = () => {
    if (!product || product.availableStock <= 0) return;
    addItem(product, quantity);
    openCart();
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(product.availableStock || 99, prev + 1));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const isWatch =
    product.category?.slug?.includes('watch') ||
    product.nameEn?.toLowerCase().includes('watch') ||
    product.nameAr?.includes('ساعة');

  return (
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
        {product.images && product.images.length > 1 && (
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
                {isWatch ? (
                  <>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">نوع الماكينة والحركة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">كوارتز يابانية دقيقة (Miyota Precision Quartz)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">مادة الهيكل والمينا</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">فولاذ مقاوم للصدأ 316L فائق الصلابة (316L Stainless Steel)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">زجاج الساعة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">كريستال ياقوتي مقوى ضد الخدوش والانعكاس (Sapphire Crystal)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">مقاومة الماء</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">3ATM / 30 متراً (مقاومة للرذاذ والاستخدام اليومي)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">المنشأ والتجميع</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">تصميم وتجميع فاخر معتمد في القاهرة (Cairo Origin)</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">نوع وخامة الجلد</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">جلد طبيعي 100% مدبوغ نباتياً (100% Genuine Full-Grain Leather)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">الحماية والتقنية</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">حماية RFID مدمجة لمنع سرقة البطاقات والبيانات</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">التشطيب والخياطة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">خياطة يدوية معززة بخيوط شمعية مقاومة للتلف</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">ملمس وجودة الخامة</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">ملمس ناعم وطبيعي يكتسب مظهراً أعمق مع الاستخدام (Patina)</td>
                    </tr>
                    <tr>
                      <th scope="row" className="p-2.5 text-muted-foreground font-medium text-start">المنشأ والتصنيع</th>
                      <td className="p-2.5 font-bold text-foreground border-r border-border/40">صناعة يدوية فاخرة في ورش القاهرة (Cairo Origin)</td>
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

        {/* Quantity Selector & Primary Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {product.availableStock > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground">الكمية:</span>
              <div className="flex items-center border border-border rounded-lg bg-card">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label="تقليل الكمية"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-bold tabular-nums text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= product.availableStock}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
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
                  <span className="text-emerald-800">تمت الإضافة إلى السلة ✓</span>
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
        </div>

        {/* Inspection and Guarantee Banner */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <strong className="text-foreground block font-bold">
                  معاينة وفحص قبل الاستلام
                </strong>
                <span className="text-muted-foreground">
                  يحق لك فتح الشحنة وفحص جودة المنتج والتأكد من مطابقتها التامة للمواصفات أمام المندوب قبل دفع أي مبلغ.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <strong className="text-foreground block font-bold">
                  توصيل سريع لكافة الـ 27 محافظة مصرية
                </strong>
                <span className="text-muted-foreground">
                  شحن مؤمن خلال 24 إلى 72 ساعة (24-72h) مع خيار الدفع عند الاستلام (Cash on Delivery).
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
                  سياسة إرجاع واستبدال مرنة وسهلة في حال وجود أي ملاحظة أو رغبة في استبدال الموديل.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProductDetailClient;
