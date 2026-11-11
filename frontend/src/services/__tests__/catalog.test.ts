import { describe, it, expect, vi, beforeEach } from 'vitest';
import { catalogService, mapProductDto } from '../api';

describe('catalogService & mapProductDto', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapProductDto correctly maps backend DTO to frontend domain Product', () => {
    const dto = {
      productId: 'a0000000-0000-0000-0000-000000000001',
      categoryId: '11111111-1111-1111-1111-111111111111',
      categorySlug: 'watches',
      categoryNameAr: 'الساعات الفاخرة',
      categoryNameEn: 'Luxury Watches',
      sku: 'VAR-W-EMR-01',
      nameAr: 'ساعة كرونوغراف',
      nameEn: 'Chronograph Watch',
      descriptionAr: 'وصف عربي',
      descriptionEn: 'English desc',
      price: 1850.0,
      stockQuantity: 20,
      reservedQuantity: 5,
      availableStock: 15,
      isActive: true,
      images: [
        {
          imageId: 'img-1',
          imageUrl: 'https://images.example.com/watch.jpg',
          isMain: true,
          displayOrder: 1,
        },
      ],
      createdAt: '2026-10-31T10:00:00Z',
    };

    const product = mapProductDto(dto);

    expect(product.productId).toBe('a0000000-0000-0000-0000-000000000001');
    expect(product.slug).toBe('VAR-W-EMR-01');
    expect(product.sku).toBe('VAR-W-EMR-01');
    expect(product.price).toBe(1850);
    expect(product.availableStock).toBe(15);
    expect(product.category?.slug).toBe('watches');
    expect(product.images).toHaveLength(1);
    expect(product.images[0].isMain).toBe(true);
  });

  it('mapProductDto correctly maps DTO when only availableStock is present (no internal stock counts)', () => {
    const dto = {
      productId: 'a0000000-0000-0000-0000-000000000002',
      sku: 'VAR-W-02',
      nameAr: 'ساعة أوبسيديان',
      nameEn: 'Obsidian Watch',
      price: 1450,
      availableStock: 12,
      isActive: true,
      images: [],
    };

    const product = mapProductDto(dto);

    expect(product.productId).toBe('a0000000-0000-0000-0000-000000000002');
    expect(product.availableStock).toBe(12);
    expect(product.stockQuantity).toBe(12);
    expect(product.reservedQuantity).toBe(0);
  });

  it('getCategories calls /categories and returns category array', async () => {
    const mockCategoriesData = [
      {
        categoryId: 'cat-1',
        nameAr: 'الساعات الفاخرة',
        nameEn: 'Luxury Watches',
        slug: 'watches',
        isActive: true,
        productCount: 3,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockCategoriesData,
      }),
    });

    const categories = await catalogService.getCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].slug).toBe('watches');
    expect(categories[0].productCount).toBe(3);
  });

  it('getProducts maps paginated backend envelope', async () => {
    const mockProductsData = {
      products: [
        {
          productId: 'prod-1',
          sku: 'VAR-W-01',
          nameAr: 'ساعة',
          nameEn: 'Watch',
          price: 1200,
          stockQuantity: 10,
          reservedQuantity: 2,
          availableStock: 8,
          isActive: true,
          images: [],
        },
      ],
      totalElements: 42,
      totalPages: 5,
      currentPage: 0,
      pageSize: 10,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockProductsData,
      }),
    });

    const result = await catalogService.getProducts({ categorySlug: 'watches', searchQuery: 'ساعة' });
    expect(result.products).toHaveLength(1);
    expect(result.products[0].slug).toBe('VAR-W-01');
    expect(result.products[0].availableStock).toBe(8);
    expect(result.total).toBe(42);
  });

  it('getProductBySlug fetches product detail and returns null on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        status: 404,
        error: 'Not Found',
        message: 'المنتج غير موجود',
      }),
    });

    const product = await catalogService.getProductBySlug('NONEXISTENT');
    expect(product).toBeNull();
  });

  it('getBestSellers calls /products/best-sellers', async () => {
    const mockBestSellers = [
      {
        productId: 'prod-best-1',
        sku: 'VAR-BEST-01',
        nameAr: 'أكثر مبيعاً',
        nameEn: 'Best Seller',
        price: 990,
        stockQuantity: 15,
        reservedQuantity: 0,
        availableStock: 15,
        isActive: true,
        images: [],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockBestSellers,
      }),
    });

    const bestSellers = await catalogService.getBestSellers(4);
    expect(bestSellers).toHaveLength(1);
    expect(bestSellers[0].sku).toBe('VAR-BEST-01');
  });
});
