# VARELLION Accessories — UI/UX-Ready Project Brief

> **Document Type:** UI/UX Requirements Brief & Design Handoff Specification  
> **Target Audience:** Senior UI/UX Designers & Figma AI Design Agents  
> **Project:** VARELLION Accessories E-Commerce Experience  
> **Author:** Senior Project Analyst, Product Manager & UI/UX Requirements Architect  
> **Status:** APPROVED BASELINE — Aligned with Backend, Live Database, and Business Requirements  
> **Date:** October 2026  

---

## 1. Executive Summary

### 1.1 Project Identity & Commercial Purpose
**VARELLION Accessories** (compact brand mark: **VARELLION**) is a modern, commercial consumer technology accessories brand launching in Egypt. The platform provides a refined, calm, and approachable e-commerce storefront specializing in premium mobile accessories, charging solutions, audio gear, desk ergonomics, smart devices, and gaming peripherals.

### 1.2 Target Audience & Core Value Proposition
- **Target Market:** Egyptian consumers (primarily smartphone users, young professionals, university students, remote workers, content creators, and gamers aged 18–35).
- **Core Value Proposition:** Removing the friction, distrust, and clutter typical of local accessory shopping by offering verified product specifications, genuine compatibility details, transparent pricing in Egyptian Pounds (`EGP`), Cash on Delivery (`COD`), and direct WhatsApp order coordination.

### 1.3 Technical Architecture & Platform Foundations
The UI/UX design directly interfaces with a verified, production-aligned technology stack:
- **Frontend Stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS.
- **Backend Core:** Java 17 / Spring Boot 3.3.4 (REST API, stateless JWT authentication, inventory reservation engine).
- **Database & Auth:** PostgreSQL 17 on Supabase (10 core business tables live), Supabase Auth (Google OAuth & Email/Password).
- **Media CDN:** Cloudinary CDN for optimized, responsive product photography.
- **Fulfillment Model:** Cash on Delivery (COD) + WhatsApp handoff + Single delivery carrier with manual governorate rate administration.

---

## 2. Confirmed Business Requirements

The following requirements represent confirmed commercial decisions and must be strictly respected in the Figma designs:

| Requirement Area | Confirmed Business Rule | Design Implication | Source Reference |
| :--- | :--- | :--- | :--- |
| **Launch Market & Currency** | Egypt exclusively for v1. Currency is strictly **Egyptian Pound (`EGP`)**. | Display prices as `EGP 450.00` (English) or `٤٥٠٫٠٠ ج.م` (Arabic). No multi-currency selectors. | `08_SPEC.md` §6, `06_DATA.md` §2 |
| **Bilingual Localization** | Arabic (`ar`) is the primary default locale (RTL); English (`en`) is secondary (LTR). | Complete mirrored UI layouts. 100% string parity. Dedicated Arabic typography. | `01_BRAND.md` §2, `02_UI_UX.md` §26 |
| **Customer Checkout Model** | **A customer account is required to complete checkout.** | Guests can browse and add items to cart, but initiating checkout triggers an account sign-in/registration prompt. | User Decision, `08_SPEC.md` §5.1 |
| **Customer Registration** | **Customer phone number is mandatory at registration.** | Registration forms must include a validated Egyptian mobile phone field (`01XXXXXXXXX`). | User Decision, `V1_MIGRATION.sql` |
| **Catalog Structure** | Exactly **6 flat categories**. No parent/child hierarchy. | Category navigation displays exactly 6 pill/tab filters. | `03_CONTENT.md` §6, `06_DATA.md` §6 |
| **Product Variants** | **Colors and sizes are modeled as distinct, separate products** with their own SKU, price, and stock. | Do NOT design complex nested variant selectors (e.g., matrix dropdowns). Related colors link as sibling products. | User Decision, `08_SPEC.md` §5.2 |
| **Stock & Availability** | Products can be published without stock, but **out-of-stock items cannot be ordered**. | PDP shows disabled "Out of Stock" button. Low-stock badge displayed when available quantity $\le 5$. | `08_SPEC.md` §5.3, `application.properties` |
| **Inventory Reservation** | **24-hour stock reservation window** upon order placement. | Order confirmation and tracking screens must feature a 24-hour expiration notice/countdown. | `08_SPEC.md` §8, `orders.confirmation_deadline` |
| **Payment Method** | **Cash on Delivery (COD) exclusively** for launch. | No credit card forms, Stripe, or payment gateway inputs in checkout v1. | `06_DATA.md` §3, `08_SPEC.md` §5.4 |
| **Shipping Administration** | Single shipping carrier with manually set/confirmed rates per governorate. | Support pending shipping fees: display "Shipping fee pending confirmation" when rate is unconfigured. | `08_SPEC.md` §5.4, `orders.shipping_fee_status` |
| **WhatsApp Integration** | WhatsApp is used for order confirmation and customer coordination. | Dedicated "Confirm via WhatsApp" primary action on the post-checkout confirmation screen. | `02_UI_UX.md` §13, `08_SPEC.md` §7 |
| **Historical Snapshots** | Order items must preserve exact purchase-time names, unit prices, and unit costs. | Historical invoices and customer receipts reflect the snapshot data, never live catalog updates. | `08_SPEC.md` §5.4, `order_items` |

