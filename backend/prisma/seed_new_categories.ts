import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_CATEGORIES = [
  {
    name: 'Solids',
    slug: 'solids',
    description: 'Premium plain dyed fabrics available in elegant and versatile shades suitable for everyday wear, office outfits, dresses, kurtis, and designer creations.',
    bestFor: ['Kurtis', 'Tops', 'Dresses', 'Shirts', 'Bottom wear'],
    properties: ['Minimal look', 'Easy to style', 'Everyday wear', 'Premium finish'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Poplin',
    slug: 'poplin',
    description: 'Smooth and tightly woven cotton-blend fabric known for its durability, crisp texture, and comfortable feel.',
    bestFor: ['Shirts', 'Kurtis', 'School uniforms', 'Tops'],
    properties: ['Lightweight', 'Breathable', 'Durable', 'Crisp texture'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Linen',
    slug: 'linen',
    description: 'Premium breathable fabric with natural texture and elegant drape, perfect for summer fashion and luxury outfits.',
    bestFor: ['Dresses', 'Coord sets', 'Shirts', 'Ethnic wear'],
    properties: ['Luxury feel', 'Summer friendly', 'Breathable', 'Natural texture'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Cotton',
    slug: 'cotton',
    description: 'Soft and breathable cotton fabrics ideal for comfortable daily wear and all-season outfits.',
    bestFor: ['Kurtis', 'Kids wear', 'Tops', 'Casual wear'],
    properties: ['Skin friendly', 'Breathable', 'Comfortable', 'Everyday use'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Rayon',
    slug: 'rayon',
    description: 'Flowy and soft fabric with excellent drape, widely loved for stylish ethnic and western wear.',
    bestFor: ['Dresses', 'Kurtis', 'Gowns', 'Coord sets'],
    properties: ['Soft texture', 'Flowing drape', 'Lightweight', 'Elegant look'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Hakoba',
    slug: 'hakoba',
    description: 'Elegant embroidered cotton fabric featuring intricate cutwork patterns for festive and designer wear.',
    bestFor: ['Kurtis', 'Dresses', 'Blouses', 'Summer wear'],
    properties: ['Embroidered look', 'Feminine style', 'Premium finish', 'Breathable'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Crepe',
    slug: 'crepe',
    description: 'Stylish textured fabric with graceful fall and slightly crinkled appearance, suitable for modern fashion outfits.',
    bestFor: ['Dresses', 'Gowns', 'Tops', 'Sarees'],
    properties: ['Flowy', 'Wrinkle resistant', 'Soft drape', 'Elegant texture'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Satin',
    slug: 'satin',
    description: 'Luxurious glossy fabric with smooth texture and rich shine, ideal for party and occasion wear.',
    bestFor: ['Evening gowns', 'Blouses', 'Sarees', 'Party dresses'],
    properties: ['Glossy finish', 'Smooth feel', 'Premium look', 'Soft drape'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Tissue',
    slug: 'tissue',
    description: 'Lightweight shimmering fabric with festive appeal used for ethnic and celebration wear.',
    bestFor: ['Sarees', 'Dupattas', 'Ethnic outfits', 'Festive dresses'],
    properties: ['Metallic shine', 'Lightweight', 'Festive look', 'Elegant finish'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Chiffon',
    slug: 'chiffon',
    description: 'Soft, sheer, and lightweight fabric known for its graceful flow and elegant appearance.',
    bestFor: ['Sarees', 'Dupattas', 'Dresses', 'Layered outfits'],
    properties: ['Sheer texture', 'Lightweight', 'Soft drape', 'Feminine look'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Stretchable',
    slug: 'stretchable',
    description: 'Flexible and comfortable fabrics with stretch properties designed for fitted and modern outfits.',
    bestFor: ['Body-fit dresses', 'Tops', 'Bottom wear', 'Active wear'],
    properties: ['Stretchable', 'Comfortable fit', 'Flexible', 'Modern styling'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Jacquard',
    slug: 'jacquard',
    description: 'Designer woven fabric featuring rich self-patterns and luxurious textures for premium fashion wear.',
    bestFor: ['Ethnic wear', 'Jackets', 'Blouses', 'Festive outfits'],
    properties: ['Rich texture', 'Premium woven design', 'Festive look', 'Durable'],
    gender: 'women',
    isActive: true,
  },
  {
    name: 'Muslin',
    slug: 'muslin',
    description: 'Ultra-soft and breathable cotton fabric with lightweight texture, ideal for elegant casual wear.',
    bestFor: ['Summer wear', 'Dresses', 'Kurtis', 'Kids wear'],
    properties: ['Soft touch', 'Breathable', 'Lightweight', 'Comfortable'],
    gender: 'women',
    isActive: true,
  }
];

async function main() {
  console.log('🗑️ Cleaning up existing orders, reviews, products, and categories...');
  
  // Clear dependent relational tables
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  
  // Clear products
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  
  // Clear categories
  await prisma.category.deleteMany();
  
  console.log('📁 Seeding 13 Premium Categories...');
  for (const cat of NEW_CATEGORIES) {
    const created = await prisma.category.create({
      data: cat
    });
    console.log(`   + Category created: ${created.name} (${created.id})`);
  }
  
  console.log('✅ 13 Premium Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
