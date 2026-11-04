-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V9__seed_catalog_products.sql
-- Description: Seed initial categories, products, and product images
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Insert Categories
INSERT INTO public.categories (category_id, name_ar, name_en, slug, description_ar, description_en, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'الساعات الفاخرة', 'Luxury Watches', 'watches',
     'ساعات يد رجالية فخمة مصنوعة من الفولاذ المقاوم للصدأ 316L ومينا زجاج ياقوتي ضد الخدش.',
     'Premium masculine timepieces crafted with 316L stainless steel and scratch-resistant sapphire glass.', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'المحافظ والجلديات', 'Leather Goods', 'leather-goods',
     'محافظ وحوامل بطاقات صُنعت يدوياً من جلد البقر الطبيعي 100% المدبوغ نباتياً.',
     'Handcrafted wallets and cardholders made from 100% full-grain vegetable-tanned leather.', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'الإكسسوارات الرجالية', 'Men Accessories', 'accessories',
     'أساور كلاسيكية وأزرار أكمام تكمل طلتك وهيبتك في كل مناسبة.',
     'Refined bracelets, cufflinks, and daily accessories engineered to elevate your presence.', TRUE)
ON CONFLICT (category_id) DO NOTHING;

-- 2. Insert Products
INSERT INTO public.products (product_id, category_id, name_ar, name_en, description_ar, description_en, price, cost_price, stock_quantity, reserved_quantity, sku, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
     'ساعة فارليون كرونوغراف — المينا الزمردية', 'VARELLION Emerald Chronograph Watch',
     'ساعة رجالية فخمة ذات مينا خضراء زمردية عميقة تعكس الفخامة والقوة. هيكل صلب من الفولاذ المقاوم للصدأ بدرجة 316L بقطر 42 مم، زجاج كريستال ياقوتي مقوى ضد الخدوش والصدمات، ماكينة كوارتز يابانية متطورة (Miyota) بوظيفة الكرونوغراف، ومقاومة للماء حتى عمق 50 متراً (5ATM) مع سوار فولاذي متين بعرض 22 مم وقفل أمان مزدوج.',
     'A distinguished men’s chronograph featuring a deep emerald dial. Encased in 42mm 316L stainless steel with scratch-resistant sapphire crystal, precision Japanese Miyota quartz movement, 50m (5ATM) water resistance, and a 22mm solid link bracelet with double security clasp.',
     1850.00, 950.00, 18, 2, 'VAR-W-EMR-01', TRUE),

    ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
     'ساعة فارليون أوبسيديان — سوار جلد طبيعي أسود', 'VARELLION Obsidian Black Leather Watch',
     'تصميم كلاسيكي ملكي بمينا سوداء غير لامعة مع عقارب مطلية بلون الذهب الوردي. سوار مصنوع يدوياً من جلد العجل الإيطالي الفاخر بنقشة التمساح وقفل فراشة فولاذي. قطر الهيكل 40 مم مع سماكة نحيفة 9.5 مم تناسب الإطلالات الرسمية والبدل.',
     'Timeless minimalist dress watch featuring a matte obsidian black dial and rose-gold finished hands. Fitted with a genuine Italian full-grain alligator-embossed leather strap and butterfly deployant clasp.',
     1450.00, 720.00, 12, 0, 'VAR-W-OBS-02', TRUE),

    ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
     'ساعة فارليون سكيلتون رويال — ميكانيكية أوتوماتيكية', 'VARELLION Royale Skeleton Automatic Watch',
     'تحفة هندسية تكشف عن حركة التروس الميكانيكية المعقدة عبر واجهة وظهر زجاجي شفافين من الكريستال الياقوتي. حركة ميكانيكية ذاتية التعبئة بدون بطارية مع احتياطي طاقة يصل إلى 40 ساعة. هيكل من التيتانيوم خفيف الوزن ومقاوم للتآكل.',
     'An exceptional open-heart mechanical marvel displaying intricate gearing through dual sapphire crystals. Self-winding automatic movement with 40-hour power reserve, housed in a robust lightweight titanium casing.',
     2150.00, 1100.00, 5, 1, 'VAR-W-SKL-03', TRUE),

    ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
     'محفظة فارليون ثنائية الطي — جلد كونياك طبيعي 100%', 'VARELLION Cognac Full-Grain Leather Bifold Wallet',
     'محفظة جيب كلاسيكية ثنائية الطي مصنوعة من جلد البقر الطبيعي المحبب بالكامل (Full-Grain). تتسع لـ 8 بطاقات ائتمانية مع جيبين للنقود الورقية ومزودة ببطانة حماية متطورة ضد سرقة البيانات والمسح الإلكتروني (RFID Blocking). تكتسب مع مرور الوقت طبقة باتينا (Patina) عتيقة تزيدها فخامة وسحراً.',
     'Hand-stitched bifold wallet crafted from vegetable-tanned full-grain cowhide in rich cognac brown. Features 8 card slots, dual cash compartments, and integrated certified RFID-blocking shielding layer.',
     890.00, 420.00, 25, 3, 'VAR-L-COB-01', TRUE),

    ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
     'حامل بطاقات فارليون سليم — جلد أسود فاخر', 'VARELLION Minimalist Leather Cardholder',
     'محفظة بطاقات فائقة النحافة (سماكة 4 مم فقط) صُممت لحمل الضروريات دون انتفاخ الجيوب. تتضمن 6 فتحات للبطاقات وجيب أوسط مطوي للنقود الورقية. خياطة يدوية مشمعة دقيقة تضمن عمراً افتراضياً يدوم سنوات طويلة.',
     'Ultra-compact 4mm profile cardholder engineered from top-grain black cowhide. Features 6 card slots and a dedicated central cash compartment with reinforced saddle stitching.',
     690.00, 310.00, 30, 2, 'VAR-L-CRD-02', TRUE),

    ('c0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
     'أزرار أكمام فارليون الملكية — مطلية بالمينا وعرق اللؤلؤ', 'VARELLION Mother of Pearl Royal Cufflinks',
     'أزرار أكمام فاخرة تضفي لمسة من الوقار الملكي على قمصان البدلات الرسمية. صُنعت من الفولاذ المقاوم للصدأ المطلي بالروديوم اللامع مع ترصيع طبيعي من عرق اللؤلؤ الأصلي. قفل محكم وسلس في الارتداء.',
     'Hand-finished formal shirt cufflinks featuring natural mother-of-pearl inlays mounted on high-polish rhodium-plated steel with a secure swivel mechanism.',
     520.00, 210.00, 15, 0, 'VAR-A-CUF-01', TRUE)
ON CONFLICT (product_id) DO NOTHING;

-- 3. Insert Product Images safely
INSERT INTO public.product_images (product_id, image_url, is_main, display_order)
SELECT p.product_id, p.image_url, p.is_main, p.display_order
FROM (
    VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80', TRUE, 1),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80', TRUE, 1),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1000&q=80', TRUE, 1),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80', TRUE, 1),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80', TRUE, 1),
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1611591475152-4783113f60bc?auto=format&fit=crop&w=1000&q=80', TRUE, 1)
) AS p(product_id, image_url, is_main, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_images pi WHERE pi.product_id = p.product_id AND pi.is_main = TRUE
);
