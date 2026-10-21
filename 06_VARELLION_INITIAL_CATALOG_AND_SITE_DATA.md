# VARELLION Accessories — Initial Catalog & Site Data

> **Document ID:** `06_VARELLION_INITIAL_CATALOG_AND_SITE_DATA.md`  
> **Purpose:** Single source of truth for owner-approved commercial facts, launch decisions, product catalog records, contact channels, and approved website/legal content.  
> **Project:** VARELLION Accessories  
> **Status:** DRAFT — owner confirmation required before publishing commercial information or enabling checkout.  
> **Primary locale:** Arabic (`ar`, RTL)  
> **Secondary locale:** English (`en`, LTR)  

---

## 1. Rules for This File

1. This file contains **business facts and decisions**, not design instructions or technical architecture.
2. A value marked `NEEDS OWNER CONFIRMATION`, `NOT PROVIDED`, `DRAFT`, or `TBD` is not approved for production use.
3. Do not invent products, prices, stock quantities, product specifications, product images, business history, contact information, delivery commitments, discounts, reviews, warranties, return terms, or legal promises to fill a blank.
4. Suggestions may be recorded as proposals, but must stay clearly separated from approved facts.
5. Do not expose internal placeholders or this approval checklist on the customer-facing website.
6. A missing optional fact should normally result in omitting that customer-facing content. A missing fact required for a feature must block that feature from being presented as live.
7. Keep Arabic and English content factually equivalent. Product or category records may remain drafts while translations are incomplete, but must not be published until both locales satisfy the publication rules in the content and backend specifications.
8. Record who approved a material decision and the approval date. Update this file when the owner changes a commercial decision.

### Status vocabulary

- `APPROVED` — explicitly confirmed by the business owner and safe to use within the approved scope.
- `DRAFT` — proposed wording or value awaiting review; not publishable as a verified fact.
- `NEEDS OWNER CONFIRMATION` — appears in another project document or is a required choice, but is not approved here yet.
- `NOT PROVIDED` — no reliable value has been supplied.
- `NOT APPLICABLE` — deliberately excluded from the approved launch model.

---

## 2. Business Identity and Launch Decisions

Complete the status and approval columns before treating these values as approved launch data.

| Decision | Current value / proposal | Status | Owner approval / date |
|---|---|---|---|
| Public brand name | VARELLION Accessories | APPROVED IN PROJECT SPECIFICATIONS | Confirm if business/legal display name differs: NOT PROVIDED |
| Website launch market | Egypt is implied by the backend specification and EGP currency; confirm exact intended service area | NEEDS OWNER CONFIRMATION | Not recorded |
| Default language | Arabic (`ar`, RTL) | APPROVED IN PROJECT SPECIFICATIONS | Existing specification |
| Secondary language | English (`en`, LTR) | APPROVED IN PROJECT SPECIFICATIONS | Existing specification |
| Currency | Egyptian pound (`EGP`) is specified for the first release | NEEDS OWNER CONFIRMATION IN THIS FILE | Not recorded |
| Launch business model | Choose one option in Section 3 | NEEDS OWNER CONFIRMATION | Not recorded |
| Website public URL / canonical domain | NOT PROVIDED | NOT PROVIDED | Not recorded |
| Legal/registered business name, if applicable | NOT PROVIDED | NOT PROVIDED | Not recorded |
| Public support email | NOT PROVIDED | NOT PROVIDED | Not recorded |
| Customer-service hours / response-time promise | NOT PROVIDED | NOT PROVIDED | Not recorded |
| Physical business address (only if intended for publication) | NOT PROVIDED | NOT PROVIDED | Not recorded |
| Approved logo / wordmark asset path | NOT PROVIDED; text-only `VARELLION` mark may be used according to the design specification | NEEDS OWNER CONFIRMATION | Not recorded |

**Rule:** The brand name and language plan are already stated consistently in the project specifications, but market, currency, public identity details, and launch model should be explicitly confirmed by the owner here before production publishing.

---

## 3. Required Launch Purchase-Model Decision

Choose exactly one primary model for the first release. Do not combine the models implicitly. Update this section and the scope in files `00`, `02`, `04`, and `08` to match the decision.

