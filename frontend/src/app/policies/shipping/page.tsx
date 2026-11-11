import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'سياسة الشحن والتوصيل لكافة المحافظات | VARELLION',
  description: 'تعرف على تفاصيل ومواعيد وأسعار الشحن لـ 27 محافظة في مصر مع متجر VARELLION الفاخر.',
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-background py-10 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-start">
        {/* Breadcrumb */}
        <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">سياسة الشحن والتوصيل</span>
        </nav>

        {/* Header */}
        <div className="border-b border-border/60 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#876725] bg-[#FAF4E8] px-3 py-1 rounded-full border border-[#C5A059]/30 mb-3">
            <Truck className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>تغطية معتمدة لـ 27 محافظة مصرية</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            سياسة ومواعيد الشحن والتوصيل
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            في VARELLION، ندرك أن تجربة الشراء الفاخرة تبدأ من لحظة اختيار القطعة وحتى استلامها وفحصها بين يديك.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>مواعيد وفترات التوصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground font-bold">القاهرة الكبرى والجيزة:</strong> يتم التوصيل خلال 24 إلى 48 ساعة من تأكيد الطلب هاتفياً.
              </p>
              <p>
                <strong className="text-foreground font-bold">الإسكندرية ومحافظات الدلتا والقناة:</strong> يتم التوصيل خلال 2 إلى 3 أيام عمل.
              </p>
              <p>
                <strong className="text-foreground font-bold">محافظات الصعيد والوجه القبلي والمحافظات الحدودية:</strong> يتم التوصيل خلال 3 إلى 5 أيام عمل بحد أقصى.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>جدول مصاريف الشحن الرسمية للمحافظات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-xl border border-border overflow-hidden text-xs">
                <div className="grid grid-cols-2 p-3 bg-muted/50 font-bold text-foreground border-b border-border">
                  <span>المنطقة / المحافظات</span>
                  <span>تكلفة الشحن (ج.م)</span>
                </div>
                <div className="grid grid-cols-2 p-3 border-b border-border/40">
                  <span>القاهرة، الجيزة، القليوبية</span>
                  <span className="font-bold text-foreground tabular-nums">50 ج.م</span>
                </div>
                <div className="grid grid-cols-2 p-3 border-b border-border/40">
                  <span>الإسكندرية، مطروح</span>
                  <span className="font-bold text-foreground tabular-nums">60 ج.م</span>
                </div>
                <div className="grid grid-cols-2 p-3 border-b border-border/40">
                  <span>الدلتا ومدن القناة (الشرقية، الدقهلية، الغربية، المنوفية، بورسعيد، السويس…)</span>
                  <span className="font-bold text-foreground tabular-nums">65 ج.م</span>
                </div>
                <div className="grid grid-cols-2 p-3 border-b border-border/40">
                  <span>شمال الصعيد (الفيوم، بني سويف، المنيا، أسيوط)</span>
                  <span className="font-bold text-foreground tabular-nums">75 ج.م</span>
                </div>
                <div className="grid grid-cols-2 p-3">
                  <span>جنوب الصعيد والمحافظات الحدودية (سوهاج، قنا، الأقصر، أسوان، البحر الأحمر…)</span>
                  <span className="font-bold text-foreground tabular-nums">85 ج.م</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                ✨ <strong className="text-foreground">شحن مجاني:</strong> يحصل العميل تلقائياً على شحن مجاني لكافة محافظات مصر عند وصول إجمالي قيمة المشتريات إلى <span className="text-foreground font-bold tabular-nums">2,000 ج.م</span> أو أكثر.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>ميزة المعاينة قبل الاستلام والدفع (Inspection First)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                يحق لجميع عملاء VARELLION فتح الشحنة بحضور مندوب شركة الشحن وفحص الساعة أو المنتجات الجلدية بالكامل للتأكد من جودتها ومطابقتها للمواصفات المعروضة على الموقع قبل سداد أي مبلغ مالي.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back Link */}
        <div className="mt-10 pt-6 border-t border-border/60">
          <Link href="/products">
            <Button variant="outline" className="gap-2 text-xs font-bold">
              <span>تصفح مجموعات المنتجات الفاخرة</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
