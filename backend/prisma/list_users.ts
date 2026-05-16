import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('👥 Current Users:');
  console.table(users);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
