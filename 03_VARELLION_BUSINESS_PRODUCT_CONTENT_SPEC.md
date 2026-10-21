# VARELLION Accessories — Business & Product Content Specification

> **Document ID:** `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md`  
> **Document Type:** Business, Product, and Website Content Rules  
> **Project:** VARELLION Accessories  
> **Version:** 2.1.0  
> **Last Updated:** 2026-10-10  
> **Primary Locale:** Arabic (`ar`, RTL)  
> **Secondary Locale:** English (`en`, LTR)  
> **Status:** Specification; business data that requires owner confirmation is maintained in file `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md`.

---

## 1. Purpose and Scope

This document defines the business and content rules for the VARELLION Accessories website. It covers brand messaging, customer-facing product content, category taxonomy, product-data meaning, pricing and availability rules, localization, SEO, and content governance.

Use it when creating or modifying:

- Website copy and product descriptions
- Product and category content
- Product metadata and SEO fields
- FAQ and customer-facing messages
- Promotions, bundles, and related-product recommendations when approved
- Business content consumed by the frontend

### Scope boundaries

Each document has one primary responsibility:

| Document | Primary responsibility |
|---|---|
| `00_VARELLION_MASTER_BUILD_PROMPT.md` | Overall build instructions, project scope, and implementation workflow |
| `01_VARELLION_BRAND_IDENTITY_AND_DESIGN_SYSTEM.md` | Visual identity, design tokens, typography, component styling, and visual voice |
| `02_VARELLION_UI_UX_SPECIFICATION.md` | Page structure, customer journeys, interactions, UI states, and responsive UX |
| `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md` | Business rules, product-content standards, categories, claims, and SEO rules |
| `04_VARELLION_FRONTEND_ARCHITECTURE.md` | Canonical TypeScript/domain types, routes, service boundaries, localization implementation, and technical architecture |
| `05_VARELLION_AI_IMPLEMENTATION_RULES.md` | AI change procedure, safety constraints, review gates, and test expectations |
| `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` | Owner-approved live business values, seed catalog, contact links, purchase flow, and approved site/legal content |
| `07_VARELLION_MARKETING_CONTENT_GUIDE.md` | Optional social-media planning and channel-specific marketing guidance; not a source of product facts |

Do not duplicate page layouts, design tokens, or TypeScript interfaces here. When a technical representation is needed, file `04` owns the exact implementation. When an actual business value is needed, file `06` must supply it or point to another explicitly approved source.

## 2. Source-of-Truth Rules

Use the following precedence for business facts and publishing decisions:

1. Explicit, current approval from the business owner.
2. Current approved value or asset in file `06`, or another owner-designated verified data source.
3. The business and content rules in this document.
4. Existing published content, only if it remains verified and has not been superseded.
5. AI-generated suggestions, which are proposals only and never evidence.

A suggestion is not an approved fact. Do not infer missing information from a product name, a competitor page, a supplier category, general market knowledge, or AI knowledge.

## 3. Brand Overview and Positioning

### Official brand name

**VARELLION Accessories**

Use `VARELLION` as a compact text mark where appropriate and `VARELLION Accessories` when the full name is useful. Never use the legacy name `NAYLO`.

### Business category

Consumer electronics and technology accessories.

### Business model direction

The intended direction is an online, commerce-oriented technology-accessories brand. The exact launch market, currency, fulfillment terms, customer-service channels, and purchase flow must be confirmed in file `06`; do not silently assume them.

### Positioning statement

Working brand positioning: VARELLION aims to make everyday technology accessories easier to discover, understand, compare, and choose through clear product information and a straightforward digital experience.

This is a positioning statement, not proof of product quality, delivery performance, inventory, supplier relationships, or customer satisfaction.

### Working brand message

> Technology accessories that fit your everyday life.

Treat this as proposed brand copy until the owner confirms it for publication. Do not convert it into unsupported product or service claims.

### Brand personality

- Modern and practical
- Clear and helpful
- Friendly without excessive slang
- Confident without aggressive selling
- Customer-focused and truthful
- Visually considered without implying luxury pricing

Avoid exaggerated claims, artificial urgency, fake scarcity, unsupported superlatives, or misleading use of words such as “guaranteed,” “official,” “best,” or “cheapest.”

