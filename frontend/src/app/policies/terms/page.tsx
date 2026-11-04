import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'الشروط والأحكام وضمان الأصالة | VARELLION',
  description: 'الشروط والأحكام الرسمية وضمان الأصالة والمواد الفاخرة لمتجر VARELLION.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background py-10 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-start">
        {/* Breadcrumb */}
        <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">الشروط والأحكام</span>
        </nav>

        {/* Header */}
        <div className="border-b border-border/60 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#876725] bg-[#FAF4E8] px-3 py-1 rounded-full border border-[#C5A059]/30 mb-3">
            <Award className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>معايير النزاهة والفخامة</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            الشروط والأحكام وضمان الأصالة
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            تنظم هذه الشروط العلاقة بين متجر VARELLION والعملاء لضمان حقوق كافة الأطراف بأعلى معايير الشفافية.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>ضمان المواد والخامات الطبيعية 100%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                نلتزم في VARELLION بتقديم منتجات جلدية مصنوعة من جلود طبيعية 100% خالية من الجلود الصناعية أو المركبة، وساعات يد مصنعة من خامات الفولاذ المقاوم للصدأ 316L وماكينات كوارتز يابانية أصلية.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                <span>الأسعار والعملة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                جميع الأسعار المعروضة على الموقع بالجنيه المصري (EGP) وشاملة لكافة التفاصيل المعلنة دون أي رسوم مخفية غير مصاريف الشحن التي تظهر واضحة قبل تأكيد الطلب.
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
