'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { catalogService } from '@/services/api';
import { Product, Category } from '@/types';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const paramCategory = searchParams.get('category') || 'all';
  const paramSearch = searchParams.get('search') || searchParams.get('q') || '';
  const paramFeatured = searchParams.get('featured') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(paramCategory);
  const [searchQuery, setSearchQuery] = useState<string>(paramSearch);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState<boolean>(paramFeatured);
  const [sortBy, setSortBy] = useState<'bestseller' | 'price-asc' | 'price-desc'>('bestseller');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize internal state when URL search params change
  useEffect(() => {
    setSelectedCategory(paramCategory);
  }, [paramCategory]);

  useEffect(() => {
    setSearchQuery(paramSearch);
  }, [paramSearch]);

  useEffect(() => {
    setIsFeaturedOnly(paramFeatured);
  }, [paramFeatured]);

  // Load catalog categories and products
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, prodsRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prodsRes.products);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update URL helper to maintain clean, shareable URLs
  const updateUrl = (newCategory?: string, newSearch?: string, newFeatured?: boolean) => {
    const params = new URLSearchParams();
    const cat = newCategory !== undefined ? newCategory : selectedCategory;
    const search = newSearch !== undefined ? newSearch : searchQuery;
    const feat = newFeatured !== undefined ? newFeatured : isFeaturedOnly;

    if (cat && cat !== 'all') {
      params.set('category', cat);
    }
    if (search.trim()) {
      params.set('search', search.trim());
    }
    if (feat) {
      params.set('featured', 'true');
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(targetUrl, { scroll: false });
  };

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    updateUrl(categorySlug, searchQuery, isFeaturedOnly);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(selectedCategory, searchQuery, isFeaturedOnly);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateUrl(selectedCategory, '', isFeaturedOnly);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setIsFeaturedOnly(false);
    router.push(pathname, { scroll: false });
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.categoryId);
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.descriptionAr.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    // Filter by Featured
    if (isFeaturedOnly) {
      result = result.filter((p) => p.isFeatured);
    }

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'bestseller') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, isFeaturedOnly, sortBy, categories]);

  const activeCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => c.slug === selectedCategory)?.nameAr || null;
  }, [selectedCategory, categories]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>تشكيلة VARELLION الحصرية</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            {activeCategoryName ? activeCategoryName : 'الكتالوج الفاخر'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            تصفح مجموعتنا المختارة من الساعات الرجالية الراقية والمصنوعات الجلدية الطبيعية 100%. كل قطعة مشمولة بميزة <strong className="text-foreground">المعاينة قبل الاستلام</strong>.
          </p>
        </div>

        {/* Count Badge & Active Filter Reset */}
        <div className="flex items-center gap-3">
          {(selectedCategory !== 'all' || searchQuery.trim() || isFeaturedOnly) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>إعادة ضبط الفلاتر</span>
            </Button>
          )}

          <Badge variant="outline" className="px-3 py-1 font-semibold text-xs">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'منتج متاح' : 'منتجات متاحة'}
          </Badge>
        </div>
      </div>

      {/* Control Bar: Categories Pills & Search */}
      <div className="py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none" role="tablist" aria-label="أقسام المنتجات">
          <Button
            variant={selectedCategory === 'all' && !isFeaturedOnly ? 'luxury' : 'outline'}
            size="sm"
            onClick={() => handleCategorySelect('all')}
            className="rounded-full text-xs font-bold shrink-0 min-h-[40px] px-4 cursor-pointer"
          >
            جميع المعروضات
          </Button>

          {categories.map((cat) => (
            <Button
              key={cat.categoryId}
              variant={selectedCategory === cat.slug ? 'luxury' : 'outline'}
              size="sm"
              onClick={() => handleCategorySelect(cat.slug)}
              className="rounded-full text-xs font-bold shrink-0 min-h-[40px] px-4 cursor-pointer"
            >
              {cat.nameAr}
            </Button>
          ))}

          {/* Featured Deals Filter Pill */}
          <Button
            variant={isFeaturedOnly ? 'luxury' : 'outline'}
            size="sm"
            onClick={() => {
              const next = !isFeaturedOnly;
              setIsFeaturedOnly(next);
              updateUrl(selectedCategory, searchQuery, next);
            }}
            className="rounded-full text-xs font-bold shrink-0 min-h-[40px] px-4 cursor-pointer border-[#C5A059]/40 text-[#8C6D23] dark:text-[#C5A059]"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            <span>عروض حصرية</span>
          </Button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64" role="search">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="ابحث بالاسم أو الموديل..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pr-9 pl-8 text-xs h-10 rounded-lg"
              aria-label="ابحث في الكتالوج"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="مسح البحث"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </form>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer min-h-[40px]"
              aria-label="ترتيب المنتجات"
            >
              <option value="bestseller">الأكثر طلباً</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid Showcase */}
      <ProductGrid
        products={filteredProducts}
        isLoading={isLoading}
        emptyTitle={searchQuery ? `لم نجد أي نتائج لـ "${searchQuery}"` : 'لم نجد أي قطع مطابقة'}
        emptyDescription="جرب تغيير كلمات البحث أو اختر قسماً آخر من الأقسام بالأعلى."
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center max-w-7xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-xs text-muted-foreground mt-3">جارٍ تحميل الكتالوج...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
