/**
 * VARELLION TypeScript Domain Model & Data Contracts
 * Matched 1:1 with PostgreSQL Schema & Spring Boot 3.3.4 Backend DTOs
 */

// ============================================================================
// 1. Generic Backend Response Envelopes
// ============================================================================

export interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
}

// ============================================================================
// 2. Catalog & Products (public.categories, public.products, public.product_images)
// ============================================================================

export interface Category {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount?: number;
}

export interface ProductImage {
  imageId: string;
  productId?: string;
  imageUrl: string;
  isMain: boolean;
  displayOrder: number;
  altAr?: string;
  altEn?: string;
}

export interface Product {
  productId: string;
  categoryId: string;
  category?: Category;
  slug: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number; // in EGP
  previousPrice?: number; // for discount badges (e.g. 2400 EGP was 2800 EGP)
  costPrice?: number;
  stockQuantity: number;
  reservedQuantity: number;
  availableStock: number; // calculated: stockQuantity - reservedQuantity
  isActive: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  badge?: string; // e.g. "الأكثر طلباً", "جلد طبيعي", "إصدار حصري"
  rating?: number; // e.g. 4.9
  reviewCount?: number; // e.g. 128
  images: ProductImage[];
  specifications?: Record<string, string>; // e.g. { "نوع المينا": "فولاذ مقاوم للصدأ 316L", "مقاومة الماء": "50 متر" }
  colors?: { nameAr: string; hex: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilterParams {
  categorySlug?: string;
  categoryId?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  inStockOnly?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'bestseller' | 'rating';
  page?: number;
  limit?: number;
}

// ============================================================================
// 3. Shopping Cart (public.carts, public.cart_items)
// ============================================================================

export interface CartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  addedAt: string;
}

export interface Cart {
  cartId?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number; // e.g. 2500 EGP
  amountForFreeShipping: number; // calculated: Math.max(0, threshold - subtotal)
}

// ============================================================================
// 4. Customers & Addresses (public.customers, public.customer_addresses)
// ============================================================================

export interface CustomerAddress {
  addressId?: string;
  governorate: string;
  cityArea: string;
  detailedAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface Customer {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  isActive: boolean;
  address?: CustomerAddress;
  createdAt?: string;
}

// ============================================================================
// 5. Orders & Egyptian Shipping Zones (public.orders, public.order_items)
// ============================================================================

export type OrderStatus =
  | 'PENDING_CUSTOMER_CONFIRMATION'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'RETURNED'
  | 'EXCHANGED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CARD' | 'INSTAPAY' | 'VODAFONE_CASH';

export interface ShippingZone {
  zoneId: string;
  zoneNameAr: string;
  zoneNameEn: string;
  governorates: string[];
  fee: number; // in EGP
  estimatedDeliveryAr: string;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  alternativePhone?: string;
  shippingGovernorate: string;
  shippingCityArea: string;
  shippingDetailedAddress: string;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  items: {
    productId: string;
    quantity: number;
    selectedColor?: string;
  }[];
}

export interface OrderItem {
  orderItemId: string;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Order {
  orderId: string;
  orderNumber: string; // e.g. VAR-20261027-0102
  customerName: string;
  customerPhone: string;
  shippingGovernorate: string;
  shippingCityArea: string;
  shippingDetailedAddress: string;
  currency: 'EGP';
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  adminNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