---

## 3. Target Users and User Roles

```
                                  ┌──────────────────────────┐
                                  │      VARELLION USERS     │
                                  └─────────────┬────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
   ┌───────────────────────────┐                                 ┌───────────────────────────┐
   │    STOREFRONT VISITORS    │                                 │     STORE MANAGEMENT      │
   └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                 │                                                             │
        ┌────────┴────────┐                                                    ▼
        ▼                 ▼                                         ┌─────────────────────┐
  ┌───────────┐     ┌───────────┐                                   │   Store Admin       │
  │   Guest   │     │ Customer  │                                   │   (ROLE_ADMIN)      │
  │  Visitor  │     │ (Authed)  │                                   └─────────────────────┘
  └───────────┘     └───────────┘
```

### 3.1 Storefront Roles
1. **Guest Visitor (Unauthenticated):**
   - **Access:** Public pages (Home, Shop, Category Filter, Product Details, About, Contact, Policies).
   - **Capabilities:** Can search, filter, view specifications, inspect images, and add items to a local shopping cart.
   - **Boundary:** Cannot finalize checkout without signing in or registering with a valid phone number.
2. **Registered Customer (Authenticated via Supabase Auth):**
   - **Access:** Complete storefront, persistent server-side cart, checkout flow, account profile, order history, and order tracking.
   - **Capabilities:** Manages saved delivery addresses (`customer_addresses`), places orders via COD, initiates order cancellation (if order is in `PENDING` state), and requests WhatsApp returns/exchanges.

### 3.2 Administrative Role
3. **Store Administrator (`ROLE_ADMIN`):**
   - **Access:** Protected internal dashboard (`/{locale}/admin/*`) accessible via allowlisted Supabase credentials / Google OAuth.
   - **Capabilities:** Manages catalog (create, edit, publish, archive products and categories), uploads media via Cloudinary, adjusts inventory levels, configures governorate shipping fees, updates order lifecycle statuses, and inspects the audit history.

---

## 4. Product and Store Rules

### 4.1 Approved Category Taxonomy
The storefront strictly organizes products into these 6 canonical categories (source: `03_CONTENT.md` §6):

| Category Slug | English Display Label | Arabic Display Label | Representative Products |
| :--- | :--- | :--- | :--- |
| `mobile-accessories` | Mobile Accessories | إكسسوارات الهواتف | Shockproof cases, screen protectors, MagSafe rings, car mounts |
| `audio` | Audio | الصوتيات | Wireless earbuds, noise-cancelling headphones, AUX adapters |
| `power` | Power | الطاقة والشحن | GaN wall chargers, braided fast-charging cables, power banks |
| `smart-accessories` | Smart Accessories | الإكسسوارات الذكية | Smartwatch bands, stylus pens, tracking tags, wireless docks |
| `computer-desk` | Computer & Desk | ملحقات الكمبيوتر والمكتب | Ergonomic laptop stands, USB-C multi-port hubs, desk mats |
| `gaming` | Gaming | الألعاب وملحقاتها | Mobile gaming triggers, thumb sleeves, low-latency headsets |

### 4.2 Product Presentation & Badge Logic
Every product card and details page must respect strict conditional badge rules:
- **Price Display:** Always formatted with two decimal places (e.g., `599.00 EGP`).
- **Discount / Sale Badge:** Displayed **only** when `compare_at_price` exists and is strictly greater than `price`. Do not render fabricated discount tags.
- **Stock Availability Badges:**
  - `In Stock` / `متوفر`: Normal display.
  - `Low Stock` / `قطع محدودة متبقية`: Shown when `stock_quantity - reserved_quantity <= 5`. Displays exact remaining units to encourage conversion without fake urgency.
  - `Out of Stock` / `غير متوفر`: Greyed-out badge, disabled "Add to Cart" button.
