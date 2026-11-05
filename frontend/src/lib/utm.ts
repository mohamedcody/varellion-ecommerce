/**
 * Client-Side Marketing Attribution (UTM Parameters) Utility.
 * Captures and persists campaign attribution parameters in sessionStorage
 * so ad ROAS and conversion metrics are preserved across navigation and checkout.
 */

export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  capturedAt?: string;
}

export const UTM_STORAGE_KEY = 'varellion_utm';

const UTM_KEYS: (keyof Omit<UtmParameters, 'capturedAt'>)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

/**
 * Sanitizes a query parameter value to prevent script injection and limit length.
 */
function sanitizeParam(val: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim().slice(0, 100);
  return trimmed ? trimmed.replace(/[<>'"`;]/g, '') : undefined;
}

/**
 * Extracts UTM parameters from a search query string or current location,
 * persisting them to sessionStorage if any UTM parameters are detected.
 */
export function captureUtmParameters(searchString?: string): UtmParameters | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const query = searchString !== undefined ? searchString : window.location.search;
  if (!query || !query.includes('utm_')) {
    return null;
  }

  try {
    const params = new URLSearchParams(query);
    const captured: UtmParameters = {};
    let hasUtm = false;

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      const sanitized = sanitizeParam(val);
      if (sanitized) {
        captured[key] = sanitized;
        hasUtm = true;
      }
    }

    if (!hasUtm) {
      return null;
    }

    captured.capturedAt = new Date().toISOString();

    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
    } catch (storageErr) {
      console.warn('[utm] Failed to persist UTM params to sessionStorage:', storageErr);
    }

    return captured;
  } catch (err) {
    console.warn('[utm] Error parsing UTM query parameters:', err);
    return null;
  }
}

/**
 * Retrieves previously persisted UTM parameters from sessionStorage.
 */
export function getStoredUtmParameters(): UtmParameters | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UtmParameters;
  } catch {
    return null;
  }
}

/**
 * Clears stored UTM parameters from sessionStorage.
 */
export function clearStoredUtmParameters(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    // Ignore storage deletion errors
  }
}