## 4. Audience and Customer Needs

The initial audience hypothesis includes smartphone users, students, young professionals, gamers, content creators, technology enthusiasts, and people looking for practical accessories. The estimated age range of 16–35 is a planning assumption, not a verified customer demographic.

Potential purchase considerations include:

- Price and value
- Device compatibility
- Product appearance and practicality
- Clear specifications
- Availability
- Delivery and payment information
- Returns and warranty terms
- Ease of contacting the business

Use these needs to organize useful information, not to make unverified claims about actual customer behavior.

## 5. Customer Journey and Content Priorities

Content should support this general journey:

`Awareness → Discovery → Consideration → Purchase or contact → Post-purchase support → Retention`

At each step, prioritize:

1. Accuracy
2. Customer trust
3. Clarity
4. Useful product information
5. Consistent brand voice
6. Search discoverability
7. Conversion

Conversion must never override accuracy or customer trust. Purchase, delivery, payment, and post-purchase promises must match the actual owner-approved process.

## 6. Brand Voice and Writing Rules

### Voice

Clear, modern, practical, friendly, concise, and human.

### Arabic

Arabic is the default language for the first release. Write natural, clear Arabic rather than literal English translations. Avoid excessive formality where it reduces clarity, excessive slang, and unnecessary emojis. Preserve internationally recognized technical names when they are clearer, for example `USB-C`, `Bluetooth`, `MagSafe`, `Wi-Fi`, and `Power Bank`.

### English

Write natural, plain English. Avoid artificial corporate language, keyword stuffing, excessive jargon, and exaggerated marketing claims.

### General rules

- Lead with the product's actual function or customer-relevant benefit.
- Keep paragraphs short and descriptions scannable.
- Use technical terms only when supported by the product data.
- Do not imply that every product is premium, durable, certified, compatible, fast-charging, waterproof, or covered by a warranty unless evidence supports that specific claim.
- Translations must preserve the same business meaning, but do not need to be literal word-for-word translations.
- Do not invent brand history, manufacturer relationships, certifications, customer counts, sales numbers, reviews, or service guarantees.

## 7. Official Category Taxonomy

Use these six top-level categories and their approved labels consistently. Do not add alternative labels or duplicate categories without owner approval.

| Stable slug | English label | Arabic label |
|---|---|---|
| `mobile-accessories` | Mobile Accessories | إكسسوارات الهواتف |
| `audio` | Audio | الصوتيات |
| `power` | Power | الطاقة والشحن |
| `smart-accessories` | Smart Accessories | الإكسسوارات الذكية |
| `computer-desk` | Computer & Desk | ملحقات الكمبيوتر والمكتب |
| `gaming` | Gaming | الألعاب وملحقاتها |

### Category guidance

- **Mobile Accessories:** cases, screen protectors, phone holders, cables, adapters, and other phone accessories when confirmed in the catalog.
- **Audio:** earbuds, headphones, speakers, and audio accessories when confirmed in the catalog.
- **Power:** chargers, power banks, charging stations, wireless chargers, and related power products when confirmed in the catalog.
- **Smart Accessories:** smart watches, smart bands, trackers, and smart gadgets when confirmed in the catalog.
- **Computer & Desk:** USB hubs, laptop accessories, input-device accessories, desk gadgets, and cable-management products when confirmed in the catalog.
- **Gaming:** controllers, gaming headsets, and other gaming accessories when confirmed in the catalog.

These examples describe the taxonomy; they are not evidence that VARELLION currently sells those items.

### Category governance

Before introducing a category:

1. Check whether the product belongs to one of the six existing categories.
2. Check whether a subcategory is sufficient.
3. Add a new top-level category only after explicit approval.

Category labels and slugs must be sourced from the canonical category configuration. Do not translate the same category independently in several components.

## 8. Product Data Contract

The exact TypeScript `Product`, category, publication-state, and availability types must be defined once in `04_VARELLION_FRONTEND_ARCHITECTURE.md`. This document defines the business meaning of the data; it does **not** create a competing TypeScript interface.

A product record may need the following concepts when applicable:

| Data concept | Rule |
|---|---|
| Stable ID | Unique internal identity; not a substitute for the public slug |
| Slug | Readable, unique, URL-safe identifier defined consistently with file `04` |
| Name | Approved Arabic and English names where both locales are required |
| Short description | Concise, factual, localized summary |
| Full description | Detailed copy based only on verified product information |
| Category | One approved category slug from Section 7 |
| Subcategory | Optional and governed; do not invent taxonomy |
| Brand/manufacturer | Include only when supplied and verified |
| Price | Numeric value only when approved and known; never use a display string as the underlying price |
| Currency | Explicit approved currency; do not assume a currency from the user's location |
| Comparison price / discount | Only when both the commercial rule and source values are verified |
| Publication state | Whether the product is eligible to appear publicly; separate from stock availability |
| Availability | Actual known stock/availability state, supplied by the approved data source |
| Images | Real, approved assets or clearly marked development placeholders not presented as real product photos |
| Image alt text | Localized and accurate description of the actual image |
| Specifications | Category-specific technical facts only when supplied and verified |
| Compatibility | Explicit supported-device information; do not infer from connector or product name alone |
| Variants | Only real, selectable variants with valid data |
| SKU / tags | Optional business identifiers and search facets, not customer-facing claims by default |
| SEO fields | Localized and accurate page-specific metadata |
| FAQ / shipping / returns / warranty | Include only when approved, relevant, and supported by current business data |
| Package contents / instructions | Include only when verified for that exact product |

The architecture document decides the exact property names, nullability, and enum spellings. Catalog data and UI code must use that one definition.

## 9. Publication State and Availability

Publication eligibility and inventory availability are separate concepts.

### Publication eligibility

A product must not be publicly listed unless it is approved for publication and has the required minimum information. Draft or archived content must not leak through public listing pages, product detail pages, search results, related-product slots, or structured data.

### Availability meanings

Use the following business meanings where the canonical model in file `04` supports them:

| Meaning | Arabic label | English label | Rule |
|---|---|---|---|
| In stock | متوفر | In stock | Only with current, reliable evidence |
| Low stock | الكمية محدودة | Low stock | Only when a reliable source explicitly supports the threshold |
| Out of stock | غير متوفر حاليًا | Out of stock | Only when actual availability is known |
| Coming soon | قريبًا | Coming soon | Only when the business has approved the upcoming listing |
| Discontinued | متوقف | Discontinued | Only when the product has been officially discontinued |
| Unknown | Do not display a stock claim | Do not display a stock claim | Unknown is an internal data state, not a customer-facing label |

The canonical code values and any allowed state transitions belong in file `04`. Never derive “low stock” from a guess or invent inventory quantities.

## 10. Data Confidence and Evidence

Maintain source/provenance for important facts in the source data or content workflow. Useful internal confidence labels include:

- `VERIFIED`: checked against a reliable, current source or owner approval.
- `SUPPLIER_PROVIDED`: supplied by a supplier but not independently checked; do not imply independent verification.
- `OWNER_PROVIDED`: provided or approved by the business owner.
- `UNKNOWN`: not known; must not be converted into a factual claim.

The exact field structure for provenance is an implementation decision in file `04` or `06`; the labels here define their intended meaning only.

For high-impact claims such as price, compatibility, charging output, water resistance, warranty, safety certifications, and availability, retain an identifiable source or explicit owner approval before publishing.

## 11. Product Naming and Descriptions

### Product names

Product names should be clear, concise, readable, and useful for search. Include brand, product type, and a distinguishing feature only when the information is real and helpful.

Do not add unsupported model names, specifications, compatibility statements, speed claims, or promotional superlatives.

### Description structure

Use only the sections supported by the actual product data:

1. **Product overview:** what the product is.
2. **Practical use:** what it can help the customer do, without guaranteeing an outcome.
3. **Key features:** factual features with a known source.
4. **Specifications:** measurable facts only when available.
5. **Compatibility:** confirmed supported or unsupported devices, when known.
6. **What's included:** confirmed package contents.
7. **Usage or care:** only when supported by product instructions.

Do not force every section into every product page. Omit unsupported sections rather than filling them with generic claims.

## 12. Product Card and Product Detail Content

File `02_VARELLION_UI_UX_SPECIFICATION.md` owns the single canonical display order and behavior for product cards and details pages.

Business content rules:

