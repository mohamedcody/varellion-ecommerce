import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import robots from '@/app/robots';

describe('Next.js Robots Metadata Route (robots.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports a function that returns a valid Next.js MetadataRoute.Robots structure', () => {
    const config = robots();

    expect(config).toBeDefined();
    expect(config).toHaveProperty('rules');
    expect(config).toHaveProperty('sitemap');
    expect(Array.isArray(config.rules)).toBe(true);
  });

  it('configures permissions for standard search crawlers and AI bots', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

    // Find rules covering all userAgents or check single unified rule
    const allUserAgents = rules.flatMap((rule) =>
      Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]
    );

    const requiredBots = [
      'OAI-SearchBot',
      'PerplexityBot',
      'Claude-SearchBot',
      'Google-Extended',
      '*',
    ];

    for (const bot of requiredBots) {
      expect(
        allUserAgents,
        `Expected crawler userAgent "${bot}" to be explicitly included in robots rules`
      ).toContain(bot);
    }
  });

  it('allows crawling on the root path for permitted userAgents', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

    const hasRootAllow = rules.some((rule) => {
      const allows = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
      return allows.includes('/');
    });

    expect(hasRootAllow).toBe(true);
  });

  it('strictly disallows private routes (/admin, /checkout, /profile)', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

    const allDisallows = rules.flatMap((rule) =>
      Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    );

    const requiredDisallows = [
      '/admin',
      '/admin/*',
      '/checkout',
      '/checkout/*',
      '/profile',
      '/profile/*',
    ];

    for (const path of requiredDisallows) {
      expect(
        allDisallows,
        `Expected private path "${path}" to be disallowed in robots.txt`
      ).toContain(path);
    }
  });

  it('points sitemap URL to the canonical sitemap.xml with default fallback domain', () => {
    const config = robots();
    expect(config.sitemap).toBe('https://varellion.com/sitemap.xml');
  });

  it('resolves dynamic sitemap URL from NEXT_PUBLIC_SITE_URL environment variable', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.varellion.com';
    const config = robots();
    expect(config.sitemap).toBe('https://preview.varellion.com/sitemap.xml');
  });

  it('resolves dynamic sitemap URL from SITE_URL environment variable with trailing slash sanitized', () => {
    process.env.SITE_URL = 'https://custom-domain.com///';
    const config = robots();
    expect(config.sitemap).toBe('https://custom-domain.com/sitemap.xml');
  });
});
