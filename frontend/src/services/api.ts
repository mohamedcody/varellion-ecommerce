import { ApiResponse, Category, Product, ProductFilterParams, ShippingZone } from '@/types';
import { mockCategories, mockProducts, mockShippingZones } from '@/data/mockProducts';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false'; // default to true in dev for catalog if backend catalog skeletons are empty

/**
 * Standardized API Error carrying HTTP status and backend validation errors
 */
export class ApiError extends Error {
  status: number;
  errorData?: unknown;
  validationErrors?: Record<string, string>;

  constructor(message: string, status: number, errorData?: unknown, validationErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorData = errorData;
    this.validationErrors = validationErrors;
  }
}

/**
 * Robust Endpoint URL builder preventing duplicate or missing '/api' segments
 */
export function buildEndpointUrl(endpoint: string): string {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (API_BASE_URL.endsWith('/api') && clean.startsWith('/api/')) {
    return `${API_BASE_URL}${clean.slice(4)}`;
  }
  return `${API_BASE_URL}${clean}`;
}

/**
 * Universal safe fetcher with credentials support for HTTP cookies and direct type T
 */
export async function requestApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildEndpointUrl(endpoint);

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message || `API request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorData, errorData?.validationErrors);
  }

  return await res.json();
}

/**
 * Legacy fetcher for ApiResponse<T> wrapped payloads (catalog endpoints)
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    return await requestApi<ApiResponse<T>>(endpoint, options);
  } catch (error) {
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
    const cleanSlug = decodeURIComponent(slug || '').trim().toLowerCase();
    if (!cleanSlug) return null;

    if (USE_MOCK) {
      const product = mockProducts.find(
        (p) =>
          p.slug.toLowerCase() === cleanSlug ||
          p.sku.toLowerCase() === cleanSlug ||
          p.productId.toLowerCase() === cleanSlug
      );
      return product ? { ...product } : null;
    }

    try {
      const res = await fetchApi<Product>(`/products/${encodeURIComponent(cleanSlug)}`);
      return res.data;
    } catch {
      const product = mockProducts.find(
        (p) =>
          p.slug.toLowerCase() === cleanSlug ||
          p.sku.toLowerCase() === cleanSlug ||
          p.productId.toLowerCase() === cleanSlug
      );
      return product ? { ...product } : null;
    }
  },

  /**
   * Fetch best-selling products for showcase
   */
  async getBestSellers(limit: number = 4): Promise<Product[]> {
    const res = await this.getProducts({ isBestSeller: true, limit });
    return res.products.slice(0, limit);
  },

  /**
   * Fetch featured products for showcase
   */
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    const res = await this.getProducts({ isFeatured: true, limit });
    return res.products.slice(0, limit);
  },

  /**
   * Fetch Egyptian shipping zones and fees
   */
  async getShippingZones(): Promise<ShippingZone[]> {
    return [...mockShippingZones];
  },

  /**
   * Calculate shipping fee by governorate
   */
  calculateShippingFee(governorate: string): number {
    const trimmed = governorate.trim();
    for (const zone of mockShippingZones) {
      if (zone.governorates.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
        return zone.fee;
      }
    }
    return 60; // default baseline for Egypt
  },
};
