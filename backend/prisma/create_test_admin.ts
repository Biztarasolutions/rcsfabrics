import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'testadmin@rcsfabrics.com';
  const plain = process.env.TEST_ADMIN_PASSWORD;
  if (!plain) throw new Error('Set TEST_ADMIN_PASSWORD to create the test admin.');
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to create a test admin in production.');
  const password = await bcrypt.hash(plain, 10);
  
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