- **Bilingual Content Integrity:** A product cannot be displayed in the storefront unless both its Arabic and English titles, short descriptions, and specifications are fully populated.

---

## 5. End-to-End User Journeys

```
 JOURNEY 1: DISCOVERY & PURCHASE
 ───────────────────────────────────────────────────────────────────────────────────────────────
 [Browse Catalog] ──► [Inspect PDP] ──► [Add to Cart] ──► [Auth Gate (Login/Register)]
                                                                  │
 [Order Success / WhatsApp Handoff] ◄── [Review & Place COD] ◄────┘

 JOURNEY 2: ORDER LIFECYCLE & 24H RESERVATION
 ───────────────────────────────────────────────────────────────────────────────────────────────
 [Order Placed: PENDING] ──► [WhatsApp Intent Confirmed] ──► [CONFIRMED] ──► [PREPARING/SHIPPED]
          │
          └──(24h Timeout / Customer Cancel)──► [EXPIRED / CANCELLED] ──► (Stock Auto-Restored)
```

### Journey 1: New Customer Registration & Login
1. User clicks "Sign In" in the header or attempts to proceed to checkout from the cart drawer.
2. An accessible modal or dedicated page displays:
   - "Continue with Google" (primary social OAuth).
   - Email/password login with a clear toggle to "Create Account".
3. Registration form requires: Full Name, Email, Password, and **Mandatory Mobile Phone Number** (`01XXXXXXXXX`).
4. Upon successful registration, the customer session is established, cart items are synchronized, and the user is redirected back to their active intent.

### Journey 2: Product Discovery & Filtering
1. Visitor lands on the Home Page or navigates to `/products`.
2. Discovery controls provide:
   - Real-time text search (searches Arabic and English titles/tags).
   - Horizontal category pills (all 6 categories + "All").
   - Sort dropdown: "Newest", "Price: Low to High", "Price: High to Low".
3. Visitor clicks a product card to navigate to `/products/[slug]`.

### Journey 3: Product Inspection & Cart Building
1. PDP presents high-resolution image gallery (1:1 aspect ratio), title, pricing, stock indicator, and technical specifications.
2. Visitor selects quantity (constrained by available stock) and clicks "Add to Cart".
3. A slide-over **Cart Drawer** immediately opens, showing the newly added item, line subtotal, and free delivery threshold progress (if configured).
4. Customer can continue shopping or click "Proceed to Checkout".

### Journey 4: Checkout & Order Submission (COD)
1. Customer enters checkout at `/checkout` (authenticated route).
2. Customer selects an existing saved delivery address or enters a new one:
   - Full Name & Phone Number (pre-filled from profile).
   - Governorate (authoritative dropdown list of Egyptian governorates).
   - City / Area.
   - Detailed Street Address, Building, and Apartment.
   - Optional order notes for the courier.
3. Order Summary displays subtotal, estimated shipping fee (or "Pending confirmation" if unconfigured), and final total.
4. Payment Method is locked to: **Cash on Delivery (الدفع عند الاستلام)**.
5. Customer clicks "Confirm Order (تأكيد الطلب)".
6. The backend atomically reserves stock for 24 hours, persists immutable order item snapshots, and generates a human-friendly order number (`VAR-YYYYMMDD-XXXX`).

### Journey 5: WhatsApp Handoff & Order Confirmation
1. Customer lands on `/orders/[orderNumber]/confirmation`.
2. Screen highlights the order number, 24-hour confirmation deadline notice, and summary.
3. Prominent primary CTA: **"Confirm via WhatsApp (تأكيد الطلب عبر واتساب)"**.
4. Clicking opens WhatsApp with a pre-filled message:
   `"Hello VARELLION, I placed order VAR-20261019-0012 for 850.00 EGP. Please confirm shipping to Cairo."`
5. The screen clearly explains: *"Opening WhatsApp does not cancel or complete your order. Our customer care representative will verify your address and dispatch your package."*