### Option A — Catalog and contact only

- [ ] **Owner decision: APPROVED**
- Visitors can browse approved products and product details.
- Only verified and approved contact destinations are displayed.
- There is no cart, checkout, order creation, stock reservation, order tracking, or order-confirmation claim in this phase.
- A WhatsApp link, if approved, opens a conversation only; it does not mean an order has been submitted or confirmed.
- Admin/order-management features remain outside this release unless separately approved.

### Option B — Working guest checkout with Cash on Delivery and WhatsApp handoff

- [ ] **Owner decision: APPROVED**
- Visitors can add approved products/variants to a working cart and submit a guest order through a real backend endpoint.
- The backend validates prices, variants, quantities, availability, and shipping; it saves the order before the handoff page is shown.
- Cash on Delivery (COD) is the intended payment method in `08`; owner approval is required before it is treated as the live payment model.
- The customer then gets a pre-filled WhatsApp message to discuss/confirm the order. Opening WhatsApp is not proof that the message was sent or that the order was confirmed.
- Order creation, stock reservation, expiry, cancellation, shipping-fee handling, guest lookup, and admin state changes must be implemented and tested before appearing live.
- The launch also requires a secured admin interface if administrators are expected to manage products, inventory, shipping, and orders.

### If neither option is approved

Continue only with non-commerce-dependent pages and approved content. Do not create a decorative cart, a false success state, fake order IDs, or a misleading “Buy now” control.

**Final owner decision:** `NOT SELECTED`  
**Decision date:** `NOT PROVIDED`  
**Notes / constraints:** `NOT PROVIDED`

---

## 4. Contact Channels and External Destinations

Only publish a channel after ownership, correctness, and the exact URL or destination have been checked.

| Channel | Value currently present in project files | Status | Required action |
|---|---|---|---|
| Business WhatsApp | `01104867352` is listed in the backend specification | NEEDS OWNER CONFIRMATION | Confirm that this is the official business number, test it, and validate the international-format WhatsApp URL before publishing |
| Support email | NOT PROVIDED | NOT PROVIDED | Supply and verify only if email support will be offered |
| Instagram URL | NOT PROVIDED | NOT PROVIDED | Add only an official profile URL |
| Facebook URL | NOT PROVIDED | NOT PROVIDED | Add only an official profile URL |
| TikTok URL | NOT PROVIDED | NOT PROVIDED | Add only an official profile URL |
| Other customer-service channel | NOT PROVIDED | NOT PROVIDED | Add only when approved and operational |

Do not use made-up URLs, sample phone numbers, fake social icons, or inactive contact links. If no channel is confirmed, hide the relevant contact control and record the launch limitation.

---

## 5. Product Catalog — Owner-Approved Records Only

**Current approved product records:** None supplied in the files provided for this draft. Do not invent seed products or pretend fixture data is live inventory.

Use one record per product. For a product with sellable variants, describe each variant and its approved price/stock separately. Keep a product unpublished until all mandatory data and Arabic/English publication requirements are met.

### Product record template — copy once per product

```yaml
record_status: DRAFT # DRAFT | APPROVED | PUBLISHED | ARCHIVED
owner_approval:
  approved_by: NOT_PROVIDED
  approved_date: NOT_PROVIDED
identity:
  internal_reference: NOT_PROVIDED
  slug: NOT_PROVIDED # stable, human-readable public slug; no database ID
  brand: VARELLION Accessories
  category_slug: NOT_PROVIDED # use one approved category from Section 6
locales:
  ar:
    name: NOT_PROVIDED
    short_description: NOT_PROVIDED
    description: NOT_PROVIDED
  en:
    name: NOT_PROVIDED
    short_description: NOT_PROVIDED
    description: NOT_PROVIDED
commercial:
  currency: EGP # confirm currency in Section 2 before launch
  base_price: NOT_PROVIDED # numeric amount, owner-confirmed
  previous_price: NOT_APPLICABLE # only if a genuine previous price is approved
  featured: false
  publication_status: DRAFT
  stock_quantity: NOT_PROVIDED
  low_stock_threshold: NOT_PROVIDED
variants: [] # if variants exist, record unique option values, price rule, and stock per sellable variant
media:
  - asset_path_or_provider_id: NOT_PROVIDED
    url: NOT_PROVIDED
    alt_ar: NOT_PROVIDED
    alt_en: NOT_PROVIDED
    represents_actual_product: NOT_PROVIDED
specifications: [] # only confirmed product-specific facts
compatibility: NOT_PROVIDED # include only verified models/devices/platforms
source_of_facts: NOT_PROVIDED # supplier document, manufacturer page, packaging, or owner-verified source
seo:
  title_ar: NOT_PROVIDED
  description_ar: NOT_PROVIDED
  title_en: NOT_PROVIDED
  description_en: NOT_PROVIDED
notes: NOT_PROVIDED
```