- Use the approved localized product name and concise description.
- Display price only when the price and currency are known and approved.
- Display availability only when the underlying availability value is reliable and current.
- Show comparison price, discount, rating, review count, “best seller,” “new,” or “popular” only when the data exists, is current, and the label has an approved business definition.
- Never fill visual space with fabricated ratings, badges, specifications, or customer statements.
- Use a product-detail action when no purchase action has been approved. Do not invent an add-to-cart action solely to make the card look complete.

## 13. Pricing Rules

All prices and commercial terms must be sourced from an approved record in file `06` or another owner-designated source.

- Store prices as numeric values with an explicit currency in the canonical model.
- Format prices according to the approved locale and currency rules; never assume that EGP or any other currency is confirmed until file `06` says so.
- Do not replace a missing price with zero.
- Do not invent a comparison price, discount amount, percentage, or sale period.
- A discount may be calculated only from verified eligible values and an approved commercial rule. It must not be generated merely because an old and current price field happen to exist.
- If price is missing, never render internal values such as `PRICE_TO_BE_DEFINED`. Hide the price and use only an owner-approved next step. If the product cannot be represented honestly without a price, keep it unpublished until resolved.
- Tax, payment fees, delivery charges, and total-order calculations must not be guessed.

## 14. Promotions, Bundles, Cross-Selling, and Upselling

These are possible future merchandising features, not a claim that any offer currently exists.

### Promotions

A promotion must have an approved definition, eligible products/categories, value, start/end time where relevant, terms, and a reliable activation state. Do not present an offer until the business data confirms that it is active and valid.

Possible promotion concepts include percentage discount, fixed discount, bundle offer, free shipping, product/category discount, and limited-duration sale. These names do not authorize implementation or imply any active promotion.

### Bundles

A bundle may be displayed only when its included products, compatibility, combined price, and terms are verified. Do not create bundles from plausible but unconfirmed catalog examples.

### Cross-selling and upselling

Recommend related products only when the relationship is real and defensible, and compatibility is confirmed where relevant. Do not recommend an item simply because it shares a keyword. Do not use manipulative upselling or preselected extras.

## 15. Homepage Content Rules

The canonical homepage section order and behavior are defined in file `02`. This document supplies business-content constraints only.

- A category section may use only approved categories and actual catalog entries.
- “Best sellers” requires reliable sales data and an agreed definition; otherwise omit the section.
- “New arrivals” requires approved product publication dates or an explicit merchandising flag.
- “Deals” requires a current, verified promotion.
- “Featured product” requires an owner-approved feature selection.
- Bundles require real, approved bundle data.
- Testimonials, ratings, customer counts, and other social proof require authentic, permissioned evidence.
- “Why VARELLION” copy must describe the intended experience rather than imply unverified service or quality claims.
- FAQ sections require approved questions and answers.
- If data is unavailable, omit optional sections. Do not add filler to meet a section count.

## 16. Calls to Action and Purchase Content

CTA labels must accurately describe the action that will occur. File `02` defines placement and interaction; file `06` defines the approved business purchase/contact flow.

Examples of labels may include:

- Arabic: `تصفح المنتجات`، `عرض التفاصيل`، `تواصل معنا`، `أضف إلى السلة`، `اشترِ الآن`
- English: `Shop products`, `View details`, `Contact us`, `Add to cart`, `Buy now`

Use an action only when its route or destination actually exists and its behavior is implemented. Do not show a checkout, cart, WhatsApp, or order-confirmation flow unless it has been explicitly approved and works end to end.

Never state that an order was submitted or confirmed merely because a client-side button was clicked or an external application was opened.

## 17. Shipping, Returns, Refunds, and Warranty

Actual terms belong in file `06` and must be explicitly approved before public release.

Potential information fields include:

- Shipping method, coverage, cost, processing time, estimated delivery, and tracking
- Return and exchange eligibility, time limits, condition requirements, and process
- Refund method and timing
- Cancellation and damaged/missing-item process
- Warranty duration, provider, coverage, exclusions, and claim process

These lists do not define any policy. Do not invent legal, financial, shipping, return, refund, or warranty terms.

If a required policy is unknown, do not publish a fabricated policy or expose internal tokens like `SHIPPING_TO_BE_DEFINED`, `RETURN_POLICY_TO_BE_DEFINED`, or `WARRANTY_TO_BE_DEFINED`. Record the missing decision for the owner. Required legal content must be approved before production launch.

