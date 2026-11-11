import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductCard } from '../ProductCard';
import { Product } from '@/types';

const mockAddItem = vi.fn();

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}));

describe('ProductCard - Multi-image preview and interactive gestures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProductWithMultipleImages: Product = {
    productId: 'prod-1',
    categoryId: 'cat-1',
    sku: 'VAR-W-001',
    nameAr: 'ساعة فارليون كرونوغراف أوبسيديان',
    nameEn: 'Varellion Obsidian Chronograph',
    slug: 'varellion-obsidian-chronograph',
    descriptionAr: 'ساعة يد رجالية فاخرة بإطار من الستانلس ستيل 316L المقاوم للصدأ.',
    descriptionEn: 'Luxury mens watch with 316L stainless steel frame.',
    price: 3850,
    stockQuantity: 10,
    reservedQuantity: 2,
    availableStock: 8,
    category: {
      categoryId: 'cat-1',
      nameAr: 'ساعات يد',
      nameEn: 'Watches',
      slug: 'watches',
      isActive: true,
    },
    images: [
      {
        imageId: 'img-1',
        imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
        altAr: 'ساعة فارليون واجهة رئيسية',
        isMain: true,
        displayOrder: 1,
      },
      {
        imageId: 'img-2',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
        altAr: 'ساعة فارليون زاوية جانبية',
        isMain: false,
        displayOrder: 2,
      },
    ],
    isActive: true,
  };

  it('renders product information and adds item to cart when clicked', () => {
    render(<ProductCard product={mockProductWithMultipleImages} />);

    expect(screen.getByText('ساعة فارليون كرونوغراف أوبسيديان')).toBeDefined();
    expect(screen.getByText(/٣[٬,]٨٥٠|3,850/)).toBeDefined();

    const addBtn = screen.getByRole('button', { name: /إضافة.*إلى سلة المشتريات/i });
    fireEvent.click(addBtn);

    expect(mockAddItem).toHaveBeenCalledWith(mockProductWithMultipleImages, 1);
  });

  it('renders interactive dot indicators when product has multiple images', () => {
    render(<ProductCard product={mockProductWithMultipleImages} />);

    const dots = screen.getAllByRole('button', { name: /عرض صورة/i });
    expect(dots.length).toBe(2);
  });

  it('switches active image when dot indicator is clicked without navigating', () => {
    render(<ProductCard product={mockProductWithMultipleImages} />);

    const dots = screen.getAllByRole('button', { name: /عرض صورة/i });
    const secondDot = dots[1];

    fireEvent.click(secondDot);

    // Active image indicator should now be active for the second dot
    expect(secondDot.getAttribute('aria-current')).toBe('true');
  });

  it('ensures dot buttons are not nested inside link elements (WCAG 4.1.2)', () => {
    render(<ProductCard product={mockProductWithMultipleImages} />);

    const dots = screen.getAllByRole('button', { name: /عرض صورة/i });
    for (const dot of dots) {
      expect(dot.closest('a')).toBeNull();
    }
  });
});
