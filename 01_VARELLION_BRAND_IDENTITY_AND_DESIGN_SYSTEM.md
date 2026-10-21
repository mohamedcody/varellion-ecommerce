# VARELLION Accessories — Brand Identity & Design System

> **Document role:** The single source of truth for the VARELLION visual identity, design tokens, typography, reusable visual treatments, and brand voice.
>
> **Scope:** This document defines how the interface should look and feel. Page structure and UX behavior belong to `02_VARELLION_UI_UX_SPECIFICATION.md`; factual business/product content belongs to `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md` and owner-approved values belong to `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md`; implementation architecture belongs to `04_VARELLION_FRONTEND_ARCHITECTURE.md`.

---

## 1. Brand Core

### Official brand name

**VARELLION Accessories**

Use `VARELLION` for a compact text mark where space is limited and `VARELLION Accessories` where the full brand name is appropriate. Do not use the legacy name NAYLO or any other brand name.

### Visual positioning

Present VARELLION as a modern, practical, approachable technology-accessories brand through a clear, calm, product-focused shopping experience. This is a visual and communication direction, not a claim about product quality, stock, service guarantees, or business history.

### Brand personality

- Modern and technically aware
- Calm, clear, and dependable in tone
- Practical and friendly
- Thoughtful and premium in presentation without implying luxury pricing
- Confident without aggressive sales language

### Avoid

- Neon cyberpunk or crypto-like visuals
- Large black surfaces as the default theme
- Unsubstantiated luxury or quality cues
- Excessive gradients, glassmorphism, or 3D decoration
- Childish illustrations or generic SaaS visuals
- Excessive animation, badges, cards, or decorative icons
- Fake urgency, exaggerated claims, or unsupported trust indicators

---

## 2. Non-Negotiable Visual Direction

The visual language is **clean, warm, technical, and commercial**.

Build visual character through typography, spacing, restrained teal accents, consistent image treatment, quiet borders, and clear hierarchy. Do not depend on gradients, animation, or decorative assets to make the experience feel designed.

### Theme

- The first release supports **light mode only**.
- Do not implement a dark-mode toggle or add dark-theme tokens in the first release.
- Components must still use semantic tokens rather than hardcoded colors so a future theme can be introduced deliberately.
- The page background, surfaces, and controls must remain readable and consistent across every public page.

### Visual priority

1. Readable content and product information
2. Neutral page and surface backgrounds
3. Primary text and clear hierarchy
4. Brand color for meaningful actions and selected states
5. Muted borders and secondary elements
6. Status colors only when they convey a real status

Do not place more than one dominant primary action in a single visual group. Do not use color as the only way to communicate status.

---

## 3. Canonical Color Tokens

These values are the approved starting design tokens for the first release. They must be defined once in the global design-token layer. Do not create competing names such as `--brand-primary`, `--color-primary`, and `--color-primary-500` for the same concept.

Define all canonical CSS custom properties together in one `:root` block in the global token stylesheet. The block below is the complete token source for the first release; do not split these definitions into competing component-level blocks.

