import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  captureUtmParameters,
  getStoredUtmParameters,
  clearStoredUtmParameters,
  UTM_STORAGE_KEY,
} from '../utm';

describe('UTM Attribution Tracking Utility', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('captures and sanitizes UTM parameters from search string into sessionStorage', () => {
    const search = '?utm_source=meta_ads&utm_medium=cpc&utm_campaign=winter_drop_2026&utm_content=carousel_v1';
    const captured = captureUtmParameters(search);

    expect(captured).not.toBeNull();
    expect(captured?.utm_source).toBe('meta_ads');
    expect(captured?.utm_medium).toBe('cpc');
    expect(captured?.utm_campaign).toBe('winter_drop_2026');
    expect(captured?.utm_content).toBe('carousel_v1');
    expect(captured?.capturedAt).toBeDefined();

    // Verify persisted in sessionStorage
    const stored = getStoredUtmParameters();
    expect(stored?.utm_source).toBe('meta_ads');
    expect(stored?.utm_campaign).toBe('winter_drop_2026');
  });

  it('returns null and does not overwrite existing UTMs if current query has no UTMs', () => {
    // Initial UTM visit
    captureUtmParameters('?utm_source=google&utm_medium=organic');
    expect(getStoredUtmParameters()?.utm_source).toBe('google');

    // Subsequent internal navigation without UTMs
    const captured = captureUtmParameters('?category=wallets');
    expect(captured).toBeNull();

    // Prior UTM remains intact
    expect(getStoredUtmParameters()?.utm_source).toBe('google');
  });

  it('handles QuotaExceededError or sessionStorage failures gracefully without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      captureUtmParameters('?utm_source=tiktok');
    }).not.toThrow();
  });

  it('clears stored UTM parameters successfully', () => {
    captureUtmParameters('?utm_source=instagram');
    expect(getStoredUtmParameters()?.utm_source).toBe('instagram');

    clearStoredUtmParameters();
    expect(getStoredUtmParameters()).toBeNull();
  });
});
