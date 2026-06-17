import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

dotenv.config();

const categories = [
  ['Daily Essentials', 'daily-essentials', 'Core vitamins and minerals for everyday wellness.'],
  ['Immune Support', 'immune-support', 'Products positioned around general immune health support.'],
  ['Bone & Joint', 'bone-joint', 'Calcium, D3, magnesium, and joint support supplements.'],
  ['Beauty & Skin', 'beauty-skin', 'Beauty-focused supplements such as biotin and collagen.'],
  ['Energy & Focus', 'energy-focus', 'B-complex and wellness supplements for active lifestyles.']
];

const products = [
  ['daily-essentials', 'Complete Multivitamin 60 Tablets', 'complete-multivitamin-60-tablets', 'A balanced daily multivitamin containing essential vitamins and minerals for adults. Use as a general dietary supplement, not as a replacement for a varied diet.', 'Vitamin A, B-complex, C, D3, E, zinc, selenium, magnesium', 'Take one tablet daily after food. Do not exceed the recommended serving.', 2950, 3500, 35, '/images/multivitamin.svg'],
  ['immune-support', 'Vitamin C 1000mg Orange 30 Tablets', 'vitamin-c-1000mg-orange-30-tablets', 'High-strength vitamin C supplement with a citrus-style product theme for daily nutritional support.', 'Ascorbic acid, natural orange flavour, permitted excipients', 'Take one tablet daily after food. Consult a healthcare professional if pregnant, nursing, or using medication.', 1850, 2200, 42, '/images/vitamin-c.svg'],
  ['bone-joint', 'Vitamin D3 1000 IU 90 Softgels', 'vitamin-d3-1000-iu-90-softgels', 'Vitamin D3 softgels formulated to support normal dietary vitamin D intake.', 'Vitamin D3, carrier oil, softgel shell', 'Take one softgel daily with a meal containing fat.', 2450, 2800, 28, '/images/vitamin-d3.svg'],
  ['bone-joint', 'Calcium Magnesium Zinc 90 Tablets', 'calcium-magnesium-zinc-90-tablets', 'A mineral supplement containing calcium, magnesium, and zinc for everyday nutritional support.', 'Calcium carbonate, magnesium oxide, zinc gluconate', 'Take as directed on the label. Keep away from children.', 3250, null, 18, '/images/calcium.svg'],
  ['beauty-skin', 'Biotin 5000mcg Hair Skin Nails 60 Capsules', 'biotin-5000mcg-hair-skin-nails-60-capsules', 'Biotin capsules positioned for beauty-focused supplement shoppers. No medical or guaranteed cosmetic claims are made.', 'Biotin, rice flour, vegetarian capsule shell', 'Take one capsule daily after food. Results vary by individual.', 2750, 3200, 24, '/images/biotin.svg'],
  ['beauty-skin', 'Marine Collagen Plus Vitamin C 200g', 'marine-collagen-plus-vitamin-c-200g', 'Powdered collagen supplement with vitamin C in a clean premium tub-style presentation.', 'Hydrolysed marine collagen peptides, vitamin C, natural flavour', 'Mix one scoop with water or smoothie. Contains marine ingredients.', 6950, 7800, 16, '/images/collagen.svg'],
  ['energy-focus', 'Vitamin B Complex 60 Tablets', 'vitamin-b-complex-60-tablets', 'B-complex supplement for customers looking for everyday nutritional support for an active lifestyle.', 'B1, B2, B3, B5, B6, B7, B9, B12', 'Take one tablet daily after food. May change urine colour due to riboflavin.', 2100, null, 39, '/images/bcomplex.svg'],
  ['daily-essentials', 'Omega 3 Fish Oil 1000mg 120 Softgels', 'omega-3-fish-oil-1000mg-120-softgels', 'Omega 3 fish oil softgels in a premium family-size bottle. Contains fish-derived ingredients.', 'Fish oil, gelatin, glycerin, purified water', 'Take one to two softgels daily with meals. Not suitable for fish allergy.', 5400, 6200, 22, '/images/omega3.svg'],
  ['immune-support', 'Zinc 25mg 60 Tablets', 'zinc-25mg-60-tablets', 'Simple zinc supplement for customers who want a focused mineral product.', 'Zinc gluconate, microcrystalline cellulose, permitted excipients', 'Take one tablet daily after food. Do not use with other high-zinc supplements unless advised.', 1650, null, 50, '/images/zinc.svg']
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const [name, slug, description] of categories) {
      await conn.execute(
        `INSERT INTO categories (name, slug, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [name, slug, description]
      );
    }

    const [categoryRows] = await conn.execute('SELECT id, slug FROM categories');
    const categoryMap = new Map(categoryRows.map((c) => [c.slug, c.id]));

    for (const p of products) {
      const [categorySlug, name, slug, description, ingredients, usageNotes, price, compareAtPrice, stock, imageUrl] = p;
      await conn.execute(
        `INSERT INTO products
         (category_id, name, slug, description, ingredients, usage_notes, price, compare_at_price, stock, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id), name = VALUES(name), description = VALUES(description), ingredients = VALUES(ingredients),
           usage_notes = VALUES(usage_notes), price = VALUES(price), compare_at_price = VALUES(compare_at_price), stock = VALUES(stock), image_url = VALUES(image_url), is_active = 1`,
        [categoryMap.get(categorySlug), name, slug, description, ingredients, usageNotes, price, compareAtPrice, stock, imageUrl]
      );
    }

    const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
    await conn.execute(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin'`,
      ['Fit Zone Admin', 'admin@fitzone.lk', adminPasswordHash, '+94 77 000 0000']
    );

    await conn.commit();
    console.log('Seed completed. Admin: admin@fitzone.lk / Admin@12345');
  } catch (error) {
    await conn.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