## 18. FAQ Rules

FAQ content must answer real, anticipated customer questions using confirmed facts. Potential topics include product compatibility, installation, charging, availability, shipping, payment, returns, and warranty.

- Do not invent policy answers to make a FAQ feel complete.
- Do not publish product-specific answers without product-level evidence.
- Keep Arabic and English answers semantically equivalent.
- Store approved answers in the canonical content data rather than duplicating them in components.
- If there are no approved FAQs, omit the FAQ section instead of inventing questions and answers.

## 19. SEO and Search Content

Each public, indexable product or category page should support appropriate localized metadata as defined in file `04` and used by the routes in the architecture.

SEO content should:

- Match the actual page and product.
- Use accurate, readable page titles and meta descriptions.
- Use stable, readable slugs.
- Avoid keyword stuffing and misleading claims.
- Use canonical URLs and structured data only when the underlying values are valid.
- Keep Arabic and English metadata natural for the active locale.
- Avoid publishing structured product offers, reviews, ratings, price, or availability unless the values are verified and current.

Character-count ranges for titles or descriptions are editorial guidance, not a reason to distort the meaning or invent claims. The architecture owns canonical URL and locale-route implementation.

## 20. Arabic and English Localization

Arabic is the default locale (`ar`) and uses RTL. English uses LTR. File `04` defines route, dictionary, and technical locale implementation; file `02` defines UX expectations.

Content rules:

- Provide localized names, descriptions, category labels, CTA strings, error/empty messages, and SEO metadata for both locales wherever the page is available in both.
- Do not ship mixed-language interface strings caused by missing translations.
- Keep product facts identical across locales; translation must not add or remove specifications, conditions, or promises.
- Use the stable category labels from Section 7.
- Preserve technical terms such as `USB-C` and `Bluetooth` when they are clearer than forced translations.
- Format number, currency, and date values using the approved locale and business currency configuration.
- If a specific product translation is missing, follow the fallback defined in file `04`; do not improvise a conflicting translation in an individual component.

## 21. Customer-Facing Empty and Error Content

Customer-facing messages should be brief, respectful, localized, and useful. They must not expose stack traces, database details, internal service names, or raw API errors.

Suggested neutral strings, subject to integration with the translation source:

| State | Arabic | English |
|---|---|---|
| No search matches | لم نعثر على منتجات تطابق بحثك. | We couldn't find products matching your search. |
| Empty category | لا توجد منتجات متاحة في هذه الفئة حاليًا. | No products are currently available in this category. |
| Known out of stock | هذا المنتج غير متوفر حاليًا. | This product is currently unavailable. |
| Generic recoverable error | حدث خطأ. يُرجى المحاولة مرة أخرى. | Something went wrong. Please try again. |

Only use the out-of-stock message when that status is known. Do not confuse an empty catalog, no search results, unknown inventory, and a failed data request. Recovery actions must be real and relevant.

## 22. Reviews and Social Proof

Never generate or simulate:

- Customer reviews, reviewer names, testimonials, or customer stories
- Ratings or review counts
- Customer, order, or sales counts
- “Best seller,” “most popular,” or satisfaction claims without supporting data
- Certifications, partnerships, awards, or media mentions

If no verified reviews or social proof exist, omit those elements. Do not render empty stars, fake averages, or invented JSON-LD review values.

## 23. Category-Specific Product Attributes

Attribute sets may vary by category. The following are examples of possible fields, not a request to populate them without evidence.

| Category / type | Possible fields |
|---|---|
| Cables | Length, connector type, supported power, data-transfer specification, material, compatibility |
| Earbuds / headphones | Battery information, connection standard, charging type, microphone details, noise cancellation, water-resistance rating |
| Power banks | Capacity, input/output, ports, supported charging standards, dimensions, weight |
| Chargers | Rated output, ports, input, charging standards, compatibility |
| Smart watches | Display, battery information, connectivity, sensors, water-resistance rating, compatibility |
| Computer / desk accessories | Dimensions, interface/ports, compatibility, included components |
| Gaming accessories | Supported platform, connection type, compatibility, included components |

Display only the fields that apply to the actual product and have verified values. Do not infer specifications from category membership, appearance, or the product's marketing name.

