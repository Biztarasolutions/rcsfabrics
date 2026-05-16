import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    console.log('Registered Users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
