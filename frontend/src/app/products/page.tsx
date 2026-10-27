'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { catalogService } from '@/services/api';
import { Product, Category } from '@/types';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'bestseller' | 'price-asc' | 'price-desc'>('bestseller');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

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

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'bestseller') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, categories]);

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
            الكتالوج الفاخر
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            تصفح مجموعتنا المختارة من الساعات الرجالية الراقية والمصنوعات الجلدية الطبيعية 100%. كل قطعة مشمولة بميزة <strong className="text-foreground">المعاينة قبل الاستلام</strong>.
          </p>
        </div>

        {/* Count Badge */}
        <div className="flex items-center gap-2">
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
            variant={selectedCategory === 'all' ? 'luxury' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="rounded-full text-xs font-bold shrink-0 min-h-[40px] px-4"
          >
            جميع المعروضات
          </Button>

          {categories.map((cat) => (
            <Button
              key={cat.categoryId}
              variant={selectedCategory === cat.slug ? 'luxury' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.slug)}
              className="rounded-full text-xs font-bold shrink-0 min-h-[40px] px-4"
            >
              {cat.nameAr}
            </Button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="ابحث بالاسم أو الموديل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 text-xs h-10 rounded-lg"
              aria-label="ابحث في الكتالوج"
            />
          </div>

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
        emptyTitle="لم نجد أي قطع مطابقة لبحثك"
        emptyDescription="جرب تغيير كلمات البحث أو اختر قسماً آخر من الأقسام بالأعلى."
      />
    </div>
  );
}
