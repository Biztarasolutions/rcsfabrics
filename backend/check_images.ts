import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const imgs = await p.productImage.findMany({ take: 5, select: { url: true } });
  console.log('=== Product Image URLs ===');
  imgs.forEach((img: any) => console.log(img.url));

  const cats = await p.category.findMany({ take: 5, select: { name: true, image: true, imageUrl: true } });
  console.log('\n=== Category Image URLs ===');
  cats.forEach((c: any) => console.log(`${c.name}: image=${c.image}, imageUrl=${c.imageUrl}`));

  await p.$disconnect();
}

main().catch(console.error);