### Product publication gate

A product must remain a draft if any required launch value is missing. Before publication, verify:

- Product identity and category are owner-approved.
- Arabic and English names and descriptions are accurate and equivalent.
- Price, currency, and any previous price are confirmed.
- Stock and sellable variants match the actual inventory plan.
- Technical specifications and compatibility have a reliable source.
- Images are approved real product assets or are clearly identified as illustrative where appropriate.
- The public slug is stable and unique.
- No unsupported discount, quality, safety, durability, certification, warranty, review, or performance claim is present.
- The intended customer action works in the selected launch model.

---

## 6. Approved Category Taxonomy

The following six category slugs and labels are specified in `03_VARELLION_BUSINESS_PRODUCT_CONTENT_SPEC.md`. Use the labels consistently. A category label does **not** prove that products in that category are currently available.

| Stable slug | English label | Arabic label | Status |
|---|---|---|---|
| `mobile-accessories` | Mobile Accessories | إكسسوارات الهواتف | APPROVED IN PROJECT SPECIFICATIONS |
| `audio` | Audio | الصوتيات | APPROVED IN PROJECT SPECIFICATIONS |
| `power` | Power | الطاقة والشحن | APPROVED IN PROJECT SPECIFICATIONS |
| `smart-accessories` | Smart Accessories | الإكسسوارات الذكية | APPROVED IN PROJECT SPECIFICATIONS |
| `computer-desk` | Computer & Desk | ملحقات الكمبيوتر والمكتب | APPROVED IN PROJECT SPECIFICATIONS |
| `gaming` | Gaming | الألعاب وملحقاتها | APPROVED IN PROJECT SPECIFICATIONS |

Do not show an empty category shortcut as if products are available. Do not create extra top-level categories without owner approval.

---

## 7. Shipping and Fulfillment Decisions

The backend specification describes intended Egypt-wide coverage, but a carrier has not yet been selected and live delivery commitments are not available in the supplied data. Treat the following as unresolved until the owner completes them.

| Item | Current value | Status / action |
|---|---|---|
| Shipping carrier | NOT SELECTED | Select a real provider or document a genuinely owner-operated delivery process |
| Shipping coverage | All Egyptian governorates is an intended direction in `08` | NEEDS OWNER CONFIRMATION and an authoritative supported-governorate list |
| Governorate names and slugs | NOT PROVIDED | Choose and validate one authoritative list before seeding data |
| Shipping fee by governorate | NOT PROVIDED | Configure approved rates; do not guess or display an unknown fee as zero |
| Delivery-time promise | NOT PROVIDED | Do not publish an estimate until the owner/provider verifies it |
| Free-shipping offer | NOT APPROVED | Do not advertise free shipping unless approved terms and eligibility exist |
| Tracking integration | NOT DECIDED | If no integration exists, describe only the real manual tracking process that is approved |
| Delivery-failed process | NOT PROVIDED | Define who handles it and how the order/reservation changes |

If Option B is selected in Section 3 and a governorate fee is unknown, the system must clearly mark the delivery fee and final total as pending confirmation. It must not invent a fee or treat zero as a default price.

---

## 8. Payment, Returns, Refunds, and Warranty