### Journey 6: Customer Order Tracking & History
1. Customer visits `/account/orders` to view all previous and active orders.
2. Order details view (`/account/orders/[id]`) features a visual 5-step status stepper:
   `Placed` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered`.
3. If the order is still `PENDING_CUSTOMER_CONFIRMATION`, an explicit "Cancel Order" button is available. Once `SHIPPED`, cancellation is disabled and replaced with "Request Return / Support".

---

## 6. Comprehensive Screen Inventory

The following 18 screens represent the complete scope for the Figma design system:

### 6.1 Customer Storefront (Public)
| Screen ID | Screen Name & Route | Key Information & Content | Primary Actions | UI States Required |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-01** | **Home Page**<br>`/{locale}` | Hero banner, value propositions, 6 category shortcuts, featured product grid, "How to Order" 3-step guide, FAQ snippet, footer. | "Explore Catalog", "Shop Now", Category clicks. | Default, Skeleton loading, Empty featured grid. |
| **SCR-02** | **Catalog / Shop**<br>`/{locale}/products` | Search bar, 6 category pills, sort dropdown, active filter chips, responsive product grid, result count. | Filter by category, sort by price, clear filters. | Default, Loading skeletons, No search results, Empty catalog. |
| **SCR-03** | **Product Details (PDP)**<br>`/{locale}/products/[slug]` | Image gallery/carousel, title, SKU, price/compare-at, stock status badge, quantity stepper, specs table, compatibility list, related items. | "Add to Cart", "Buy Now", Thumbnail selection, Share link. | In-stock, Low-stock ($\le 5$), Out-of-stock (disabled), 404 Not Found. |
| **SCR-04** | **About Brand**<br>`/{locale}/about` | Brand ethos, philosophy of transparent accessories, quality and durability commitments, contact prompt. | "Browse Catalog", "Contact Us". | Default static reading layout. |
| **SCR-05** | **Contact & Support**<br>`/{locale}/contact` | WhatsApp business card, official email, support hours, FAQ link, contact inquiry form. | "Chat on WhatsApp", "Send Message". | Form idle, Submitting, Success alert, Validation errors. |
| **SCR-06** | **Legal Policies**<br>`/{locale}/privacy`<br>`/{locale}/terms` | Narrow-column legal copy for Privacy Policy and Terms of Service (COD, delivery, return terms). | Language toggle, Back to Shop. | Static reading view (RTL & LTR). |

### 6.2 Authentication & Customer Account
| Screen ID | Screen Name & Route | Key Information & Content | Primary Actions | UI States Required |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-07** | **Sign In Modal / Page**<br>`/{locale}/auth/login` | Google OAuth button, email & password inputs, "Remember Me", forgot password link, toggle to register. | "Sign In", "Continue with Google", "Create Account". | Default, Submitting, Invalid credentials error, OAuth loading. |
| **SCR-08** | **Registration Page**<br>`/{locale}/auth/register` | Full name, email, password, **mandatory phone number (`01XXXXXXXXX`)**, terms acceptance checkbox. | "Create Account", "Sign In Instead". | Default, Field validation errors, Submitting, Success redirect. |
| **SCR-09** | **Account Dashboard**<br>`/{locale}/account` | Customer greeting, contact summary, recent orders preview, quick links to Address Book and Security. | "View All Orders", "Edit Profile", "Sign Out". | Default, Empty order summary. |
| **SCR-10** | **Customer Order History**<br>`/{locale}/account/orders` | Tabbed list of orders (Active, Delivered, Cancelled). Card shows Order #, Date, Total in EGP, Status Badge. | "Track Order", "View Invoice / Receipt". | Default, Empty orders state (with "Start Shopping" button). |
| **SCR-11** | **Customer Address Book**<br>`/{locale}/account/addresses` | Grid of saved delivery addresses (Governorate, City, Address, Phone), default badge. | "Add New Address", "Edit", "Delete". | Default, Empty address state, Delete confirmation dialog. |

### 6.3 Cart, Checkout & Fulfillment
| Screen ID | Screen Name & Route | Key Information & Content | Primary Actions | UI States Required |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-12** | **Cart Drawer / Page**<br>`/{locale}/cart` | Item list (thumbnail, name, unit price, quantity stepper, trash icon), subtotal, shipping notice, clear checkout CTA. | "Proceed to Checkout", "Continue Shopping", "Update Quantity". | Default populated, Empty cart state, Out-of-stock warning banner. |
| **SCR-13** | **Checkout Page**<br>`/{locale}/checkout` | 2-step single-page layout: 1) Delivery Address selector/form, 2) Order Review & COD confirmation. | "Place Order (تأكيد الطلب)", "Add New Address". | Default, Loading rate, Pending shipping alert, Submission spinner. |
| **SCR-14** | **Order Success / Handoff**<br>`/{locale}/orders/[id]/confirmation` | Green success header, Order #, 24h deadline banner, delivery details, item summary, pre-filled WhatsApp action. | **"Confirm via WhatsApp" (Primary)**, "View in Account", "Back to Shop". | Confirmed order state, Pending shipping fee notice. |
| **SCR-15** | **Public Order Lookup**<br>`/{locale}/orders/lookup` | Tracking inquiry input requiring **Order Number + Phone Number** (prevents unauthorized snooping). | "Find My Order". | Default idle, Loading, Order found summary, Not found error. |

### 6.4 Administrative Dashboard (`ROLE_ADMIN` Only)
| Screen ID | Screen Name & Route | Key Information & Content | Primary Actions | UI States Required |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-16** | **Admin Sign In**<br>`/{locale}/admin/login` | Restricted administrative credentials entry (Email, Password, Google Admin OAuth). | "Sign In to Admin Portal". | Default, Denied non-admin error, Loading. |
| **SCR-17** | **Admin Dashboard Overview**<br>`/{locale}/admin` | Metric cards: New Orders Today, Pending WhatsApp Verifications, Low Stock Alerts, Out-of-Stock count. | Quick shortcuts to Orders and Inventory. | Populated data, Skeleton loading. |
| **SCR-18** | **Admin Order Management**<br>`/{locale}/admin/orders/[id]` | Customer snapshot, delivery address, order items list with profit margins, shipping fee override, status stepper. | "Confirm Order", "Mark Shipped", "Cancel & Release Stock", "Save Fee". | State transition modals, Success toasts. |

---

## 7. UI/UX Design System Requirements

### 7.1 Canonical Color Tokens
The visual design must strictly use the approved teal and neutral token palette (source: `01_BRAND.md` §3):

```css
/* Core Brand Tokens */
--color-primary-900: #12363B;  /* Deep brand teal (headers, dark emphasis) */
--color-primary-700: #17565D;  /* Primary brand interactive color (buttons, active states) */
--color-primary-500: #2D7F83;  /* Accent teal, links, focus rings, selected indicators */
--color-primary-300: #79B8B8;  /* Subtle teal tints, decorative borders, light fills */