```css
:root {
  /* Brand palette */
  --color-primary-900: #12363B;
  --color-primary-700: #17565D;
  --color-primary-500: #2D7F83;
  --color-primary-300: #79B8B8;

  /* Text and neutral surfaces */
  --color-text-primary: #172126;
  --color-text-secondary: #344054;
  --color-text-muted: #667085;
  --color-border: #E4E7EC;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F8FAFA;
  --color-page: #FAFBFA;

  /* Semantic status colors */
  --color-success: #2E7D5B;
  --color-warning: #B7791F;
  --color-danger: #C44B4B;
  --color-info: #356AA5;
  --color-focus-ring: #2D7F83;
  --color-overlay: rgb(23 33 38 / 52%);

  /* Typography */
  --font-family-arabic: "IBM Plex Sans Arabic", sans-serif;
  --font-family-latin: "Inter", sans-serif;

  /* Borders and radii */
  --border-width-default: 1px;
  --border-style-default: solid;
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 9999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-30: 120px;

  /* Elevation */
  --shadow-sm: 0 1px 3px rgb(16 24 40 / 6%);
  --shadow-md: 0 4px 20px rgb(16 24 40 / 6%);
  --shadow-lg: 0 12px 32px rgb(16 24 40 / 10%);

  /* Motion */
  --duration-micro: 150ms;
  --duration-standard: 200ms;
  --duration-emphasis: 280ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

### Color usage

| Token | Use |
|---|---|
| `--color-primary-900` | Strongest brand emphasis, deep hover/active surfaces where appropriate |
| `--color-primary-700` | Default primary button background and high-emphasis brand controls |
| `--color-primary-500` | Brand accents, links where contrast is verified, selected indicators, decorative details used sparingly |
| `--color-primary-300` | Subtle accents and non-text decorative fills; do not use for small text on white |
| `--color-text-primary` | Headings and primary body content |
| `--color-text-secondary` | Supporting text and secondary labels |
| `--color-text-muted` | Low-priority metadata only when contrast remains sufficient |
| `--color-border` | Input borders, separators, and quiet component boundaries |
| `--color-surface` | Cards, dialogs, menus, and controls on a page background |
| `--color-surface-soft` | Subtle inset areas, secondary panels, and hover backgrounds where appropriate |
| `--color-page` | Main page background |
| `--color-success`, `--color-warning`, `--color-danger`, `--color-info` | Semantic feedback only, never general decoration |

### Contrast rules

- Normal text must meet WCAG AA contrast (at least 4.5:1); large text must meet at least 3:1.
- Interactive controls and meaningful graphical indicators must have sufficient contrast against adjacent colors.
- Verify actual token combinations during implementation; do not assume every color in the palette is suitable for text.
- Do not use `--color-primary-300` or muted text for small text on a white background unless a contrast check confirms it passes.
- Disabled states must be visibly disabled but still understandable. Do not rely on color alone to communicate that state.

---

## 4. Typography System

Use exactly two font families:

- **Arabic:** IBM Plex Sans Arabic
- **English and Latin characters:** Inter

Do not choose alternative fonts at implementation time and do not load multiple competing font families. Load only the weights required by the scale below. The technical details for loading and configuring fonts belong to `04_VARELLION_FRONTEND_ARCHITECTURE.md`.

### Approved weights

- `400` — Regular body copy
- `500` — Medium labels and secondary emphasis
- `600` — Buttons, card titles, and section headings
- `700` — High-emphasis headings only

Do not use arbitrary font weights outside this set unless a documented accessibility or rendering issue requires a deliberate revision to this file.

### Type scale

Values are CSS pixels. Use the responsive sizes below rather than inventing a different scale on individual pages.

| Role | Desktop (≥ 1024px) | Tablet (768–1023px) | Mobile (< 768px) | Weight | Line-height |
|---|---:|---:|---:|---:|---:|
| Display | 56px | 44px | 36px | 700 | 1.15 |
| H1 | 44px | 36px | 32px | 700 | 1.20 |
| H2 | 36px | 30px | 26px | 600 | 1.25 |
| H3 | 24px | 24px | 22px | 600 | 1.30 |
| H4 | 20px | 20px | 18px | 600 | 1.35 |
| Body large | 18px | 18px | 17px | 400 | 1.70 Arabic / 1.60 English |
| Body | 16px | 16px | 16px | 400 | 1.70 Arabic / 1.60 English |
| Small | 14px | 14px | 14px | 400 or 500 | 1.55 |
| Caption | 12px | 12px | 12px | 500 | 1.50 |
| Button | 15px | 15px | 15px | 600 | 1.20 |

### Typography rules

- Keep the semantic HTML heading order correct; do not choose heading tags based only on their appearance.
- Body content should be comfortable to read on a phone and must not be reduced to fit a dense layout.
- Use the Arabic font for Arabic text and the Latin font for English text. Mixed-language strings must render cleanly without awkward font switching.
- Use logical alignment and spacing so the same hierarchy works in RTL and LTR.
- Do not use all-caps for long English copy. The brand wordmark may use uppercase `VARELLION`.
- Avoid long lines of text and avoid setting body copy in very light font weights.

---

## 5. Spacing Tokens

Use a consistent 4px-based spacing scale. Define these tokens once and reuse them; do not introduce arbitrary margin or padding values without a documented layout need.

The approved spacing variables are `--space-1` through `--space-30`, with values from 4px through 120px as defined in the canonical token block above. Do not create additional aliases for these values.

### Spacing rules

- Use the nearest approved token for component gaps and padding.
- Use larger spacing between page sections than between related elements inside a component.
- Keep repeated components aligned to the same spacing rhythm.
- The exact page container width, responsive gutters, and product-grid columns are defined in `02_VARELLION_UI_UX_SPECIFICATION.md`; do not redefine them here.

---

## 6. Radius Tokens

The approved variables are `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, and `--radius-pill`, defined in the canonical token block above.

