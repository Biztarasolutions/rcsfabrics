// Simple script to list products using Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { colors: true, images: { where: { isMain: true }, take: 1 } },
  });
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