/* Neutrals & Surfaces (Light Mode Only) */
--color-text-primary:   #172126;  /* High contrast charcoal body and headings */
--color-text-secondary: #344054;  /* Medium gray for descriptions, metadata, subtitles */
--color-text-muted:     #667085;  /* Low priority captions, breadcrumbs, placeholder text */
--color-border:         #E4E7EC;  /* Standard border for cards, inputs, dividers */
--color-surface:        #FFFFFF;  /* Pure white card backgrounds and dialogs */
--color-surface-soft:   #F8FAFA;  /* Off-white background for input fields, chips, tables */
--color-page:           #FAFBFA;  /* General canvas page background */

/* Semantic Status Indicators */
--color-success: #2E7D5B;  /* Order confirmed, in-stock badge, green checkmark */
--color-warning: #B7791F;  /* Low stock alert (<5), pending shipping fee, 24h timer */
--color-danger:  #C44B4B;  /* Out of stock, order cancelled, validation error */
--color-info:    #356AA5;  /* Delivery courier notes, informational banners */
```

### 7.2 Typography System
- **Arabic Font Family:** `"IBM Plex Sans Arabic"`, sans-serif.
  - Selected for its exceptional legibility on digital screens, technical character, and natural Arabic calligraphic proportions without decorative exaggeration.
- **English/Latin Font Family:** `"Inter"`, sans-serif.
  - Clean, neutral, modern grotesk pairing harmoniously with IBM Plex Sans Arabic.
- **Type Scale Hierarchy:**
  - `Display / Hero Title`: 36px / 44px (Mobile: 28px / 36px) — Bold (700)
  - `Heading 1 / Page Title`: 28px / 36px (Mobile: 24px / 32px) — SemiBold (600)
  - `Heading 2 / Section Header`: 22px / 28px (Mobile: 20px / 26px) — SemiBold (600)
  - `Heading 3 / Card Title`: 18px / 24px — Medium (500)
  - `Body Regular`: 15px / 22px — Regular (400)
  - `Body Small / Metadata`: 13px / 18px — Regular (400)
  - `Button Label / Navigation`: 14px / 20px — Medium (500)
  - `Badge / Tag`: 12px / 16px — SemiBold (600)

### 7.3 Layout Grid & Responsive Container Rules
- **Maximum Content Width:** `1280px` (centered on wide viewports).
- **Horizontal Page Padding:**
  - Mobile (320px – 767px): `16px`
  - Tablet (768px – 1023px): `24px`
  - Desktop (1024px+): `32px`
- **Responsive Product Grid Breakpoints:**
  - `320px – 359px`: 1 column (full width card).
  - `360px – 767px`: 2 columns (compact card, tight spacing).
  - `768px – 1023px`: 3 columns.
  - `1024px – 1279px`: 3 columns (spacious desktop card).
  - `1280px+`: 4 columns.

### 7.4 Bidirectional RTL / LTR Design Rules
- All layouts must use **bidirectional mirroring**:
  - In Arabic (`RTL`): Logo sits on the top-right, search/actions on the top-left; breadcrumbs flow right-to-left (`الرئيسية / المتجر / كابلات`); drawers slide in from the right edge.
  - In English (`LTR`): Standard left-to-right flow; drawers slide in from the left edge.
- **Icons to Mirror:** Chevrons, back arrows, navigation steps, and progress bars.
- **Icons NOT to Mirror:** Phone icons, credit card shapes, battery/power gauges, and official brand wordmarks (`VARELLION`).

### 7.5 Interactive States & Accessibility Standards
- **Touch Targets:** Minimum `44 × 44 CSS pixels` for all mobile controls and buttons.
- **Focus Rings:** Visible `2px` solid `--color-primary-500` ring with a `2px` offset on keyboard focus.
- **Visual Elevation:**
  - Cards: Border `1px solid #E4E7EC` + subtle shadow `0 1px 3px rgba(16, 24, 40, 0.06)`.
  - Dropdowns & Drawers: `0 12px 32px rgba(16, 24, 40, 0.10)`.