Usage:

- Inputs and buttons: `--radius-sm` to `--radius-md`
- Standard cards: `--radius-md` to `--radius-lg`
- Large feature surfaces and dialogs: `--radius-lg` to `--radius-xl`
- Fully rounded chips: `--radius-pill`, only when the pill shape serves the component

Do not mix unrelated corner radii within the same component family.

---

## 7. Elevation and Borders

### Shadow tokens

Use the three elevation variables from the canonical token block above: `--shadow-sm`, `--shadow-md`, and `--shadow-lg`.

Use `--shadow-sm` for subtle separation, `--shadow-md` for components that need clear elevation, and `--shadow-lg` only for overlays such as a dialog or popover when necessary. Most product cards should rely on spacing and a quiet border rather than a heavy shadow.

### Border rules

- Default border: `1px solid var(--color-border)`.
- Use borders to clarify boundaries, not to outline every nested element.
- Focus indicators must remain distinguishable from regular borders.
- Do not use a darker border as the only indication of an error; pair it with a textual error message and an appropriate semantic status.

---

## 8. Button System

Use three button variants. Each component must support the relevant hover, pressed, focus-visible, disabled, and loading states. Button labels should describe the action and must not be fabricated from an unapproved business flow.

### Primary

- Background: `--color-primary-700`
- Text: `--color-surface`
- Hover background: `--color-primary-900`
- Pressed background: `--color-primary-900`
- Border: transparent
- Use for the principal action in a section or form.

### Secondary

- Background: `--color-surface`
- Text: `--color-primary-900`
- Border: `1px solid var(--color-border)`
- Hover background: `--color-surface-soft`
- Pressed background: `--color-surface-soft`
- Use for useful alternative actions that must remain visually below the primary action.

### Text / Tertiary

- Background: transparent
- Text: `--color-primary-700`
- Border: transparent
- Hover background: `--color-surface-soft`
- Pressed text: `--color-primary-900`
- Use for low-emphasis actions that do not need a filled or bordered surface.

### Shared button rules

- Minimum control height: 44px.
- Horizontal padding: 16px by default; use 20px for prominent desktop CTAs where space permits.
- Use a 10–12px radius (`--radius-sm` or `--radius-md`).
- Keep labels short and specific. Do not use vague labels such as “Click here.”
- Provide a visible focus ring using `--color-focus-ring` and a clear offset from the component.
- Disabled controls must not appear interactive and must expose their disabled state semantically.
- Icon-only buttons require an accessible name. Add a tooltip when the action is not immediately familiar.
- Do not make primary, secondary, and tertiary actions look equally important in the same group.

---

## 9. Form Controls

Form controls should feel calm, legible, and consistent with buttons.

