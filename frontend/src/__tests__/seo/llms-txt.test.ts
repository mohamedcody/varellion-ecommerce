import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('LLMs.txt Discovery File (frontend/public/llms.txt)', () => {
  // Resolve llms.txt path regardless of whether vitest is executed from repo root or frontend/
  const possiblePaths = [
    path.resolve(process.cwd(), 'public/llms.txt'),
    path.resolve(process.cwd(), 'frontend/public/llms.txt'),
    path.resolve(__dirname, '../../../../public/llms.txt'),
  ];

  const llmsFilePath = possiblePaths.find((p) => fs.existsSync(p));

  it('exists in the frontend public directory', () => {
    expect(
      llmsFilePath,
      `llms.txt should exist at one of: ${possiblePaths.join(', ')}`
    ).toBeDefined();
    expect(fs.existsSync(llmsFilePath!)).toBe(true);
  });

  it('reads as valid markdown with standard llms.txt structure', () => {
    const content = fs.readFileSync(llmsFilePath!, 'utf-8');

    expect(content.length).toBeGreaterThan(500);

    // Standard llms.txt starts with H1 title
    expect(content).toMatch(/^#\s+VARELLION/m);

    // Contains blockquote summary description
    expect(content).toMatch(/^>\s+/m);

    // Contains structured H2 sections
    expect(content).toMatch(/^##\s+Brand & Company Overview/m);
    expect(content).toMatch(/^##\s+Currency & Pricing Context/m);
    expect(content).toMatch(/^##\s+Customer Guarantees & Buying Policies/m);
    expect(content).toMatch(/^##\s+Key Links & Collections/m);
    expect(content).toMatch(/^##\s+Contact & Customer Support/m);
  });

  it('articulates VARELLION brand statements and craftsmanship in Egyptian market', () => {
    const content = fs.readFileSync(llmsFilePath!, 'utf-8');

    // Brand and tagline
    expect(content).toMatch(/Everyday Masculine Luxury/i);
    expect(content).toMatch(/الفخامة الرجالية اليومية/);

    // Product line details
    expect(content).toMatch(/316L/); // Stainless steel grade
    expect(content).toMatch(/sapphire crystal/i);
    expect(content).toMatch(/100%\s+(?:genuine|full-grain)/i);
    expect(content).toMatch(/RFID/i);
    expect(content).toMatch(/Cairo,\s*Egypt/i);
  });

  it('explicitly states Egyptian Pound (EGP) currency and pricing rules', () => {
    const content = fs.readFileSync(llmsFilePath!, 'utf-8');

    // EGP and Arabic currency symbols
    expect(content).toMatch(/Egyptian Pound/i);
    expect(content).toMatch(/EGP/);
    expect(content).toMatch(/ج\.م/);

    // Pricing mentions with numerical ranges in EGP
    expect(content).toMatch(/\d+[\s,]*\d*\s*EGP/i);
  });

  it('clearly communicates core customer policies (inspection, 27 governorates, COD, 24-72h)', () => {
    const content = fs.readFileSync(llmsFilePath!, 'utf-8');

    // Inspection before payment in Arabic verbatim
    expect(content).toContain('معاينة وفحص قبل الاستلام');

    // Nationwide 27 governorates delivery
    expect(content).toMatch(/27\s+(?:Egyptian\s+)?governorates/i);

    // Cash on Delivery
    expect(content).toMatch(/Cash on Delivery/i);
    expect(content).toMatch(/COD/i);

    // Delivery timeframe: 24 to 72 hours (or 24-48h for Cairo)
    expect(content).toMatch(/24\s*(?:to|-)\s*(?:48|72)\s*hours?/i);

    // 14-day return guarantee & Egyptian consumer protection law
    expect(content).toMatch(/14-Day/i);
    expect(content).toMatch(/حماية المستهلك/);
  });

  it('contains valid markdown links to store collections and policy pages', () => {
    const content = fs.readFileSync(llmsFilePath!, 'utf-8');

    // Extract all [anchor](url) links
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
    const links: { text: string; url: string }[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({ text: match[1], url: match[2] });
    }

    expect(links.length).toBeGreaterThanOrEqual(6);

    const urls = links.map((l) => l.url);

    // Core catalog and policies must be linked
    expect(urls.some((u) => u.includes('varellion.com') || u.startsWith('/'))).toBe(true);
    expect(urls.some((u) => u.includes('/products'))).toBe(true);
    expect(urls.some((u) => u.includes('/policies/shipping'))).toBe(true);
    expect(urls.some((u) => u.includes('/policies/returns'))).toBe(true);
    expect(urls.some((u) => u.includes('/policies/terms'))).toBe(true);
    expect(urls.some((u) => u.includes('/track-order'))).toBe(true);

    // Ensure all links have descriptive anchor text
    for (const link of links) {
      expect(link.text.trim().length).toBeGreaterThan(0);
      expect(link.url).toMatch(/^https?:\/\/varellion\.com/);
    }
  });
});
