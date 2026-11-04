import { ApiResponse, Category, Product, ProductFilterParams, ShippingZone } from '@/types';
import { mockCategories, mockProducts, mockShippingZones } from '@/data/mockProducts';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'; // Default to false: Backend-Driven Architecture

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

let inMemoryAccessToken: string | null = null;
let accessTokenGetter: (() => string | null) | null = null;
let onAuthExpiredCallback: (() => void) | null = null;
let tokenRefreshHandler: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function setAccessTokenGetter(fn: () => string | null): void {
  accessTokenGetter = fn;
}

export function setOnAuthExpired(fn: () => void): void {
  onAuthExpiredCallback = fn;
}

export function setTokenRefreshHandler(fn: () => Promise<string | null>): void {
  tokenRefreshHandler = fn;
}

export interface RequestApiOptions extends RequestInit {
  timeoutMs?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  endpoint: string;
  options?: RequestApiOptions;
}

let isRefreshing = false;
let refreshQueue: PendingRequest[] = [];

function processQueue(error: unknown | null, newToken: string | null = null) {
  refreshQueue.forEach((req) => {
    if (error) {
      req.reject(error);
    } else {
      const replayedHeaders: Record<string, string> = {
        ...(req.options?.headers as Record<string, string> || {}),
      };
      if (newToken) {
        replayedHeaders['Authorization'] = `Bearer ${newToken}`;
      }
      requestApi(req.endpoint, { ...req.options, headers: replayedHeaders })
        .then(req.resolve)
        .catch(req.reject);
    }
  });
  refreshQueue = [];
}

/**
 * Universal safe fetcher with credentials support for HTTP cookies and direct type T
 */
export async function requestApi<T>(endpoint: string, options?: RequestApiOptions): Promise<T> {
  const url = buildEndpointUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const token = inMemoryAccessToken ?? accessTokenGetter?.();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Network timeout safety (30 seconds timeout fallback linked with caller signal)
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let signal: AbortSignal;
  if (options?.signal) {
    if (typeof AbortSignal.any === 'function') {
      signal = AbortSignal.any([controller.signal, options.signal]);
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      signal = controller.signal;
    }
  } else {
    signal = controller.signal;
  }

  let res: Response;
  try {
    const { signal: _callerSignal, timeoutMs: _timeoutMs, headers: _optionsHeaders, ...restOptions } = options || {};
    res = await fetch(url, {
      ...restOptions,
      credentials: 'include',
      headers,
      signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      if (options?.signal?.aborted) {
        throw err;
      }
      throw new ApiError('Request timeout: Server took too long to respond', 408);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    const isAuthRoute =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/logout');

    if (!isAuthRoute) {
      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push({
            resolve: resolve as (val: unknown) => void,
            reject,
            endpoint,
            options,
          });
        });
      }

      isRefreshing = true;

      try {
        let freshToken: string | null = null;
        if (tokenRefreshHandler) {
          freshToken = await tokenRefreshHandler();
        } else {
          const refreshRes = await requestApi<{ accessToken: string }>('/auth/refresh', {
            method: 'POST',
          });
          freshToken = refreshRes.accessToken;
        }

        isRefreshing = false;
        if (freshToken) {
          setAccessToken(freshToken);
        }
        processQueue(null, freshToken);

        const replayedHeaders: Record<string, string> = {
          ...(options?.headers as Record<string, string> || {}),
        };
        if (freshToken) {
          replayedHeaders['Authorization'] = `Bearer ${freshToken}`;
        }
        return await requestApi<T>(endpoint, { ...options, headers: replayedHeaders });
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);
        onAuthExpiredCallback?.();
        const errorData = await res.json().catch(() => null);
        throw new ApiError(errorData?.message || 'Authentication session expired', 401, errorData);
      }
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message || `API request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorData, errorData?.validationErrors);
  }

  if (res.status === 204) {
    return {} as T;
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
 * Maps backend ProductDto into frontend Product domain model
 */
export function mapProductDto(dto: any): Product {
  if (!dto) throw new Error('Null product DTO');
  return {
    productId: dto.productId,
    categoryId: dto.categoryId,
    category: dto.categorySlug ? {
      categoryId: dto.categoryId,
      slug: dto.categorySlug,
      nameAr: dto.categoryNameAr || '',
      nameEn: dto.categoryNameEn || '',
      isActive: true,
    } : undefined,
    slug: dto.sku || dto.productId,
    sku: dto.sku,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn,
    descriptionAr: dto.descriptionAr || '',
    descriptionEn: dto.descriptionEn || '',
    price: typeof dto.price === 'number' ? dto.price : parseFloat(dto.price || '0'),
    costPrice: dto.costPrice ? (typeof dto.costPrice === 'number' ? dto.costPrice : parseFloat(dto.costPrice)) : undefined,
    stockQuantity: dto.stockQuantity ?? dto.availableStock ?? 0,
    reservedQuantity: dto.reservedQuantity ?? 0,
    availableStock: dto.availableStock !== undefined
      ? dto.availableStock
      : Math.max(0, (dto.stockQuantity ?? 0) - (dto.reservedQuantity ?? 0)),
    isActive: dto.isActive ?? true,
    isFeatured: dto.isFeatured,
    isBestSeller: dto.isBestSeller,
    images: (dto.images || []).map((img: any) => ({
      imageId: img.imageId,
      productId: dto.productId,
      imageUrl: img.imageUrl,
      isMain: !!img.isMain,
      displayOrder: img.displayOrder ?? 0,
    })),
    createdAt: dto.createdAt,
  };
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

    const res = await fetchApi<Category[]>('/categories');
    return res.data || [];
  },

  /**
   * Fetch products with optional filters, pagination, and sorting
   */
  async getProducts(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    if (USE_MOCK) {
      let filtered = [...mockProducts].filter((p) => p.isActive);

      if (params?.categorySlug && params.categorySlug !== 'all') {
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

    const query = new URLSearchParams();
    if (params?.categorySlug && params.categorySlug !== 'all') query.append('category', params.categorySlug);
    if (params?.searchQuery) query.append('q', params.searchQuery.trim());
    if (params?.sortBy) query.append('sort', params.sortBy);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());

    const res = await fetchApi<{
      products: any[];
      totalElements: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }>(`/products${query.toString() ? `?${query.toString()}` : ''}`);

    const data = res.data;
    return {
      products: (data.products || []).map(mapProductDto),
      total: data.totalElements ?? data.products?.length ?? 0,
    };
  },

  /**
   * Fetch single product by slug or SKU or UUID
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const cleanSlug = decodeURIComponent(slug || '').trim();
    if (!cleanSlug) return null;

    if (USE_MOCK) {
      const product = mockProducts.find(
        (p) =>
          p.slug.toLowerCase() === cleanSlug.toLowerCase() ||
          p.sku.toLowerCase() === cleanSlug.toLowerCase() ||
          p.productId.toLowerCase() === cleanSlug.toLowerCase()
      );
      return product ? { ...product } : null;
    }

    try {
      const res = await fetchApi<any>(`/products/${encodeURIComponent(cleanSlug)}`);
      return res.data ? mapProductDto(res.data) : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Fetch best-selling products for showcase
   */
  async getBestSellers(limit: number = 4): Promise<Product[]> {
    if (USE_MOCK) {
      const best = mockProducts.filter((p) => p.isBestSeller && p.isActive);
      return best.slice(0, limit);
    }

    const res = await fetchApi<any[]>(`/products/best-sellers?limit=${limit}`);
    return (res.data || []).map(mapProductDto);
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
