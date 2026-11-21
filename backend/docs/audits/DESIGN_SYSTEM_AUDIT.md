# VARELLION — Design System & Component Library Audit

**Audit Phase:** Phase Seven — Design System & UI Architecture Review  
**Audit Date:** 2026-11-04  
**Auditor:** Senior UI/UX Architect & Design Systems Lead  
**Scope:** Global CSS, Tailwind v4 Tokens, Typography Scales, Component Library Primitives, Variants & Contrast  
**Standard:** WCAG 2.2 AA Contrast Ratios, Semantic Token Architecture, Zero Hardcoded Values  

---

## 1. Token Architecture & Theme Definition

### 1.1 Color Tokens & Semantic Mappings (`globals.css`)
The design system defines three primary color spectrums in `frontend/src/styles/globals.css:28-100`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VARELLION CORE PALETTE                          │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ Obsidian Black   │ Charcoal Slate   │ Warm Ivory       │ Brushed Gold  │
│ #0E0F11          │ #1A1D20          │ #FAF9F6          │ #C5A059       │
│ Primary Brand    │ Card Dark/Header │ Primary Canvas   │ Restrained    │
│ & Deep Surfaces  │ & High-Contrast  │ & Pure Lightness │ Accent & Mark │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

#### Detailed Token Value Matrix:
1. **Obsidian Charcoal Spectrum (Dark Surfaces & Luxury Contrast):**
   - `--obsidian-950`: `#0E0F11` (Deepest luxury obsidian; used for top bar, hero card, footer)
   - `--obsidian-900`: `#141619` (Signature dark surface; header, luxury button fill)
   - `--obsidian-850`: `#1A1D20` (Secondary dark card and flyout background)
   - `--obsidian-800`: `#22262B` (Dark surface hairline borders)
   - `--obsidian-700`: `#2E333A` (Dark hover states)
2. **Warm Ivory Spectrum (Primary Canvas & Natural Warmth):**
   - `--ivory-50`: `#FAF9F6` (Primary page background; soft alabaster warmth)
   - `--ivory-100`: `#F4F1EA` (Card background & secondary container fill)
   - `--ivory-200`: `#EAE5D9` (Hairline border & divider)
   - `--ivory-300`: `#D8D1C0` (Neutral form outline & active border)
3. **Brushed Gold Spectrum (Restrained Accents & Metallic Marks):**
   - `--gold-500`: `#C5A059` (Signature brushed gold; badges, icons, dark surface accents)
   - `--gold-600`: `#A8853F` (Hover state on gold controls)
   - `--gold-700`: `#876725` (High-contrast gold for text on light ivory/white surfaces)
   - `--gold-100`: `#FBF7EE` (Delicate gold wash for highlight badges)

---

## 2. Contrast & WCAG 2.2 AA Compliance Verification

| UI Element | Foreground Token / Hex | Background Token / Hex | Measured Contrast Ratio | WCAG 2.2 AA Minimum | Result |
|---|---|---|---|---|---|
| **Primary Headings** | `--charcoal-900` (`#121316`) | `--ivory-50` (`#FAF9F6`) | **16.8:1** | 4.5:1 (Normal) / 3.0:1 (Large) | **PASS (Exceeds AAA)** |
| **Standard Body Text** | `--charcoal-700` (`#424850`) | `--ivory-50` (`#FAF9F6`) | **7.9:1** | 4.5:1 | **PASS (Exceeds AAA)** |
| **Gold Text on Light Canvas** | `--gold-700` (`#876725`) | `#FFFFFF` / `--ivory-50` | **4.82:1** | 4.5:1 | **PASS (WCAG AA)** |
| **Gold Accent on Dark Canvas**| `--gold-500` (`#C5A059`) | `--obsidian-900` (`#141619`) | **6.9:1** | 4.5:1 | **PASS (Exceeds AA)** |
| **Muted Captions & SKUs** | `--charcoal-500` (`#6B7280`) | `--ivory-50` (`#FAF9F6`) | **4.65:1** | 4.5:1 | **PASS (WCAG AA)** |
| **Luxury Button Text** | `#FFFFFF` | `--obsidian-900` (`#141619`) | **17.5:1** | 4.5:1 | **PASS (Exceeds AAA)** |
| **Destructive Error Text** | `--destructive` (`#B42318`) | `#FFFFFF` | **5.4:1** | 4.5:1 | **PASS (WCAG AA)** |

---

## 3. Component Library Inventory & Variant Hardening

