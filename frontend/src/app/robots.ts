import type { MetadataRoute } from 'next';
import { getBaseSiteUrl } from '@/lib/url';

/**
 * Next.js 15 Robots Metadata Route
 * Configures crawler access for standard search engines and AI discovery bots
 * while protecting private administrative, checkout, and customer account routes.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();

  return {
    rules: [
      {
        userAgent: [
          'OAI-SearchBot',
          'PerplexityBot',
          'Claude-SearchBot',
          'Claude-User',
          'Google-Extended',
          '*',
        ],
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/actuator',
          '/actuator/*',
          '/checkout',
          '/checkout/*',
          '/profile',
          '/profile/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
