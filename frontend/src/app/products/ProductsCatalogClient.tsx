'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { catalogService } from '@/services/api';
import { Product, Category } from '@/types';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Sparkles, X, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 20;

export interface ProductsCatalogClientProps {
  initialProducts: Product[];
  initialTotal: number;
  initialCategories: Category[];
  initialCategory?: string;
  initialSearch?: string;
  initialFeatured?: boolean;
  initialError?: string | null;
}

export function ProductsCatalogClient({
  initialProducts,
  initialTotal,
  initialCategories,
  initialCategory = 'all',
  initialSearch = '',
  initialFeatured = false,
  initialError = null,
}: ProductsCatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramCategory = searchParams.get('category') || initialCategory || 'all';
  const paramSearch = searchParams.get('search') || searchParams.get('q') || initialSearch || '';
  const paramFeatured =
    searchParams.has('featured')
      ? searchParams.get('featured') === 'true'
      : initialFeatured;

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState<number>(initialTotal);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>(paramCategory);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(paramFeatured);
  const [searchInput, setSearchInput] = useState<string>(paramSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(paramSearch);
  const [sortBy, setSortBy] = useState<'bestseller' | 'price-asc' | 'price-desc'>('bestseller');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(initialError);
  const [retryCount, setRetryCount] = useState<number>(0);

  const isFirstFetchRef = useRef<boolean>(true);

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
    setFeaturedOnly(paramFeatured);
  }, [paramFeatured]);

  useEffect(() => {
    setSearchInput(paramSearch);
    setDebouncedSearch(paramSearch);
  }, [paramSearch]);

  // Load categories on mount only if SSR returned none
  useEffect(() => {
    if (categories.length > 0) return;
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
  }, [categories.length]);

  // Backend-Driven Product Fetching (skips redundant initial fetch when SSR already hydrated data)
  useEffect(() => {
    if (
      isFirstFetchRef.current &&
      !initialError &&
      selectedCategory === initialCategory &&
      debouncedSearch === initialSearch &&
      featuredOnly === initialFeatured &&
      sortBy === 'bestseller' &&
      currentPage === 0 &&
      retryCount === 0
    ) {
      isFirstFetchRef.current = false;
      return;
    }
    isFirstFetchRef.current = false;

    let isCancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await catalogService.getProducts({
          categorySlug: selectedCategory === 'all' ? undefined : selectedCategory,
          searchQuery: debouncedSearch.trim() || undefined,
          isFeatured: featuredOnly || undefined,
          sortBy,
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
  }, [
    selectedCategory,
    debouncedSearch,
    featuredOnly,
    sortBy,
    currentPage,
    retryCount,
    initialCategory,
    initialSearch,
    initialFeatured,
    initialError,
  ]);

  const updateUrl = useCallback(
    (newCategory: string, newSearch: string, newFeatured: boolean) => {
      const params = new URLSearchParams();

      if (newCategory && newCategory !== 'all') {
        params.set('category', newCategory);
      }
      if (newFeatured) {
        params.set('featured', 'true');
      }
      if (newSearch && newSearch.trim()) {
        params.set('search', newSearch.trim());
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(targetUrl, { scroll: false });
    },
    [pathname, router]
  );

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setFeaturedOnly(false);
    setCurrentPage(0);
    updateUrl(categorySlug, debouncedSearch, false);
  };

  const handleFeaturedToggle = () => {
    const next = !featuredOnly;
    setFeaturedOnly(next);
    setCurrentPage(0);
    updateUrl(selectedCategory, debouncedSearch, next);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
    setCurrentPage(0);
    updateUrl(selectedCategory, searchInput, featuredOnly);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCurrentPage(0);
    updateUrl(selectedCategory, '', featuredOnly);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setFeaturedOnly(false);
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

  const headingTitle = activeCategoryName
    ? activeCategoryName
    : featuredOnly
    ? 'عروض حصرية والقطع المميزة'
    : 'الكتالوج الفاخر';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
      {/* Semantic Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6" aria-label="مسار التنقل">
        <Link href="/" className="hover:text-foreground transition-colors">
          الرئيسية
        </Link>
        <span aria-hidden="true" className="text-muted-foreground/60">/</span>
        <Link
          href="/products"
          className={
            activeCategoryName || featuredOnly
              ? 'hover:text-foreground transition-colors'
              : 'font-semibold text-foreground hover:text-primary transition-colors'
          }
          {...(!activeCategoryName && !featuredOnly ? { 'aria-current': 'page' } : {})}
        >
          المنتجات
        </Link>
        {(activeCategoryName || featuredOnly) && (
          <>
            <span aria-hidden="true" className="text-muted-foreground/60">/</span>
            <span className="font-semibold text-foreground" aria-current="page">
              {activeCategoryName || 'عروض حصرية'}
            </span>
          </>
        )}
      </nav>

      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span>تشكيلة VARELLION الحصرية</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            {headingTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            تصفح مجموعتنا المختارة من الساعات الرجالية الراقية والمصنوعات الجلدية الطبيعية 100%. كل قطعة مشمولة بميزة{' '}
            <strong className="text-foreground">المعاينة قبل الاستلام</strong>.
          </p>
        </div>

        {/* Count Badge & Active Filter Reset */}
        <div className="flex items-center gap-3">
          {(selectedCategory !== 'all' || featuredOnly || debouncedSearch.trim()) && (
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
            variant={selectedCategory === 'all' && !featuredOnly ? 'luxury' : 'outline'}
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

          <Button
            variant={featuredOnly ? 'luxury' : 'outline'}
            size="sm"
            onClick={handleFeaturedToggle}
            className="rounded-full text-xs font-bold shrink-0 min-h-[40px] px-4 cursor-pointer"
          >
            عروض حصرية
          </Button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
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

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'bestseller' | 'price-asc' | 'price-desc');
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

      {/* Logical Heading Level (h1 -> h2 -> ProductCard h3) */}
      <section aria-labelledby="catalog-products-heading">
        <h2 id="catalog-products-heading" className="sr-only">
          قائمة منتجات {headingTitle}
        </h2>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          emptyTitle={debouncedSearch ? `لم نجد أي نتائج لـ "${debouncedSearch}"` : 'لم نجد أي قطع مطابقة'}
          emptyDescription="جرب تغيير كلمات البحث أو اختر قسماً آخر من الأقسام بالأعلى."
        />
      </section>

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