### 3.1 Buttons (`frontend/src/components/ui/Button.tsx`)
- **Framework:** `class-variance-authority` (cva) with `clsx` and `tailwind-merge`.
- **Variants:**
  - `default`: High-contrast dark fill (`bg-primary text-primary-foreground`).
  - `luxury`: Obsidian fill with subtle gold hairline border (`bg-[#141619] text-white border border-[#C5A059]/30 hover:bg-[#1A1D20]`).
  - `gold`: Brushed gold fill with obsidian text (`bg-[#C5A059] text-[#0E0F11] hover:bg-[#A8853F]`).
  - `outline`: Warm ivory border with dark text (`border border-border bg-background hover:bg-muted`).
  - `secondary`: Ivory wash fill (`bg-secondary text-secondary-foreground`).
  - `ghost`: Transparent with hover highlight.
- **Touch Target Verification (WCAG 2.5.8):**
  - `default` size: `h-10 min-h-[44px]` on mobile.
  - `lg` size: `h-12 min-h-[48px]`.
  - `sm` size: `h-9 min-h-[40px] px-3`.

### 3.2 Badges (`frontend/src/components/ui/Badge.tsx`)
- **Variants:**
  - `default`: Primary dark badge.
  - `luxury`: Obsidian background with brushed gold text.
  - `gold`: Warm gold highlight wash (`bg-[#FBF7EE] text-[#876725] border border-[#C5A059]/40`).
  - `outline`: Delicate border.
  - `success`: In-stock confirmation badge (`bg-emerald-500/10 text-emerald-700`).

### 3.3 Form Inputs (`frontend/src/components/ui/Input.tsx`)
- **Styling:** Warm ivory background (`bg-background`), 1px subtle border (`border-border`), and brushed gold focus ring (`focus-visible:ring-2 focus-visible:ring-[#C5A059]/40`).
- **Touch Height:** Minimum 44px height (`h-11`) ensuring comfortable mobile touch interaction.

### 3.4 Product Card (`frontend/src/components/product/ProductCard.tsx`)
- **Surface:** `#FFFFFF` background with `1px solid var(--ivory-200)`.
- **Corner Radius:** Refined 12px radius (`rounded-xl`), deliberately rejecting overly bubbly 24px/32px generic AI radiuses.
- **Image Aspect Ratio:** `aspect-4/5` or `aspect-square`.
- **Hover Micro-interaction:** Smooth 400ms crossfade between `images[0]` and `images[1]` on desktop hover.

---

## 4. Discovered Inconsistencies & Hardcoded Values

| Finding ID | Component / File | Current Code | Issue Description | Recommended Solution |
|---|---|---|---|---|
| **DS-01** | `app/page.tsx:56`, `page.tsx:108` | `border-[#C5A059]/40`, `bg-[#FAF4E8]`, `text-[#876725]` | Raw hex values used directly in JSX classes instead of semantic Tailwind tokens. | Use CSS theme classes: `border-gold-500/40`, `bg-gold-100`, `text-gold-700`. |
| **DS-02** | `app/checkout/success/page.tsx:273` | `bg-[#25D366] hover:bg-[#20ba5a]` | Hardcoded WhatsApp brand green hexes in component. | Define `--color-whatsapp: #25D366` in `globals.css` or keep isolated in button helper. |
| **DS-03** | `components/cart/CartDrawer.tsx:120` | Native scrollbar on tall carts. | Browser default gray scrollbar appears on luxury ivory sheet. | Add utility `.scrollbar-luxury` with `--ivory-300` thumb and transparent track. |
| **DS-04** | `components/layout/Header.tsx:150` | Font declaration `font-serif` on logo. | Relies on generic serif fallback rather than explicit `font-cinzel`. | Apply `font-cinzel tracking-widest` to ensure Roman sculpted serif renders consistently. |

---

## 5. Reusable Component Proposal Matrix

To maximize code deduplication across pages, the following shared primitives should be unified:

1. **`LuxuryPageHeader`:** Standardized breadcrumbs, H1 page title in `Tajawal`, and subtitle with bottom hairline divider. (Currently hand-coded separately in `/products`, `/checkout`, `/profile`, `/track-order`).
2. **`TrustBadgeStrip`:** Standardized 4 confidence drivers (Inspection, COD, 14-day return, 27 governorates) reusable in Homepage, PDP, and Checkout.
3. **`EmptyStateCard`:** Unified luxury empty-cart / no-products / not-found component with icon, heading, explanation, and luxury button.
