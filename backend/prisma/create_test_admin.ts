import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'testadmin@rcsfabrics.com';
  const password = await bcrypt.hash('testadmin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: UserRole.ADMIN,
      isActive: true
    },
    create: {
      email,
      password,
      firstName: 'Test',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true
    }
  });
  console.log('✅ Test admin created:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
