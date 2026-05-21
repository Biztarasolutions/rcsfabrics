import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categoriesCount = await prisma.category.count();
  const productsCount = await prisma.product.count();
  const imagesCount = await prisma.productImage.count();
  
  console.log('Categories Count:', categoriesCount);
  console.log('Products Count:', productsCount);
  console.log('Images Count:', imagesCount);

  if (productsCount > 0) {
    const products = await prisma.product.findMany({
      include: { images: true, category: true, colors: true },
      take: 10
    });
    console.log('\n=== Products details ===');
    products.forEach((p: any) => {
      console.log('Complete Product JSON:', JSON.stringify(p, null, 2));
    });
  }

  if (categoriesCount > 0) {
    const categories = await prisma.category.findMany({ take: 10 });
    console.log('\n=== Categories details ===');
    categories.forEach((c: any) => {
      console.log(`Category: ${c.name}, image: ${c.image}, imageUrl: ${c.imageUrl}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