- **Corner Radii:**
  - Badges & Pills: `9999px` (Full rounded).
  - Inputs & Small Buttons: `8px`.
  - Product Cards & Containers: `12px` or `16px`.

---

## 8. Technical Constraints Relevant to Design

1. **Light Mode Only:** The first release does not include a dark mode toggle. Design exclusively for crisp, clean light surfaces.
2. **Post-Submission Order Immutability:** Once an order is persisted, products, prices, and addresses cannot be silently modified by the customer. Changing an address requires contacting support via WhatsApp.
3. **No Embedded Payment Gateways:** Checkout design must not include credit card number inputs, OTP fields, or payment wallet embeds. Payment is strictly COD.
4. **WhatsApp URL Launch Limitations:** Clicking "Confirm via WhatsApp" triggers an external URL scheme (`https://wa.me/...`). The interface must make clear that clicking this button leaves the store to complete personal coordination with the agent.
5. **No Infinite Scroll:** The product catalog should use explicit page numbers or a "Load More" button to avoid disorienting keyboard/mobile screen-reader users and footer trapped states.

---

## 9. Confirmed Decisions vs. Recommended Proposals

To eliminate ambiguity for the Figma design team, here is the clear boundary between what is locked versus what is recommended:

| Decision Area | Status | Authority & Details |
| :--- | :--- | :--- |
| **Brand Palette (Teal & Neutrals)** | **LOCKED** | Defined in `01_BRAND.md`. Must be used exactly as specified. |
| **Typography (IBM Plex Sans Arabic & Inter)** | **LOCKED** | Defined in `01_BRAND.md`. Primary fonts for design system. |
| **6 Category Taxonomy** | **LOCKED** | Defined in `03_CONTENT.md`. No additional categories to be created. |
| **Customer Account Required for Checkout** | **LOCKED** | Latest approved user decision. Guest checkout is disabled. |
| **Cash on Delivery (COD) Only** | **LOCKED** | Defined in `06_DATA.md` & `08_SPEC.md`. No online payment gateways. |
| **Colors/Sizes as Separate Products** | **LOCKED** | Confirmed architectural decision. No complex variant matrices. |
| **Cart Drawer vs. Cart Page** | *Recommended* | Provide both: quick slide-out drawer on desktop/mobile + full `/cart` page. |
| **Filter UI Layout** | *Recommended* | Horizontal scrollable pills on mobile; left sidebar or top row on desktop. |
| **Product Card Image Ratio** | *Recommended* | Exact `1:1` square aspect ratio with soft background `#F8FAFA`. |

