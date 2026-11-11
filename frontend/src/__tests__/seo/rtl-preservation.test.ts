import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { metadata } from '@/app/layout';

describe('Arabic RTL & Typography Preservation (rtl-preservation.test.ts)', () => {
  const possibleLayoutPaths = [
    path.resolve(process.cwd(), 'src/app/layout.tsx'),
    path.resolve(process.cwd(), 'frontend/src/app/layout.tsx'),
    path.resolve(__dirname, '../../app/layout.tsx'),
  ];
  const layoutPath = possibleLayoutPaths.find((p) => fs.existsSync(p));

  const possibleCssPaths = [
    path.resolve(process.cwd(), 'src/styles/globals.css'),
    path.resolve(process.cwd(), 'frontend/src/styles/globals.css'),
    path.resolve(__dirname, '../../styles/globals.css'),
  ];
  const cssPath = possibleCssPaths.find((p) => fs.existsSync(p));

  describe('Root Layout (layout.tsx) Structure', () => {
    it('locates layout.tsx in the project', () => {
      expect(
        layoutPath,
        `layout.tsx should exist at one of: ${possibleLayoutPaths.join(', ')}`
      ).toBeDefined();
    });

    it('enforces Arabic language (lang="ar") and Right-to-Left direction (dir="rtl") on html tag', () => {
      const content = fs.readFileSync(layoutPath!, 'utf-8');

      // Assert html tag has lang="ar" and dir="rtl"
      expect(content).toMatch(/<html[^>]*lang=["']ar["']/);
      expect(content).toMatch(/<html[^>]*dir=["']rtl["']/);
    });

    it('imports Tajawal and Cinzel fonts in head', () => {
      const content = fs.readFileSync(layoutPath!, 'utf-8');

      expect(content).toContain('Cinzel');
      expect(content).toContain('Tajawal');
      expect(content).toContain('preconnect');
    });

    it('embeds JSON-LD structured data scripts in root layout', () => {
      const content = fs.readFileSync(layoutPath!, 'utf-8');

      expect(content).toMatch(/<JsonLd[^>]*data=\{organizationSchema\}/);
      expect(content).toMatch(/<JsonLd[^>]*data=\{webSiteSchema\}/);
    });

    it('includes accessible skip to main content link for screen readers', () => {
      const content = fs.readFileSync(layoutPath!, 'utf-8');

      expect(content).toContain('href="#main-content"');
      expect(content).toContain('الانتقال إلى المحتوى الرئيسي');
    });
  });

  describe('Root Metadata Object (metadata in layout.tsx)', () => {
    it('configures metadataBase as a valid URL pointing to canonical site URL', () => {
      expect(metadata).toBeDefined();
      expect(metadata.metadataBase).toBeDefined();
      expect(metadata.metadataBase).toBeInstanceOf(URL);
      expect(metadata.metadataBase?.origin).toBe('https://varellion.com');
    });

    it('contains brand-defining Arabic title and description with key value propositions', () => {
      expect(metadata.title).toBeDefined();
      expect(String(metadata.title)).toContain('VARELLION');
      expect(String(metadata.title)).toContain('الساعات والمصنوعات الجلدية');

      expect(metadata.description).toBeDefined();
      expect(metadata.description).toContain('27 محافظة');
      expect(metadata.description).toContain('معاينة قبل الاستلام');
    });
  });

  describe('Global Typography & Color Tokens (globals.css)', () => {
    it('defines Tajawal and Cinzel CSS font variables in globals.css', () => {
      expect(
        cssPath,
        `globals.css should exist at one of: ${possibleCssPaths.join(', ')}`
      ).toBeDefined();

      const css = fs.readFileSync(cssPath!, 'utf-8');

      expect(css).toContain('--font-tajawal');
      expect(css).toContain('--font-cinzel');
      expect(css).toMatch(/font-family:\s*var\(--font-tajawal\)/);
    });

    it('defines obsidian, ivory, and luxury gold color tokens in theme', () => {
      const css = fs.readFileSync(cssPath!, 'utf-8');

      expect(css).toContain('--gold-500');
      expect(css).toContain('--gold-700');
      expect(css).toContain('--obsidian-950');
      expect(css).toContain('--ivory-50');
    });
  });
});
