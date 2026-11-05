'use client';

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { catalogService } from '@/services/api';
import { Product, Category } from '@/types';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Sparkles, X, Loader2, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

const PAGE_SIZE = 20;

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const paramCategory = searchParams.get('category') || 'all';
  const paramSearch = searchParams.get('search') || searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(paramCategory);
  const [searchInput, setSearchInput] = useState<string>(paramSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(paramSearch);
  const [sortBy, setSortBy] = useState<'bestseller' | 'price-asc' | 'price-desc'>('bestseller');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Synchronize internal state when URL search params change
  useEffect(() => {
    setSelectedCategory(paramCategory);
  }, [paramCategory]);

  useEffect(() => {
    setSearchInput(paramSearch);
    setDebouncedSearch(paramSearch);
  }, [paramSearch]);

  // Load categories once on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const cats = await catalogService.getCategories();
        if (isMounted) {
          setCategories(cats);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Backend-Driven Product Fetching
  useEffect(() => {
    let isCancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await catalogService.getProducts({
          categorySlug: selectedCategory === 'all' ? undefined : selectedCategory,
          searchQuery: debouncedSearch.trim() || undefined,
          sortBy: sortBy,
          page: currentPage,
          limit: PAGE_SIZE,
        });

        if (!isCancelled) {
          setProducts(res.products);
          setTotalProducts(res.total);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load products from backend:', err);
          setFetchError('تعذر الاتصال بالخادم لتحميل المنتجات. يرجى التحقق من الاتصال وإعادة المحاولة.');
          setProducts([]);
          setTotalProducts(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, debouncedSearch, sortBy, currentPage, retryCount]);

  // Update URL helper to maintain clean, shareable URLs
  const updateUrl = useCallback((newCategory: string, newSearch: string) => {
    const params = new URLSearchParams();

    if (newCategory && newCategory !== 'all') {
      params.set('category', newCategory);
    }
    if (newSearch && newSearch.trim()) {
      params.set('search', newSearch.trim());
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(targetUrl, { scroll: false });
  }, [pathname, router]);

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(0);
    updateUrl(categorySlug, debouncedSearch);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
    setCurrentPage(0);
    updateUrl(selectedCategory, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCurrentPage(0);
    updateUrl(selectedCategory, '');
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchInput('');
    setDebouncedSearch('');
    setCurrentPage(0);
    router.push(pathname, { scroll: false });
  };

  const activeCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => c.slug === selectedCategory)?.nameAr || null;
  }, [selectedCategory, categories]);

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

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
          {(selectedCategory !== 'all' || debouncedSearch.trim()) && (
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
            {totalProducts} {totalProducts === 1 ? 'منتج متاح' : 'منتجات متاحة'}
          </Badge>
        </div>
      </div>

      {/* Control Bar: Categories Pills & Search */}
      <div className="py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none" role="tablist" aria-label="أقسام المنتجات">
          <Button
            variant={selectedCategory === 'all' ? 'luxury' : 'outline'}
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
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64" role="search">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="ابحث بالاسم أو الموديل…"
              value={searchInput}
              onChange={handleSearchChange}
              className="pr-9 pl-8 text-xs h-10 rounded-lg"
              aria-label="ابحث في الكتالوج"
            />
            {searchInput && (
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
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(0);
              }}
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

      {/* Error State with Retry Button */}
      {fetchError && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-center my-6">
          <p className="text-sm text-destructive font-medium mb-3">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryCount((c) => c + 1)}
            className="gap-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>إعادة المحاولة</span>
          </Button>
        </div>
      )}

      {/* Product Grid Showcase */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        emptyTitle={debouncedSearch ? `لم نجد أي نتائج لـ "${debouncedSearch}"` : 'لم نجد أي قطع مطابقة'}
        emptyDescription="جرب تغيير كلمات البحث أو اختر قسماً آخر من الأقسام بالأعلى."
      />

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12 pt-6 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="gap-1 text-xs"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span>السابق</span>
          </Button>

          <span className="text-xs font-semibold text-muted-foreground px-3">
            صفحة {currentPage + 1} من {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="gap-1 text-xs"
          >
            <span>التالي</span>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center max-w-7xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-xs text-muted-foreground mt-3">جارٍ تحميل الكتالوج…</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
