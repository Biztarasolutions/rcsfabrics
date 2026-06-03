import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productId = process.argv[2];
  if (!productId) {
    console.error('Please provide a product ID as argument');
    process.exit(1);
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { colors: true, images: true },
  });
  if (!product) {
    console.log('Product not found');
    return;
  }
  console.log('=== Product Details ===');
  console.log(`ID: ${product.id}`);
  console.log(`Name: ${product.name}`);
  console.log('Colors:');
  product.colors.forEach((c: any) => {
    console.log(`  - ${c.name} (code: ${c.productCode}) folderUrl: ${c.folderUrl}`);
  });
  console.log('Images:');
  product.images.forEach((img: any) => {
    console.log(`  - ${img.url}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
