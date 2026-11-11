import { cache } from 'react';
import { catalogService } from '@/services/api';
import { Product } from '@/types';

/**
 * Deduplicate product fetching between generateMetadata and ProductDetailPage
 */
export const getCachedProduct = cache(async (slug: string): Promise<Product | null> => {
  return await catalogService.getProductBySlug(slug);
});