| Item | Value / current position | Status |
|---|---|---|
| Initial payment method | COD is specified as the intended method in `08` | NEEDS OWNER CONFIRMATION before launch |
| Online card payment | Excluded from the documented first-release plan | NOT APPLICABLE unless separately approved and implemented |
| Return eligibility and process | NOT PROVIDED | NOT PROVIDED — owner/legal review required before publishing terms |
| Refund method and timing | NOT PROVIDED | NOT PROVIDED — do not promise a refund process that has not been approved |
| Warranty coverage | NOT PROVIDED | NOT PROVIDED — do not imply a warranty exists for every product |
| Order cancellation | Backend spec proposes customer requests by WhatsApp and admin performs the status change | NEEDS OWNER CONFIRMATION and tested state-transition behavior |
| COD order confirmation process | Confirm product, address, fee, and total before shipment is the intended behavior in `08` | NEEDS OWNER CONFIRMATION and operational procedure |

Do not use generic legal or policy text as if it describes the business's actual practice. The owner should approve the text after checking the real process and obtaining suitable legal review where appropriate.

---

## 9. Website Content and FAQs

Populate each section only with business facts or copy approved by the owner. Until supplied, omit optional sections or keep them as non-public drafts.

### Home page

- Arabic hero headline: `NOT PROVIDED`
- Arabic supporting copy: `NOT PROVIDED`
- English hero headline: `NOT PROVIDED`
- English supporting copy: `NOT PROVIDED`
- Approved primary CTA and destination: `NOT SELECTED` — must follow Section 3
- Approved featured products: `NONE SUPPLIED`
- Approved differentiators / “Why VARELLION”: `NOT PROVIDED`

The phrase “Technology accessories that fit your everyday life.” appears as proposed copy in file `03`; it remains `DRAFT` until owner approval.

### About page

- Approved Arabic copy: `NOT PROVIDED`
- Approved English copy: `NOT PROVIDED`
- Founding date / history / team / partners / certifications: `NOT PROVIDED`; do not invent these details.

### FAQ

No owner-approved FAQs were supplied with this draft. Add questions and answers only when the answers reflect the actual business process. Hide the FAQ section when there are no approved entries.

### Customer support messages

- Arabic order/contact instructions: `NOT PROVIDED`
- English order/contact instructions: `NOT PROVIDED`
- Customer-service availability: `NOT PROVIDED`
- Escalation / complaint channel: `NOT PROVIDED`

---

## 10. Legal and Privacy Content

The public site must use owner-approved text that accurately reflects the actual operation of the business. This file does not itself create a legally reviewed policy.

| Page / policy | Arabic approved text | English approved text | Status |
|---|---|---|---|
| Privacy Policy | NOT PROVIDED | NOT PROVIDED | BLOCKED until approved |
| Terms and Conditions | NOT PROVIDED | NOT PROVIDED | BLOCKED until approved |
| Shipping and delivery terms | NOT PROVIDED | NOT PROVIDED | BLOCKED until approved if shipping claims are made |
| Returns and refunds | NOT PROVIDED | NOT PROVIDED | BLOCKED until approved if such policy is published |
| Warranty terms | NOT PROVIDED | NOT PROVIDED | BLOCKED until approved if warranty is claimed |
| Effective / last-updated dates | NOT PROVIDED | NOT PROVIDED | Do not invent dates |

The privacy notice must describe the real data practices, including any applicable collection of name, phone, address, order notes, order records, hosting data, image/media services, and external handoff services. Do not claim data-retention, deletion, analytics, cookie, encryption, or third-party-sharing practices without evidence and owner approval.

---

## 11. Analytics, Cookies, and Marketing Channels

- Analytics provider: `NOT SELECTED`
- Advertising pixels: `NOT SELECTED`
- Cookie/consent requirements: `NEEDS REVIEW against actual integrations and applicable requirements`
- Newsletter / marketing email: `NOT APPROVED`
- Social profile links: `NOT PROVIDED`
- Approved active promotions: `NONE SUPPLIED`

Do not load analytics or advertising tools by default, or claim that analytics/cookies are absent, until the actual integrations and privacy disclosure have been reviewed.

---

## 12. Images, Fonts, and Content Licenses

- Actual product image assets: `NOT PROVIDED`
- Brand logo asset: `NOT PROVIDED`
- Permission / license source for each external asset: `NOT PROVIDED`
- Font loading and licensing: follow the approved design and technical specifications; document any asset that requires a license or external service.