- Use a minimum height of 44px for common touch controls.
- Use a white surface, `--color-text-primary` text, and `--color-border` outline by default.
- Use a clear visible label; placeholder text is not a substitute for a label.
- On focus, retain the border and add a visible focus ring. Do not remove the browser focus indicator without replacing it.
- Error states must include a concise text explanation associated with the relevant field.
- Helper text uses the small type style and must remain readable.
- Do not communicate validity, errors, or required fields by color alone.
- Inputs, selects, and text areas must support keyboard use and browser zoom.

---

## 10. Surfaces and Cards

Cards are a tool for grouping related content, not a default wrapper for every section.

### Standard surface

- Background: `--color-surface`
- Border: `1px solid var(--color-border)` where the boundary improves clarity
- Radius: `--radius-lg` for standard cards
- Padding: follow the spacing scale and the layout requirements in file `02`
- Shadow: none by default; use `--shadow-sm` only where it improves separation

### Product cards

The final field order, required product details, availability presentation, and CTA behavior are owned by `02_VARELLION_UI_UX_SPECIFICATION.md` and the approved product data in files `03` and `06`. This document defines presentation only:

- Use consistent image ratios and image backgrounds across the product grid.
- Keep product names easy to scan and clamp only where the UX specification permits it.
- Keep price and availability readable without relying on color alone.
- Use consistent internal spacing and align repeated elements across cards.
- Do not add ratings, discount percentages, “best seller” labels, sales counts, or badges unless the source data is real and explicitly approved.
- Never show raw missing-data identifiers or internal placeholders to customers.

---

## 11. Iconography

Use **`lucide-react`** as the sole icon library for the first release. Do not mix it with emoji icons, unrelated SVG icon packs, or another icon library for interface controls.

Rules:

- Use consistent stroke style and optical size.
- Standard inline icons: 16–20px; prominent interface icons: 20–24px.
- Align icons to the visual center of their text or control.
- Prefer a visible text label when the action may be unclear.
- Icon-only buttons need meaningful accessible names.
- Decorative icons must be hidden from assistive technology when they convey no additional meaning.
- Use direction-aware icons for navigation where appropriate. Do not mechanically mirror every icon in RTL.
- Do not use icons as a substitute for meaningful labels or required instructions.

---

## 12. Imagery and Product Assets

### Product imagery

Product images should be product-focused, well-lit, visually consistent, and appropriate to the real catalog item.

- Use approved product assets from the project or asset paths supplied by the owner.
- Do not invent product photos, packaging, logos, partner brands, specifications, or product variants.
- Do not present random stock photography or generated product renders as real VARELLION catalog images.
- If approved product imagery is missing, use a neutral local placeholder that is clearly marked as a placeholder in code/data and is easy to replace.
- Preserve image aspect ratios and avoid distortion.
- Provide useful alt text for meaningful product images; use an empty alt value for purely decorative imagery.

### Marketing imagery

Use imagery only when it serves the brand or clarifies content. Do not add decorative hero imagery simply to fill space. Do not imply partnerships, certifications, customers, or product features through unverified imagery.

---

## 13. Logo and Wordmark

No official logo asset has been approved in this document.

Until an owner-approved logo file is supplied:

- Use a clean text-based wordmark: `VARELLION`.
- Use `VARELLION Accessories` when the full name is required.
- Do not invent a symbol, emblem, certification mark, or official logo.
- Keep the wordmark's dimensions and placement flexible enough to replace it with a real logo later without restructuring the layout.

---

## 14. Motion and Interaction Timing

Motion is optional and subordinate to clarity.

### Timing tokens

The shared motion variables are `--duration-micro`, `--duration-standard`, `--duration-emphasis`, and `--easing-standard`, all defined in the canonical token block above.

Use these ranges as the shared defaults:

- Micro feedback (hover/press): 120–180ms
- Standard UI transition: 180–240ms
- Larger overlay or page transition: 240–320ms only where it meaningfully improves continuity

Rules:

