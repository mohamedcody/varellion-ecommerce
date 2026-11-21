# VARELLION Frontend — Testing & Quality Strategy

## 1. Principles
- Every feature must be verified against:
  1. Strict TypeScript type check (`npx tsc --noEmit`).
  2. Next.js build verification (`npm run build`).
  3. Responsive layout test across Mobile (375px), Tablet (768px), and Desktop (1280px+).
  4. Web Design & Accessibility Guidelines (WCAG 2.1 AA compliance).
  5. Error, loading, and empty state verification.

## 2. Automated Checks
- **TypeScript Check:** Run `npx tsc --noEmit` in `frontend/` on every feature step. Zero type errors allowed (`strict: true`, `noImplicitAny: true`).
- **Production Build:** Run `npm run build` at the end of each phase.
- **Linting:** ESLint with Next.js core web vitals and React hooks rules.

## 3. UI/UX & Conversion Checks
- **3-Second Rule Test:** Above-the-fold content must communicate brand name, category offerings, starting price, and trust signals without requiring any scroll.
- **Friction Test:** Add to cart must require at most 1 click from product card, 0 reload.
- **Checkout Efficiency:** Form inputs must be constrained to the minimum required for Egyptian delivery (Name, Phone number, Governorate, Area/City, Detailed Address).