Generated or stock imagery must not be presented as a photograph of an actual sellable product. Any development fixtures must be visibly separated from production catalog data and must never be mistaken for owner-approved products.

---

## 13. Operational and Integration Configuration (No Secrets Here)

Do not store passwords, OAuth secrets, API keys, database URLs with credentials, or other private secrets in this file or in Git. Store them in the deployment environment/secret manager and document only variable names and setup status here.

| Integration / environment | Status | Required action |
|---|---|---|
| Cloudinary account | NOT CONFIRMED | Create/configure account if image upload is in scope; verify upload restrictions and secret handling |
| Google OAuth for pre-approved admin | NOT CONFIGURED | Configure only if admin Google sign-in is approved; restrict to the pre-approved identity |
| Email provider | NOT CONFIGURED | Needed only when approved email workflows such as password recovery are implemented |
| Backend hosting | NOT SELECTED | Select supported runtime and document environment configuration |
| PostgreSQL hosting | NOT SELECTED | Choose managed or self-managed hosting and an acceptable backup/restore plan |
| Frontend hosting / domain | NOT SELECTED | Choose provider, production URL, and canonical URL configuration |
| Monitoring / health checks | NOT CONFIGURED | Define operational checks before production launch |
| Database backups / restore | NOT VERIFIED | Verify the actual provider capability, retention, and a successful restore test before launch |

Never add real credentials to this document. The technical deployment and secret-handling contract belongs to file `08` and the implementation repository.

---

## 14. Release Readiness Checklist

Do not mark a box complete unless an owner has approved the relevant decision or the relevant check was actually performed.

### Owner decisions

- [ ] Launch market and currency confirmed.
- [ ] Purchase model in Section 3 selected and signed off.
- [ ] WhatsApp/contact channels verified and tested.
- [ ] Real product catalog, prices, quantities, images, specifications, and variants approved.
- [ ] Shipping provider/process, coverage, fees, and any customer-facing delivery statements approved.
- [ ] COD and order-confirmation procedure approved, if applicable.
- [ ] Privacy, terms, returns/refunds, and warranty wording approved as applicable.
- [ ] Domain, business identity, and public contact details approved.

### Product and content readiness

- [ ] Every published product meets the publication gate in Section 5.
- [ ] Both Arabic and English are complete and factually equivalent for published products/pages.
- [ ] No placeholder text or invented commercial facts are visible to customers.
- [ ] Every public CTA has a real destination and accurate outcome wording.
- [ ] Category shortcuts and featured sections reflect real approved data.
- [ ] Every image and written asset is approved for use and represented accurately.

### If working checkout is selected

- [ ] Frontend/backend API contract is reviewed and tested together.
- [ ] Server-calculated product prices and order totals are authoritative.
- [ ] Unknown shipping fees never appear as a confirmed amount.
- [ ] Stock reservation cannot oversell inventory and releases exactly once.
- [ ] Order creation is idempotent or safely handles retries and duplicates.
- [ ] Order lifecycle/status transitions are documented and tested.
- [ ] WhatsApp handoff wording does not imply a message was sent or order confirmed.
- [ ] Guest order lookup limits abuse and exposes minimal customer data.
- [ ] Admin authentication and authorization tests pass.
- [ ] Backup restoration has actually been tested.

### Approval record

- Business owner / approver: `NOT PROVIDED`
- Date approved: `NOT PROVIDED`
- Version / change summary: `Initial draft — required owner values and launch decisions remain unresolved`

---

## 15. Instruction to AI Coding Agents

Treat this document as the single source of truth for actual owner-approved commercial values. Keep all unapproved records out of production content. When a required value is missing:

1. Report the exact missing value and the affected feature.
2. Continue only with work that does not depend on it.
3. Hide optional unapproved customer-facing content, or keep the related feature disabled.
4. Never infer approval from a proposed example, a category label, an old draft, a competitor listing, or generated copy.
5. When this file conflicts with another project document, identify the exact conflict and ask for a decision before implementing the affected commercial behavior.

> **Governing rule:** Product and business facts come from the owner, not from the AI. A polished storefront must remain truthful even when its initial catalog or business content is incomplete.