## 24. Approved Data and Seed Catalog

File `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md` is the required location for owner-approved first-release values, including:

- Actual launch market, currency, and number/currency display rules
- Approved catalog entries, prices, category assignments, images, and product facts
- Business contact channels and social profile URLs
- Purchase/contact model and actual destinations
- Approved FAQ content
- About-page business facts
- Privacy, Terms, shipping, returns, refunds, and warranty copy where applicable
- Any verified promotional or merchandising selections

Do not fill that file with invented “realistic” products or business details. If development fixtures are separately authorized, label them as fixtures and ensure the production site cannot mistake them for approved live catalog data.

## 25. Content Validation Before Publication

Before publishing a product or business-content change, verify:

- [ ] Correct VARELLION name and approved brand voice
- [ ] Product identity and category are approved
- [ ] Arabic and English content preserve the same facts
- [ ] Price and currency are confirmed, or no price claim is displayed
- [ ] Stock/availability is supported by current data
- [ ] Specs and compatibility have a traceable source
- [ ] Images are actual approved assets or explicitly non-production placeholders
- [ ] Discounts and promotions are valid and currently active
- [ ] Reviews, ratings, and social proof are authentic and authorized
- [ ] Shipping, return, refund, and warranty wording is approved
- [ ] CTA matches a real implemented action
- [ ] SEO metadata describes the actual page
- [ ] No internal placeholder token is exposed to customers
- [ ] No unsupported claims or fabricated statistics remain

If a required item cannot be verified, do not silently check it off. Record the blocker and request the missing approval or source.

## 26. Human Approval Required

Explicit owner approval is required before materially changing:

- Brand positioning or brand promise
- The official top-level categories
- Price/currency rules or commercial pricing
- Promotion eligibility, dates, or terms
- Purchase flow or payment approach
- Shipping, return, refund, and warranty policy
- Legal statements and privacy-related claims
- Product compatibility, performance, or safety claims
- Use of customer testimonials, logos, endorsements, or social proof
- Major business messaging

AI may propose alternatives but must distinguish proposals from approved decisions.

## 27. Missing-Data Policy

`UNKNOWN`, `TO_BE_DEFINED`, and other internal markers may be used in internal records to track missing information, but they are not customer-facing copy.

When information is missing:

1. Do not guess.
2. Do not show internal tokens in the website UI, metadata, structured data, or customer emails.
3. Omit optional claims or sections when safe to do so.
4. Do not publish a product or legal page when required information is missing and publication would mislead users or violate launch requirements.
5. Use a neutral customer-facing message only when it is true, useful, and approved for the relevant flow.
6. Record unresolved business decisions in file `06` or the project decision log.

Examples of internal-only markers include `PRICE_TO_BE_DEFINED`, `SHIPPING_TO_BE_DEFINED`, `WARRANTY_TO_BE_DEFINED`, `RETURN_POLICY_TO_BE_DEFINED`, and `SPECIFICATION_UNKNOWN`. These must never appear in rendered customer content.

## 28. Change Management

For material changes to this specification, update the version, date, and concise change summary. Business-critical values in file `06` should also retain their source or approval status where practical.

Suggested change log:

| Version | Date | Summary |
|---|---|---|
| 2.1.0 | 2026-10-10 | Standardized bilingual categories, clarified missing-data handling, separated publication state from availability, defined ownership across project documents, and moved social-channel planning into a separate guide. |

## 29. Final Content Governance Rule

Before generating or changing VARELLION content, verify:

1. Is the fact supported by an approved source?
2. Does the content follow the brand voice?
3. Do the Arabic and English versions communicate the same facts?
4. Does the category/product data follow the approved model?
5. Are price, stock, compatibility, and commercial terms verified?
6. Does the call to action do what it claims?
7. Are all claims truthful and properly qualified?
8. Are unresolved values kept internal rather than displayed to customers?

If a required answer is no or unknown, correct the content, remove the unsupported claim, or record the blocker before publication.

> **Master principle:** VARELLION should make everyday technology accessories easier to understand and choose by communicating clearly, accurately, and honestly.

---

**Document:** `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md`  
**Technical model owner:** `04_VARELLION_FRONTEND_ARCHITECTURE.md`  
**Approved live data owner:** `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md`

