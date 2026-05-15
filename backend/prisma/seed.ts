import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Seed data for development ─────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Silks',     slug: 'silks',     description: 'Premium silk fabrics from India and abroad' },
  { name: 'Cottons',   slug: 'cottons',   description: 'Breathable, high-quality cotton fabrics' },
  { name: 'Velvets',   slug: 'velvets',   description: 'Luxurious velvet fabrics' },
  { name: 'Chiffons',  slug: 'chiffons',  description: 'Light and flowing chiffon fabrics' },
  { name: 'Blends',    slug: 'blends',    description: 'Premium fabric blends' },
  { name: 'Linens',    slug: 'linens',    description: 'Natural linen fabrics' },
];

const COUPONS = [];

const PRODUCTS = [
  {
    name: 'Royal Banarasi Silk', slug: 'royal-banarasi-silk',
    description: 'Authentic handwoven Banarasi silk with intricate zari brocade work. Perfect for bridal wear, sarees, and formal occasions. Sourced directly from master weavers in Varanasi.',
    material: 'Pure Silk', color: 'Deep Maroon', gsm: 120, width: 44,
    basePrice: 1850, discountPrice: 1499,
    pattern: 'Zari Brocade', stretchability: 'Non-Stretch',
    washCare: 'Dry clean only', usage: 'Bridal wear, Sarees, Lehengas',
    totalStock: 45, minOrderQty: 0.5,
    isFeatured: true, isNew: false, categorySlug: 'silks',
    images: [
      { url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=90', isMain: true, order: 1 },
      { url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=90', isMain: false, order: 2 },
    ],
    rating: 4.8, ratingCount: 124,
  },
  {
    name: 'Premium Egyptian Cotton', slug: 'premium-egyptian-cotton',
    description: 'Extra-long staple Egyptian cotton with a 400-thread count weave. Exceptionally smooth and breathable — ideal for premium shirts, bedlinen, and summer dresses.',
    material: 'Cotton', color: 'Ivory White', gsm: 150, width: 60,
    basePrice: 680, discountPrice: null,
    pattern: 'Plain Weave', stretchability: 'Slight Stretch',
    washCare: 'Machine wash cold, gentle cycle', usage: 'Shirts, Bedlinen, Dresses',
    totalStock: 200, minOrderQty: 1,
    isFeatured: true, isNew: true, categorySlug: 'cottons',
    images: [
      { url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=90', isMain: true, order: 1 },
    ],
    rating: 4.6, ratingCount: 89,
  },
  {
    name: 'Italian Velvet', slug: 'italian-velvet',
    description: 'Sumptuous Italian velvet with a dense, lustrous pile. An exceptional fabric for evening wear, upholstery, and statement home décor pieces.',
    material: 'Velvet', color: 'Midnight Navy', gsm: 380, width: 44,
    basePrice: 2400, discountPrice: null,
    pattern: 'Plain Velvet', stretchability: 'Slight Stretch',
    washCare: 'Dry clean only. Avoid crushing pile', usage: 'Evening wear, Upholstery, Cushions',
    totalStock: 8, minOrderQty: 0.5,
    isFeatured: true, isNew: false, categorySlug: 'velvets',
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90', isMain: true, order: 1 },
    ],
    rating: 4.9, ratingCount: 203,
  },
  {
    name: 'French Linen Blend', slug: 'french-linen-blend',
    description: 'A sophisticated 70/30 linen-cotton blend from French mills. Relaxed drape with superb breathability — the perfect companion for tailored summer suits and elegant resort wear.',
    material: 'Linen-Cotton Blend', color: 'Sand Beige', gsm: 220, width: 56,
    basePrice: 1200, discountPrice: 980,
    pattern: 'Plain Weave', stretchability: 'Non-Stretch',
    washCare: 'Hand wash or delicate machine wash, lay flat to dry', usage: 'Suits, Blazers, Dresses, Curtains',
    totalStock: 80, minOrderQty: 0.5,
    isFeatured: false, isNew: false, categorySlug: 'blends',
    images: [
      { url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=90', isMain: true, order: 1 },
    ],
    rating: 4.7, ratingCount: 56,
  },
  {
    name: 'Pure Kanjivaram Silk', slug: 'pure-kanjivaram-silk',
    description: 'The queen of Indian silks. Authentic Kanjivaram with the iconic temple border, woven by certified GI-tagged artisans in Kanchipuram, Tamil Nadu.',
    material: 'Pure Silk', color: 'Peacock Green', gsm: 140, width: 44,
    basePrice: 3200, discountPrice: 2750,
    pattern: 'Temple Border', stretchability: 'Non-Stretch',
    washCare: 'Dry clean only. Store with camphor balls', usage: 'Bridal Sarees, Formal occasions',
    totalStock: 5, minOrderQty: 0.5,
    isFeatured: true, isNew: false, categorySlug: 'silks',
    images: [
      { url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=90', isMain: true, order: 1 },
    ],
    rating: 5.0, ratingCount: 234,
  },
  {
    name: 'Georgette Chiffon', slug: 'georgette-chiffon',
    description: 'Lightweight, sheer georgette chiffon with a beautiful crinkled texture. Perfect for flowing dupatta, saree blouses, and layered dresses.',
    material: 'Chiffon', color: 'Blush Pink', gsm: 50, width: 44,
    basePrice: 750, discountPrice: null,
    pattern: 'Crinkle Weave', stretchability: 'Slight Stretch',
    washCare: 'Hand wash with mild detergent. Do not wring', usage: 'Dupatta, Saree blouses, Dresses',
    totalStock: 150, minOrderQty: 0.5,
    isFeatured: false, isNew: true, categorySlug: 'chiffons',
    images: [
      { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=90', isMain: true, order: 1 },
    ],
    rating: 4.7, ratingCount: 203,
  },
  {
    name: 'Test Fabric', slug: 'test-fabric',
    description: 'A sample fabric for testing.',
    material: 'Cotton', color: 'Blue', gsm: 150, width: 120,
    basePrice: 100, discountPrice: null,
    pattern: 'Plain', stretchability: 'Non-Stretch',
    washCare: 'Machine wash cold', usage: 'Testing purposes',
    totalStock: 50, minOrderQty: 0.5,
    isFeatured: false, isNew: true, categorySlug: 'cottons',
    images: [
      { url: 'https://via.placeholder.com/150', isMain: true, order: 1 },
    ],
    rating: 0, ratingCount: 0,
  },
];

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();

  // Seed categories
  console.log('📁 Creating categories...');
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.slug] = created.id;
  }

  // Seed products
  console.log('🧵 Creating products...');
  for (const product of PRODUCTS) {
    const { images, categorySlug, tags, ...rest } = product;
    await prisma.product.create({
      data: {
        ...rest,
        discountPrice: rest.discountPrice ?? undefined,
        categoryId: categoryMap[categorySlug],
        images: { create: images },
      },
    });
  }

  // Seed coupons
  console.log('🎟️ Creating coupons...');
  for (const coupon of COUPONS) {
    await prisma.coupon.create({ data: coupon });
  }

  // Seed admin user
  console.log('👤 Creating admin user...');
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@rcsfabrics.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'RCS',
      email: 'admin@rcsfabrics.com',
      password: hashedPassword,
      phone: '+91 98765 43210',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Seed a test customer
  const customerPassword = await bcrypt.default.hash('customer@123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@rcsfabrics.com' },
    update: {},
    create: {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'customer@rcsfabrics.com',
      password: customerPassword,
      phone: '+91 99887 76655',
      role: 'CUSTOMER',
      isVerified: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('   Admin: admin@rcsfabrics.com / admin@123');
  console.log('   Customer: customer@rcsfabrics.com / customer@123');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
