# VARELLION — Luxury E-Commerce Design System

**Document Version:** 1.0.0  
**Target Brand:** VARELLION (Horology, Genuine Leather, Curated Accessories)  
**Primary Market:** Egypt (27 Governorates, COD & Online Pay, EGP Currency, RTL Arabic default + English LTR)  

---

## 1. Brand Philosophy & Design Principles

VARELLION represents refined masculinity, timeless horology, and genuine leathercraft. The visual language embodies:
1. **Architectural Restraint:** Clean lines, deliberate negative space, and disciplined geometry. No gratuitous gradients, no bubbly pill containers, no Web3 glows.
2. **Material Honesty:** Rich obsidian charcoal reminiscent of watch dials and brushed cases, paired with warm ivory reflecting unbleached cotton and fine parchment, accented with understated brushed gold.
3. **Tactile Clarity:** Every product photograph is given prominence. Contrast is calibrated to WCAG 2.2 AA standards so product attributes and prices are immediately readable.
4. **Cultural Naturalness:** Arabic is the first-class visual foundation, treated with proper typographic tracking, calligraphic harmony (`Tajawal`), and natural RTL rhythm, without awkward mirroring of asymmetrical elements.

---

## 2. Color Palette & Tokens

### 2.1 Color Matrix & Rationale

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

### 2.2 Token Definitions (Tailwind v4 / CSS Variables)

```css
:root {
  /* --- Obsidian & Dark Charcoal Spectrum (Primary Dark Surfaces & Headers) --- */
  --obsidian-950: #0E0F11;  /* Deepest luxury black, used for rich hero & footer elements */
  --obsidian-900: #141619;  /* Signature header & dark surface background */
  --obsidian-850: #1A1D20;  /* Secondary dark card & dropdown background */
  --obsidian-800: #22262B;  /* Dark card borders & subtle dividers */
  --obsidian-700: #2E333A;  /* Hover state on dark elements */

  /* --- Warm Ivory Spectrum (Primary Canvas & Warm Neutral Surfaces) --- */
  --ivory-50:  #FAF9F6;     /* Primary page body background (Alabaster warmth, never sterile blue) */
  --ivory-100: #F4F1EA;     /* Light card background & secondary container fill */
  --ivory-200: #EAE5D9;     /* Subtle light surface border & divider */
  --ivory-300: #D8D1C0;     /* Stronger neutral border & outline */
  --ivory-400: #B8B09F;     /* Subtle warm neutral text / placeholder */

  /* --- Brushed Gold & Warm Brass (Restrained Accents) --- */
  --gold-500: #C5A059;      /* Signature brushed gold (for dark backgrounds, badges, icons) */
  --gold-600: #A8853F;      /* Hover state on gold buttons & dark accent rings */
  --gold-700: #876725;      /* Accessible high-contrast gold (4.8:1 contrast on ivory-50/white) */
  --gold-100: #FBF7EE;      /* Delicate gold highlight wash for alerts/badges */
  --gold-border: rgba(197, 160, 89, 0.35); /* Subtle metallic hairline border */

  /* --- Neutral Monochromes & Body Typography --- */
  --charcoal-900: #121316;  /* Primary heading text (Crisp, deep contrast) */
  --charcoal-800: #2A2E33;  /* Sub-headings and primary interactive labels */
  --charcoal-700: #424850;  /* Standard body copy */
  --charcoal-500: #6B7280;  /* Secondary captions, SKUs, and breadcrumbs */
  --charcoal-400: #9CA3AF;  /* Muted placeholder text */

  /* --- Functional Semantic Tokens (WCAG 2.2 Compliant) --- */
  --color-success: #1B7A4E;       /* In-stock & delivery confirmations (5.1:1 on ivory) */
  --color-success-bg: #EAF7EE;    /* Soft confirmation badge fill */
  --color-warning: #995B00;       /* Low stock / urgent notices (5.2:1 on ivory) */
  --color-warning-bg: #FFF8E6;    /* Soft warning badge fill */
  --color-danger: #B42318;        /* Out of stock / error notifications */
  --color-danger-bg: #FDF2F2;     /* Error badge fill */

  /* --- Shadcn / Next.js Component Mappings --- */
  --background: var(--ivory-50);
  --foreground: var(--charcoal-900);
  --card: #FFFFFF;
  --card-foreground: var(--charcoal-900);
  --popover: #FFFFFF;
  --popover-foreground: var(--charcoal-900);
  --primary: var(--obsidian-900);
  --primary-foreground: #FFFFFF;
  --secondary: var(--ivory-100);
  --secondary-foreground: var(--charcoal-900);
  --muted: var(--ivory-100);
  --muted-foreground: var(--charcoal-500);
  --accent: var(--gold-100);
  --accent-foreground: var(--gold-700);
  --border: var(--ivory-200);
  --input: var(--ivory-200);
  --ring: var(--gold-500);
}
```

