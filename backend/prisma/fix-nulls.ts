import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix null width values — set to 0 (or a sensible default like 44)
  const widthResult = await prisma.$executeRawUnsafe(
    `UPDATE "products" SET "width" = 0 WHERE "width" IS NULL`
  );
  console.log(`Fixed ${widthResult} products with null width`);

  // Fix null pattern values — set to 'Standard'
  const patternResult = await prisma.$executeRawUnsafe(
    `UPDATE "products" SET "pattern" = 'Standard' WHERE "pattern" IS NULL`
  );
  console.log(`Fixed ${patternResult} products with null pattern`);

  // Fix null stretchability values — set to 'Medium'
  const stretchResult = await prisma.$executeRawUnsafe(
    `UPDATE "products" SET "stretchability" = 'Medium' WHERE "stretchability" IS NULL`
  );
  console.log(`Fixed ${stretchResult} products with null stretchability`);

  // Fix null color values — set to empty string
  const colorResult = await prisma.$executeRawUnsafe(
    `UPDATE "products" SET "color" = '' WHERE "color" IS NULL`
  );
  console.log(`Fixed ${colorResult} products with null color`);

  console.log('All null fixes applied successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
