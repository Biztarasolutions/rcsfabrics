import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Solids',
    description: 'Premium plain dyed fabrics available in elegant and versatile shades suitable for everyday wear, office outfits, dresses, kurtis, and designer creations.',
    bestFor: ['Kurtis', 'Tops', 'Dresses', 'Shirts', 'Bottom wear'],
    properties: ['Minimal look', 'Easy to style', 'Everyday wear', 'Premium finish'],
  },
  {
    name: 'Poplin',
    description: 'Smooth and tightly woven cotton‑blend fabric known for its durability, crisp texture, and comfortable feel.',
    bestFor: ['Shirts', 'Kurtis', 'School uniforms', 'Tops'],
    properties: ['Lightweight', 'Breathable', 'Durable', 'Crisp texture'],
  },
  {
    name: 'Linen',
    description: 'Premium breathable fabric with natural texture and elegant drape, perfect for summer fashion and luxury outfits.',
    bestFor: ['Dresses', 'Coord sets', 'Shirts', 'Ethnic wear'],
    properties: ['Luxury feel', 'Summer friendly', 'Breathable', 'Natural texture'],
  },
  {
    name: 'Cotton',
    description: 'Soft and breathable cotton fabrics ideal for comfortable daily wear and all‑season outfits.',
    bestFor: ['Kurtis', 'Kids wear', 'Tops', 'Casual wear'],
    properties: ['Skin friendly', 'Breathable', 'Comfortable', 'Everyday use'],
  },
  {
    name: 'Rayon',
    description: 'Flowy and soft fabric with excellent drape, widely loved for stylish ethnic and western wear.',
    bestFor: ['Dresses', 'Kurtis', 'Gowns', 'Coord sets'],
    properties: ['Soft texture', 'Flowing drape', 'Lightweight', 'Elegant look'],
  },
  {
    name: 'Hakoba',
    description: 'Elegant embroidered cotton fabric featuring intricate cutwork patterns for festive and designer wear.',
    bestFor: ['Kurtis', 'Dresses', 'Blouses', 'Summer wear'],
    properties: ['Embroidered look', 'Feminine style', 'Premium finish', 'Breathable'],
  },
  {
    name: 'Crepe',
    description: 'Stylish textured fabric with graceful fall and slightly crinkled appearance, suitable for modern fashion outfits.',
    bestFor: ['Dresses', 'Gowns', 'Tops', 'Sarees'],
    properties: ['Flowy', 'Wrinkle resistant', 'Soft drape', 'Elegant texture'],
  },
  {
    name: 'Satin',
    description: 'Luxurious glossy fabric with smooth texture and rich shine, ideal for party and occasion wear.',
    bestFor: ['Evening gowns', 'Blouses', 'Sarees', 'Party dresses'],
    properties: ['Glossy finish', 'Smooth feel', 'Premium look', 'Soft drape'],
  },
  {
    name: 'Tissue',
    description: 'Lightweight shimmering fabric with festive appeal used for ethnic and celebration wear.',
    bestFor: ['Sarees', 'Dupattas', 'Ethnic outfits', 'Festive dresses'],
    properties: ['Metallic shine', 'Lightweight', 'Festive look', 'Elegant finish'],
  },
  {
    name: 'Chiffon',
    description: 'Soft, sheer, and lightweight fabric known for its graceful flow and elegant appearance.',
    bestFor: ['Sarees', 'Dupattas', 'Dresses', 'Layered outfits'],
    properties: ['Sheer texture', 'Lightweight', 'Soft drape', 'Feminine look'],
  },
  {
    name: 'Stretchable',
    description: 'Flexible and comfortable fabrics with stretch properties designed for fitted and modern outfits.',
    bestFor: ['Body‑fit dresses', 'Tops', 'Bottom wear', 'Active wear'],
    properties: ['Stretchable', 'Comfortable fit', 'Flexible', 'Modern styling'],
  },
  {
    name: 'Jacquard',
    description: 'Designer woven fabric featuring rich self‑patterns and luxurious textures for premium fashion wear.',
    bestFor: ['Ethnic wear', 'Jackets', 'Blouses', 'Festive outfits'],
    properties: ['Rich texture', 'Premium woven design', 'Festive look', 'Durable'],
  },
  {
    name: 'Muslin',
    description: 'Ultra‑soft and breathable cotton fabric with lightweight texture, ideal for elegant casual wear.',
    bestFor: ['Summer wear', 'Dresses', 'Kurtis', 'Kids wear'],
    properties: ['Soft touch', 'Breathable', 'Lightweight', 'Comfortable'],
  },
];

async function main() {
  for (const cat of categories) {
    const slug = slugify(cat.name, { lower: true, strict: true });
    await prisma.category.upsert({
      where: { slug },
      update: {
        description: cat.description,
        bestFor: cat.bestFor,
        properties: cat.properties,
      },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        bestFor: cat.bestFor,
        properties: cat.properties,
        gender: 'women', // default gender as in existing data
        isActive: true,
      },
    });
    console.log(`✅ Category ${cat.name} upserted`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