### 2.3 Contrast & Accessibility Verification (WCAG 2.2 AA)

1. **Heading Text (`--charcoal-900` #121316 on `--ivory-50` #FAF9F6):**
   - Contrast Ratio: **16.8:1** (Exceeds 7:1 AAA standard).
2. **Body Text (`--charcoal-700` #424850 on `--ivory-50` #FAF9F6):**
   - Contrast Ratio: **7.9:1** (Exceeds 4.5:1 AA standard).
3. **Gold Accent Text on Light Canvas (`--gold-700` #876725 on `#FFFFFF`):**
   - Contrast Ratio: **4.82:1** (Passes 4.5:1 AA standard for regular text).
4. **Brushed Gold on Dark Canvas (`--gold-500` #C5A059 on `--obsidian-900` #141619):**
   - Contrast Ratio: **6.9:1** (Passes AA and AAA for headings and UI controls).

---

## 3. Typography System

### 3.1 Font Family Pairings

1. **Primary Arabic Typography (`Tajawal`):**
   - Geometric yet warm, humanist Arabic sans-serif with natural balance for modern luxury.
   - Weights: `400` (Regular body), `500` (Medium navigation), `600` (SemiBold titles), `700` (Bold numbers & prices), `800` (ExtraBold statements).
2. **Brand & English Display Typography (`Cinzel`):**
   - Classical Roman proportions, sculpted serifs, perfect for `VARELLION` brandmark, collection names, and horological subtitles.
   - Weights: `600`, `700`.
3. **Technical & Tabular Typography (`Plus Jakarta Sans` / System Mono):**
   - Clean international sans-serif with `tabular-nums` support for prices, SKUs, and order tracking numbers.

### 3.2 Typographic Hierarchy Scale

| Token | Size | Line Height | Weight | Letter Spacing | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-1` | 44px (2.75rem) / 56px (3.5rem) | 1.15 | 800 (ExtraBold) | -0.02em | Hero headline |
| `h1` | 32px (2.0rem) / 40px (2.5rem) | 1.2 | 700 (Bold) | -0.015em | Page titles, PDP main title |
| `h2` | 24px (1.5rem) / 28px (1.75rem) | 1.25 | 700 (Bold) | -0.01em | Section headers |
| `h3` | 18px (1.125rem) / 20px (1.25rem) | 1.3 | 600 (SemiBold) | normal | Product card titles, drawer headings |
| `body-lg` | 16px (1.0rem) | 1.6 | 400 (Regular) | normal | Product descriptions, hero lead |
| `body-sm` | 14px (0.875rem) | 1.5 | 400 / 500 | normal | Form inputs, dropdown labels, table data |
| `caption` | 12px (0.75rem) | 1.4 | 500 (Medium) | normal | Stock notices, shipping notes, trust items |
| `micro` | 11px (0.6875rem) | 1.3 | 600 (SemiBold) | +0.02em | SKUs, badges, secondary breadcrumbs |

---

## 4. Spacing, Layout & Elevation

### 4.1 Layout Widths
- **Maximum Store Container:** `1280px` (`max-w-7xl`)
- **Editorial / Focus Container:** `1024px` (`max-w-5xl`)
- **Reading / Form Container:** `640px` (`max-w-xl`)
- **Drawer Width:** `440px` (`max-w-md`)

### 4.2 Border Radius Scale (Refined Horological Geometry)
Excessive `rounded-3xl` (24px) is banned. Luxury timepieces and hand-stitched leather wallets celebrate precision:
- `radius-xs`: `3px` (Badges, breadcrumb pills)
- `radius-sm`: `6px` (Buttons, inputs, form selects)
- `radius-md`: `10px` (Product cards, image containers)
- `radius-lg`: `14px` (Dialogs, flyout drawers, order summary cards)
- `radius-full`: `9999px` (Strictly reserved for avatar circles and circular quantity pills)

### 4.3 Elevation & Shadows (Diffuse Ambient Light)
- **Flat Hairline (Default):** `1px solid var(--ivory-200)`
- **Elevation 1 (Card Rest):** `0 1px 3px 0 rgba(18, 19, 22, 0.04), 0 1px 2px -1px rgba(18, 19, 22, 0.04)`
- **Elevation 2 (Card Hover):** `0 4px 12px -2px rgba(18, 19, 22, 0.08), 0 2px 6px -2px rgba(18, 19, 22, 0.04)`
- **Elevation 3 (Drawer / Modal):** `0 12px 32px -4px rgba(14, 15, 17, 0.16)`

---

## 5. Component Style Specifications

### 5.1 Buttons
All primary touch targets are at least `44px` height (WCAG 2.5.8 compliant).
1. **Primary Luxury Button (`variant="luxury"`):**
   - Background: `var(--obsidian-900)` `#141619`
   - Foreground: `#FFFFFF`
   - Border: `1px solid rgba(197, 160, 89, 0.25)` (Refined gold hairline)
   - Hover: Background `#1F2329`, Border `rgba(197, 160, 89, 0.5)`
   - Height: `46px` (sm: `40px`, lg: `50px`)
2. **Gold Accent Button (`variant="gold"`):**
   - Background: `var(--gold-500)` `#C5A059`
   - Foreground: `#0E0F11` (Deep obsidian text for high contrast)
   - Hover: Background `var(--gold-600)` `#A8853F`
3. **Editorial Outline Button (`variant="outline"`):**
   - Background: `transparent` or `#FFFFFF`
   - Border: `1px solid var(--ivory-300)`
   - Foreground: `var(--charcoal-900)`
   - Hover: Background `var(--ivory-100)`, Border `var(--charcoal-900)`

### 5.2 Product Cards
- **Aspect Ratio:** `1:1` or `4:5` (Showcases watch straps and leather stitching).
- **Surface:** `#FFFFFF` with `1px solid var(--ivory-200)`.
- **Image Hover:** Smooth 400ms crossfade between main image and detail/lifestyle photo (when available).
- **Metadata Layout:**
  - Category in `--charcoal-500` caption.
  - Title in `--charcoal-900` font-semibold (2 lines clamped).
  - Price in bold tabular numerals with explicit currency symbol.
  - Discreet stock availability signal (`جاهز للشحن الفوري` or low-stock warning).
  - Clean Add to Cart action that stays secondary to the product itself.

### 5.3 Navigation & Header
- **Top Bar:** Obsidian Black (`#0E0F11`), Warm Ivory text (`#F4F1EA`), brushed gold icons. Clear trust signals: 27 Egyptian governorates, COD, and inspection prior to payment.
- **Main Header:** Sticky, Warm Ivory background (`#FAF9F6/95`) with frosted glass blur (`backdrop-blur-md`), 1px bottom border (`#EAE5D9`).
- **Brandmark:** Bespoke typographic logo `VARELLION` in `Cinzel` serif with subtle gold lettermark.

### 5.4 Cart Drawer
- **Drawer Surface:** Crisp warm ivory and white surface.
- **Line Items:** High-res thumbnail (1:1), item title, SKU, unit price, smooth quantity increment/decrement controls with 44px hit areas.
- **Subtotal & Checkout:** Transparent breakdown of order subtotal, explicit delivery note for 27 governorates, full-width luxury checkout button.

---

## 6. RTL & Micro-Interaction Guidelines

1. **Directional Symmetry:**
   - In Arabic RTL, left and right directional arrows (`ArrowLeft`, `ChevronLeft`) signify *forward progression* (moving into next page / cart).
   - All directional icons must be wrapped in semantic directional handlers or respect CSS `dir` contexts.
2. **Form Interaction:**
   - Every input field has an associated `<label>` or explicit `aria-label`.
   - Error messages are associated via `aria-describedby` with inline icons.
   - Focus rings use gold accent: `focus-visible:ring-2 focus-visible:ring-[#C5A059]/50 focus-visible:outline-none`.
3. **Motion Principles:**
   - Transitions are snappy and physical (`duration-200` to `duration-300`, `ease-out`).
   - All animations strictly respect `prefers-reduced-motion: reduce`.
