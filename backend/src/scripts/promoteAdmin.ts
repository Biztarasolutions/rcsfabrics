import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function promote() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email: npm run promote <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`Success! ${user.email} is now an ADMIN.`);
  } catch (error) {
    console.error('Error: Could not find a user with that email.');
  } finally {
    await prisma.$disconnect();
  }
}

promote();