---

## 10. Resolved Conflicts & Open Commercial Questions

### 10.1 Resolved Architectural Conflicts
- **Conflict:** Early draft documents (`08_SPEC.md` §5.4, `06_DATA.md` §3 Option B) discussed "Guest Checkout with WhatsApp handoff".
- **Resolution:** The user explicitly overruled guest checkout in the latest approved directive: **"A customer account is required to complete checkout."** The UI must gate the final order placement step behind customer sign-in/registration.
- **Conflict:** In `V1_MIGRATION.sql`, `phone_number` was initially nullable.
- **Resolution:** The user confirmed that customer phone numbers are **mandatory at registration**. The registration form and customer profile must make phone number an obligatory, validated field.

### 10.2 Open Commercial Questions for Store Owner
These items do not block UI design, but must be configured before production launch:
1. **Official WhatsApp Business Number:** Currently drafted as `01104867352`. Needs final confirmation before publishing live links.
2. **Official Delivery Carrier Coverage:** Whether a single nationwide flat rate is used, or a governorate-based tier (e.g., Cairo/Giza: 50 EGP, Alex: 65 EGP, Upper Egypt: 85 EGP). The UI accommodates both via the pending fee pattern.
3. **Physical Store Address:** If a pickup location exists, it will be added to the contact screen; currently omitted.

---

## 11. Source Documents Reviewed

The requirements in this brief were synthesized directly from the following canonical files:

- `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md` (Design tokens, visual voice, typography, color palettes)
- `02_VARELLION_UI_UX_SPECIFICATION_FIXED.md` (Storefront UX, user journeys, responsive metrics, accessibility)
- `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md` (Category taxonomy, product data standards, SEO requirements)
- `04_VARELLION_FRONTEND_ARCHITECTURE.md` (Route structure, Next.js tech baseline, bilingual localization)
- `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` (Commercial launch model, WhatsApp channel, EGP currency)
- `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` (Orders module, 24h stock reservation, historical snapshots, RLS)
- `09_VARELLION_ADMIN_UX_ADDENDUM.md` (Admin dashboard routes, order management workflow, inventory monitoring)
- `backend/src/main/resources/db/migration/` (Live PostgreSQL schemas: `V1` to `V5` verified)

---

## 12. Final Handoff Instructions for the Figma Design Agent

To begin designing the VARELLION Figma project, follow these systematic instructions:

### Step 1: Set Up Design System & Global Styles
1. Configure **Color Styles** in Figma using the exact HEX codes from Section 7.1 (`--color-primary-*`, neutrals, and status colors).
2. Configure **Text Styles** in Figma for both `IBM Plex Sans Arabic` and `Inter` matching the type scale in Section 7.2.
3. Set up **Grid Styles**: 4-column grid (Mobile: 16px gutter, 16px margin), 8-column grid (Tablet: 24px gutter, 24px margin), 12-column grid (Desktop: 24px gutter, 1280px max width).

### Step 2: Build Master Components
Build the following reusable components with Auto-Layout and interactive variants (Default, Hover, Active, Disabled, Loading):
- **Buttons:** Primary (Teal `#17565D`), Secondary (Outline), Subtle Ghost, Destructive, WhatsApp Button (Brand Green `#25D366` with WhatsApp glyph).
- **Form Controls:** Text Input, Phone Number Input (with `+20` prefix), Select Dropdown, Checkbox, Textarea.
- **Product Card:** Square image container, Category micro-copy, Title, Price, Discount strike-through, Stock status badge.
- **Header Navigation:** Responsive navbar with localized language toggle (`العربية` / `English`), Cart icon badge with item count, and Account button.
- **Status Stepper:** 5-step horizontal order tracker (`Placed`, `Confirmed`, `Preparing`, `Shipped`, `Delivered`).

### Step 3: Layout Key Frames (RTL & LTR)
1. For every customer screen in Section 6, create two top-level frames:
   - **Mobile Frame:** `390 × 844 px` (iPhone 14/15 baseline).
   - **Desktop Frame:** `1440 × 900 px` (Standard desktop canvas, 1280px content container).
2. Design the **Arabic (RTL) version first**, ensuring all alignments, badges, and layout hierarchies feel native and balanced.
3. Mirror the layout to produce the **English (LTR) version**.

*(End of VARELLION UI/UX Project Brief)*
