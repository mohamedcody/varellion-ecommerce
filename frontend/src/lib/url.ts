/**
 * Canonical Site Base URL Helper for VARELLION
 * Resolves the base site URL from environment variables with fallback to production domain.
 * Strips any trailing slashes to prevent malformed double-slash URLs.
 */
export function getBaseSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://varellion.com';
  return envUrl.trim().replace(/\/+$/, '');
}

/**
 * Convenient alias for getBaseSiteUrl
 */
export const getBaseUrl = getBaseSiteUrl;
