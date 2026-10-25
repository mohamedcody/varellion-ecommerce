export interface NavItem {
  titleAr: string;
  titleEn: string;
  href: string;
  badge?: string;
  badgeColor?: 'luxury' | 'gold' | 'default' | 'success';
}

export const siteConfig = {
  name: 'VARELLION',
  fullName: 'VARELLION Accessories',
  taglineAr: 'الفخامة الرجالية اليومية — ساعات ومصنوعات جلدية صنعت لتدوم',
  taglineEn: 'Everyday Masculine Luxury — Fine Watches & Genuine Leather',
  descriptionAr:
    'متجر VARELLION الرائد في الساعات الفاخرة، المصنوعات الجلدية الطبيعية 100%، وحاملات البطاقات والإكسسوارات الرجالية الراقية في مصر. شحن لجميع المحافظات مع معاينة قبل الاستلام.',
  descriptionEn:
    'VARELLION is Egypt’s destination for refined men’s watches, 100% genuine leather wallets, cardholders, and curated tech accessories.',
  phone: '+20 100 000 0000',
  whatsappUrl: 'https://wa.me/201000000000',
  mainNav: [
    {
      titleAr: 'الرئيسية',
      titleEn: 'Home',
      href: '/',
    },
    {
      titleAr: 'الساعات الفاخرة',
      titleEn: 'Watches',
      href: '/products?category=watches',
      badge: 'الأكثر طلباً',
      badgeColor: 'gold',
    },
    {
      titleAr: 'المحافظ والجلديات',
      titleEn: 'Leather Goods',
      href: '/products?category=leather-goods',
      badge: 'جلد طبيعي',
      badgeColor: 'luxury',
    },
    {
      titleAr: 'الإكسسوارات الرجالية',
      titleEn: 'Accessories',
      href: '/products?category=accessories',
    },
    {
      titleAr: 'عروض حصرية',
      titleEn: 'Deals',
      href: '/products?featured=true',
      badge: 'تخفيضات',
      badgeColor: 'success',
    },
  ] as NavItem[],
  trustPillars: [
    {
      titleAr: 'معاينة قبل الدفع',
      descriptionAr: 'افحص ساعتك ومشترياتك وتأكد من الجودة قبل السداد للمندوب.',
      icon: 'ShieldCheck',
    },
    {
      titleAr: 'الدفع عند الاستلام',
      descriptionAr: 'Cash on Delivery متوفر لجميع المحافظات بدون أي تعقيد.',
      icon: 'Banknote',
    },
    {
      titleAr: 'استرجاع واستبدال 14 يوماً',
      descriptionAr: 'ضمان كامل وموثق لراحتك التامة وحرية التبديل.',
      icon: 'RotateCcw',
    },
    {
      titleAr: 'تغطية 27 محافظة مصرية',
      descriptionAr: 'شحن سريع ومؤمن لباب منزلك في القاهرة، الدلتا والصعيد.',
      icon: 'Truck',
    },
  ],
  governorates: [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'القليوبية',
    'الشرقية',
    'الدقهلية',
    'البحيرة',
    'كفر الشيخ',
    'الغربية',
    'المنوفية',
    'دمياط',
    'بورسعيد',
    'الإسماعيلية',
    'السويس',
    'شمال سيناء',
    'جنوب سيناء',
    'البحر الأحمر',
    'مطروح',
    'الوادي الجديد',
    'الفيوم',
    'بني سويف',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
  ],
};
