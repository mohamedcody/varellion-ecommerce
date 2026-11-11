import React from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'سياسة الاستبدال والاسترجاع والضمان | VARELLION',
  description: 'ضمان الاستبدال والاسترجاع لمدة 14 يوماً وفق قانون حماية المستهلك المصري من متجر VARELLION.',
};

export default function ReturnsPolicyPage() {
  return (
    <main className="min-h-screen bg-background py-10 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-start">
        {/* Breadcrumb */}
        <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">سياسة الاستبدال والاسترجاع</span>
        </nav>

        {/* Header */}
        <div className="border-b border-border/60 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#876725] bg-[#FAF4E8] px-3 py-1 rounded-full border border-[#C5A059]/30 mb-3">
            <RotateCcw className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>ضمان مكفول وفق قانون حماية المستهلك المصري</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            سياسة الاستبدال والاسترجاع والضمان
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            ثقتكم هي رصيدنا الأكبر. نضمن لكم حقاً كاملاً ومكفولاً في الاستبدال أو الاسترجاع بكل سهولة وشفافية.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>حق المعاينة الكاملة أثناء الاستلام</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                يحق للعميل معاينة وفحص الشحنة في وجود المندوب، وفي حال وجود أي عيب أو عدم مطابقة للمواصفات المعروضة، يحق للعميل رفض استلام الشحنة دون تحمل أي رسوم.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>شروط الاستبدال والاسترجاع خلال 14 يوماً</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>أن يكون المنتج في حالته الأصلية وبغلافه الأصلي مع كامل الملحقات وبطاقة الضمان.</li>
                <li>ألا تكون الساعة أو المحفظة الجلدية قد تعرضت للاستخدام أو إزالة لاصقات الحماية والأختام.</li>
                <li>تقديم رقم الطلب أو الفاتورة المسجلة على النظام.</li>
                <li>في حال وجود عيب صناعة، يتحمل متجر VARELLION كامل مصاريف الشحن الخاصة بالإرجاع أو الاستبدال.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>طريقة تقديم طلب استبدال أو إرجاع</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                يمكنك تقديم طلب الاستبدال أو الإرجاع بسهولة عبر التواصل المباشر مع خدمة العملاء على واتساب مع ذكر رقم الطلب وصورة المنتج، وسيتم التنسيق لرد الشحنة واستبدالها أو استرداد المبلغ خلال 3 إلى 5 أيام عمل.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back Link */}
        <div className="mt-10 pt-6 border-t border-border/60">
          <Link href="/products">
            <Button variant="outline" className="gap-2 text-xs font-bold">
              <span>العودة لكتالوج المنتجات</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