- Prefer opacity and small transform changes; avoid distracting movement.
- Do not animate every section or every element as it enters the viewport.
- Do not use motion to conceal loading, layout instability, or poor information hierarchy.
- Respect `prefers-reduced-motion` by removing non-essential movement and shortening transitions.
- Every interaction must remain understandable and usable when animation is disabled.

---

## 15. Brand Voice

Website copy should be clear, useful, concise, human, and confident. It should help visitors understand actual products and the next step without exaggeration.

### Write like this

- Use direct, helpful language.
- Prefer short sentences and specific action labels.
- Explain a benefit only when it is supported by product information.
- Use consistent terminology across pages and both languages.
- Keep friendliness professional rather than childish.

### Avoid

- “Best in the world,” “revolutionary,” and other unsupported superlatives
- Fake urgency, fake scarcity, or manipulative countdowns
- Claims about quality, warranty, speed, delivery, or compatibility that are not approved
- Empty technology jargon and repetitive marketing phrases
- Excessive emojis in website copy

The approved business-specific copy and translations belong in the content/data documents, not in this design-system file.

---

## 16. Bilingual Visual Identity

Arabic and English must feel like the same brand while respecting the conventions of each language.

- Arabic is the default locale for the first release; English is also required.
- Arabic pages use RTL direction; English pages use LTR direction.
- Use IBM Plex Sans Arabic for Arabic and Inter for English/Latin text.
- Use logical CSS properties (such as `margin-inline-start`, `padding-inline-end`, and `text-align: start`) rather than hardcoded left/right assumptions whenever appropriate.
- Test longer Arabic and English strings, mixed-language product names, numbers, prices, and punctuation.
- Do not mirror all icons or illustrations automatically. Mirror only direction-dependent symbols when the meaning requires it.
- Preserve the same spacing, hierarchy, and component behavior in both directions; do not treat RTL as a simple horizontal flip.
- Locale routing, translation dictionaries, direction configuration, and localized formatting implementation are defined in `04_VARELLION_FRONTEND_ARCHITECTURE.md`.

---

## 17. Implementation Contract

This file owns the canonical values and visual treatments defined above. To keep the implementation consistent:

1. Define the CSS custom properties in one global token block. Do not duplicate or redefine them in component stylesheets.
2. Map the tokens into Tailwind or the project's existing styling system once, using the approach selected in `04_VARELLION_FRONTEND_ARCHITECTURE.md`.
3. Components must consume semantic tokens rather than scattering raw hex values throughout the codebase.
4. If a token must change, update this source of truth and the corresponding central implementation together; do not introduce a parallel token name.
5. Do not add a new font, icon library, theme, button variant, or color family without documenting the reason and revising this file.
6. The file `02_VARELLION_UI_UX_SPECIFICATION.md` may define where components appear and what information they contain, but it must not create conflicting typography, color, spacing, or radius values.
7. Product and business information must come from the approved content/data sources. A design requirement is never permission to fabricate commercial facts.

---

## 18. Brand Quality Gate

Before considering a page visually complete, verify the following:

- [ ] It clearly belongs to VARELLION rather than a generic accessories template.
- [ ] It uses only the canonical color tokens and approved typography.
- [ ] Heading hierarchy, body text, and line heights are consistent and readable.
- [ ] Buttons use the approved primary, secondary, or text variant appropriately.
- [ ] Borders, radii, spacing, and shadows follow the shared system.
- [ ] Icons come from `lucide-react` and have accessible labels where needed.
- [ ] Real assets are not confused with placeholders.
- [ ] No fake reviews, certifications, discounts, product claims, or trust indicators appear.
- [ ] The page works in both Arabic RTL and English LTR.
- [ ] Focus states, contrast, zoom, and reduced-motion behavior remain accessible.
- [ ] The page still looks intentional with animation disabled.
- [ ] No duplicated or competing CSS token definitions were added.

If a visual decision conflicts with this document, prefer this document for brand/design tokens and record the conflict for correction in the responsible UX or architecture file.

