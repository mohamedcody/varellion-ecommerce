import { ApiResponse, Category, Product, ProductFilterParams, ShippingZone } from '@/types';
import { mockCategories, mockProducts, mockShippingZones } from '@/data/mockProducts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false'; // default to true in dev

/**
 * Universal safe fetcher with typed ApiResponse<T>
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `API request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    // If backend is unreachable and we want a graceful mock fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API Client] Remote fetch to "${endpoint}" failed, falling back to mock fixtures.`, error);
    }
    throw error;
  }
}

/**
 * Catalog API Service Layer
 */
export const catalogService = {
  /**
   * Fetch all active categories
   */
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK) {
      return [...mockCategories];
    }

    try {
      const res = await fetchApi<Category[]>('/categories');
      return res.data;
    } catch {
      return [...mockCategories];
    }
  },

  /**
   * Fetch products with optional filters, pagination, and sorting
   */
  async getProducts(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    if (USE_MOCK) {
      let filtered = [...mockProducts].filter((p) => p.isActive);

      if (params?.categorySlug) {
        const cat = mockCategories.find((c) => c.slug === params.categorySlug);
        if (cat) {
          filtered = filtered.filter((p) => p.categoryId === cat.categoryId);
        }
      }

      if (params?.searchQuery) {
        const q = params.searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.nameAr.toLowerCase().includes(q) ||
            p.nameEn.toLowerCase().includes(q) ||
            p.descriptionAr.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
        );
      }

      if (params?.isBestSeller) {
        filtered = filtered.filter((p) => p.isBestSeller);
      }

      if (params?.isFeatured) {
        filtered = filtered.filter((p) => p.isFeatured);
      }

      if (params?.minPrice !== undefined) {
        filtered = filtered.filter((p) => p.price >= params.minPrice!);
      }

      if (params?.maxPrice !== undefined) {
        filtered = filtered.filter((p) => p.price <= params.maxPrice!);
      }

      if (params?.sortBy) {
        if (params.sortBy === 'price-asc') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (params.sortBy === 'price-desc') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (params.sortBy === 'rating') {
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
      }

      return {
        products: filtered,
        total: filtered.length,
      };
    }

    try {
      const query = new URLSearchParams();
      if (params?.categorySlug) query.append('category', params.categorySlug);
      if (params?.searchQuery) query.append('q', params.searchQuery);
      if (params?.isFeatured) query.append('featured', 'true');
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());

      const res = await fetchApi<{ products: Product[]; total: number }>(`/products?${query.toString()}`);
      return res.data;
    } catch {
      return { products: mockProducts, total: mockProducts.length };
    }
  },

  /**
   * Fetch single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (USE_MOCK) {
      const product = mockProducts.find((p) => p.slug === slug);
      return product ? { ...product } : null;
    }

    try {
      const res = await fetchApi<Product>(`/products/${slug}`);
      return res.data;
    } catch {
      const product = mockProducts.find((p) => p.slug === slug);
      return product ? { ...product } : null;
    }
  },

  /**
   * Fetch best-selling products for the homepage
   */
  async getBestSellers(limit: number = 4): Promise<Product[]> {
    const { products } = await this.getProducts({ isBestSeller: true });
    return products.slice(0, limit);
  },

  /**
   * Fetch featured products for the storefront showcase
   */
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    const { products } = await this.getProducts({ isFeatured: true });
    return products.slice(0, limit);
  },
};

/**
 * Egyptian Regional Shipping Service
 */
export const shippingService = {
  getAllZones(): ShippingZone[] {
    return mockShippingZones;
  },

  getZoneForGovernorate(governorate: string): ShippingZone {
    const cleanGov = governorate.trim();
    const found = mockShippingZones.find((zone) =>
      zone.governorates.some((g) => g.includes(cleanGov) || cleanGov.includes(g))
    );
    // Default to Greater Cairo or lowest zone if not explicitly matched
    return found || mockShippingZones[0];
  },

  calculateFee(governorate: string): number {
    return this.getZoneForGovernorate(governorate).fee;
  },
};
