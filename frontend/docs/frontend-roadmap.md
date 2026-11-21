# VARELLION Frontend — Implementation Roadmap

> **Methodology:** Feature-by-Feature Build with Verification Gates  
> **Rule:** Implement only ONE atomic feature at a time. Run tests, type checks, and UI reviews before proceeding.  

---

## Phase Overview

| Phase | Title | Scope | Status |
|:---:|:---|:---|:---:|
| **Phase 0** | Discovery & Architecture Planning | Repositories, backend contracts, master build plan | **COMPLETED** |
| **Phase 1** | Project Foundation & Design Primitives | Next.js 15, TypeScript, Tailwind, Shadcn Primitives | **IN PROGRESS** |
| **Phase 2** | Shared Layouts & Navigation | Header, Footer, Mobile Drawer, Locale Routing (AR/EN) | NOT_STARTED |
| **Phase 3** | Storefront Homepage & 3-Second Conversion | Hero, 4 Trust Pillars, Categories, Best Sellers | NOT_STARTED |
| **Phase 4** | Catalog & Product Details | Product Grid, Faceted Filters, Product Details, Gallery | NOT_STARTED |
| **Phase 5** | Shopping Cart & Optimistic Interactions | Cart Context, Slide-over Cart Drawer, Cart Page | NOT_STARTED |
| **Phase 6** | Checkout, Shipping & Payment (Egypt) | One-Page Checkout, 27 Governorates, COD & Cards | NOT_STARTED |
| **Phase 7** | Admin Dashboard Shell & Authentication | Admin Protected Layout, Sidebar, Metrics Overview | NOT_STARTED |
| **Phase 8** | Admin Catalog & Inventory Management | Product CRUD, Stock Controls, Category Management | NOT_STARTED |
| **Phase 9** | Admin Orders, Customers & Analytics | Orders Table, Status Transitions, Customer Records | NOT_STARTED |
| **Phase 10** | QA, Accessibility, Performance & Launch Readiness | A11y Audit, Performance Audit, Security Review, Build | NOT_STARTED |

---

## Atomic Feature Breakdown

### Phase 1: Project Foundation & Design Primitives
- [ ] **F-101: Next.js 15 & TypeScript App Router Foundation**
  - Next.js 15 setup in `frontend/`, strict TypeScript configuration, base aliases (`@/*`).
- [ ] **F-102: Design Tokens & Global Theme Configuration**
  - Tailwind setup, CSS custom properties in `globals.css` matching VARELLION luxury palette.
- [ ] **F-103: Core UI Primitives (Buttons, Inputs, Badges, Cards)**
  - Shadcn-compatible `Button`, `Input`, `Badge`, `Card`, `Skeleton` with complete accessibility and state variants.
- [ ] **F-104: Overlay & Modal Primitives (Dialog, Sheet/Drawer, Dropdown)**
  - Radix/Shadcn-based `Sheet` (for Cart & Mobile Nav) and `Dialog` (for Quick View).

### Phase 2: Shared Layouts & Navigation
- [ ] **F-201: Internationalization & Locale Routing (Arabic RTL / English LTR)**
  - `next-intl` configuration, locale detection, RTL/LTR dynamic direction handling.
- [ ] **F-202: Premium Header Shell & Desktop Navigation**
  - Brand mark, Category links, Search bar trigger, Account trigger, Cart badge.
- [ ] **F-203: Mobile Touch Navigation Drawer**
  - Smooth slide-out menu with categories, currency, language switch, and quick contact.
- [ ] **F-204: Trust-Building Footer & Business Information**
  - Guarantee terms, Egypt delivery notice, customer care, social links, payment method badges.

### Phase 3: Storefront Homepage & 3-Second Conversion
- [ ] **F-301: Hero Section & Immediate Value Proposition**
  - High-impact visual banner, crystal-clear headline, dual CTAs ([تسوق الآن] / [استكشف الساعات]).
- [ ] **F-302: 4 Trust Pillars Bar (معاينة قبل الاستلام + دفع عند الاستلام + ضمان 14 يوم + شحن لجميع المحافظات)**
- [ ] **F-303: Category Visual Cards (ساعات، محافظ، إكسسوارات رجالية)**
- [ ] **F-304: Best-Sellers Product Showcase & Quick Action Cards**
- [ ] **F-305: Brand Story & Genuine Craftsmanship Banner**

### Phase 4: Catalog & Product Details
- [ ] **F-401: Product Listing Grid & Pagination**
- [ ] **F-402: Faceted Search, Filter & Sort Controls**
- [ ] **F-403: Product Details Page (PDP) & Image Gallery**
- [ ] **F-404: Product Variant Selector (Colors, Strap types, Leather finish)**
- [ ] **F-405: Quick-View Modal Overlay**

### Phase 5: Shopping Cart & Optimistic Interactions
- [ ] **F-501: Cart State Management (CartContext with LocalStorage Sync)**
- [ ] **F-502: Slide-Over Cart Drawer with Optimistic Updates**
- [ ] **F-503: Free Shipping Progress Meter & Upsell Triggers**
- [ ] **F-504: Dedicated Cart Review Page (`/cart`)**

### Phase 6: Checkout, Shipping & Payment (Egypt)
- [ ] **F-601: One-Page Checkout Form (Guest & Authenticated)**
- [ ] **F-602: Egypt 27 Governorates Selector & Dynamic Shipping Calculator**
- [ ] **F-603: Payment Gateway Selector (COD + Online Card / Wallets)**
- [ ] **F-604: Order Confirmation & Receipt Screen**
- [ ] **F-605: Guest Order Lookup & Tracking (`/track-order`)**

### Phase 7: Admin Dashboard Shell & Authentication
- [ ] **F-701: Protected Admin Route Guard & Role Verification (`ROLE_ADMIN`)**
- [ ] **F-702: Admin Collapsible Sidebar & Header Shell**
- [ ] **F-703: Executive Metrics Overview & KPI Cards**
- [ ] **F-704: Sales & Revenue Analytics Charts (Recharts)**

### Phase 8: Admin Catalog & Inventory Management
- [ ] **F-801: Products TanStack Data Table (Search, Sort, Filter, Export)**
- [ ] **F-802: Create & Edit Product Sheet Form (Images, Pricing, SKU, Stock)**
- [ ] **F-803: Stock Reservation & Inventory Level Alerts**
- [ ] **F-804: Category Management View**

### Phase 9: Admin Orders, Customers & Analytics
- [ ] **F-901: Orders Management Table & Status Badges**
- [ ] **F-902: Order Details & Status Transition Controller**
- [ ] **F-903: Customers Directory & Purchase History**

### Phase 10: QA, Accessibility, Performance & Launch Readiness
- [ ] **F-1001: WCAG Accessibility Audit & Remediation**
- [ ] **F-1002: Core Web Vitals & Performance Optimization**
- [ ] **F-1003: Security & Secret Leak Audit**
- [ ] **F-1004: Production Build Verification & Smoke Testing**
