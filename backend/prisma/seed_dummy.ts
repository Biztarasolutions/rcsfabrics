import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Clearing old dummy data...');
  await prisma.banner.deleteMany({});
  await prisma.coupon.deleteMany({});
  // We keep categories as they might be linked to products, but we'll upsert them.

  console.log('🚀 Seeding new dummy data...');

  // 1. Categories
  const categories = [
    { name: 'Pure Silk', slug: 'pure-silk', description: 'Heritage Kanjivaram and Banarasi silks', isActive: true, order: 1 },
    { name: 'Italian Velvet', slug: 'italian-velvet', description: 'Premium velvet for luxury upholstery', isActive: true, order: 2 },
    { name: 'French Linen', slug: 'french-linen', description: 'Breathable linen for summer collections', isActive: true, order: 3 },
    { name: 'Embroidered Chiffon', slug: 'embroidered-chiffon', description: 'Delicate hand-embroidered chiffon', isActive: true, order: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log('✅ Categories seeded');

  // 2. Coupons
  const coupons = [
    { 
      code: 'WELCOME10', 
      description: '10% off for new users',
      discountType: DiscountType.PERCENTAGE, 
      discountValue: 10, 
      minOrderAmount: 1000, 
      isActive: true, 
      startsAt: new Date(),
      expiresAt: new Date('2026-12-31') 
    },
    { 
      code: 'FESTIVE500', 
      description: 'Flat 500 off on festive shopping',
      discountType: DiscountType.FIXED, 
      discountValue: 500, 
      minOrderAmount: 5000, 
      isActive: true, 
      startsAt: new Date(),
      expiresAt: new Date('2026-12-31') 
    },
  ];

  for (const coup of coupons) {
    await prisma.coupon.upsert({
      where: { code: coup.code },
      update: coup,
      create: coup,
    });
  }
  console.log('✅ Coupons seeded');

  // 3. Banners
  const banners = [
    { 
      title: 'Royal Silk Collection', 
      subtitle: 'Experience the heritage', 
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1200', 
      link: '/collections/silk', 
      isActive: true, 
      order: 1 
    },
    { 
      title: 'Summer Linen Sale', 
      subtitle: 'Up to 30% Off', 
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200', 
      link: '/products?sale=true', 
      isActive: true, 
      order: 2 
    },
  ];

  for (const ban of banners) {
    await prisma.banner.create({
      data: ban
    });
  }
  console.log('✅ Banners seeded');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
