# Architecture Decision Records (ADR) — VARELLION Frontend

## ADR-001: Next.js App Router for Unified Storefront & Admin Dashboard
- **Status:** APPROVED
- **Context:** VARELLION requires both a public-facing luxury e-commerce storefront and a comprehensive back-office admin dashboard. Maintaining two separate repositories adds deployment complexity, duplicate types, and synchronization overhead.
- **Decision:** Adopt a single Next.js App Router application with Route Groups:
  - `src/app/[locale]/(storefront)/...` for public customer experience.
  - `src/app/[locale]/(checkout)/...` for distraction-free cart & checkout.
  - `src/app/[locale]/(auth)/...` for authentication flows.
  - `src/app/[locale]/(admin)/...` for staff dashboard and management.
- **Consequences:** Code reuse for UI primitives, single build pipeline, unified authentication state and types, zero-drift DTOs.

## ADR-002: Styling Architecture & Design Token System
- **Status:** APPROVED
- **Context:** The brand identity specifies a masculine, premium aesthetic (Watches & Leather Goods) with dark teal (`#12363B`), warm neutrals (`#F8FAFA`, `#1C2426`), and gold/emerald accents, strictly avoiding neon or cluttered visuals.
- **Decision:** Use Tailwind CSS with CSS custom properties defined in `globals.css` and mapped to Tailwind colors. All components consume semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.) aligned with Shadcn UI conventions.
- **Consequences:** Theme consistency, easy maintenance, zero runtime CSS-in-JS performance penalty, clean light-mode foundation with future dark-mode readiness.

## ADR-003: Type-Safe API Client with Spring Boot 3.3.4 Integration
- **Status:** APPROVED
- **Context:** The backend is a Modular Monolith in Spring Boot 3.3.4 with PostgreSQL on Supabase, featuring JWT authentication, Google OAuth 2.0 verification, rate limiting, and RESTful catalog/order endpoints.
- **Decision:** Build a centralized `api-client.ts` layer with Axios/Fetch, handling:
  - Bearer token injection for protected endpoints.
  - Automatic 401 handling with refresh token rotation.
  - Unified error mapping matching backend `ErrorResponse` and `ApiResponse<T>`.
  - Development mock fallback toggle (`NEXT_PUBLIC_USE_MOCK_API=true|false`).
- **Consequences:** Clear boundary between UI and network requests, zero guesswork, full TypeScript type safety across frontend and backend.

## ADR-004: Optimistic UI for Cart Interactions
- **Status:** APPROVED
- **Context:** Customers expect immediate response when adding items to the cart or altering quantities. Server latency degrades perceived speed and reduces conversions.
- **Decision:** Follow the Vercel Commerce pattern: update local cart state immediately upon interaction (Optimistic UI), roll back if backend request fails, and sync with database for authenticated users while storing guest carts in `localStorage`.
- **Consequences:** Instantaneous customer feedback (0ms perceived lag), higher checkout initiation rate.

## ADR-005: 27 Egyptian Governorates Regional Shipping Engine
- **Status:** APPROVED
- **Context:** VARELLION targets the Egyptian market exclusively in the initial release. Shipping costs and delivery times vary by geography.
- **Decision:** Implement a 4-tier regional shipping calculator covering all 27 governorates:
  - Zone 1: Greater Cairo (Cairo, Giza, Qalyubia) — 50 EGP (24-48h).
  - Zone 2: Alexandria, Delta & Canal — 65 EGP (2-3 days).
  - Zone 3: Upper Egypt — 80 EGP (3-4 days).
  - Zone 4: Frontier & Remote (Sinai, Red Sea, Matrouh, New Valley) — 100 EGP (4-5 days).
- **Consequences:** Transparent pricing, accurate total calculation, reduced customer checkout friction.
