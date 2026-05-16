import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'rish6.kumar@gmail.com'; // Adjust if this is not your email
  console.log(`🔍 Checking user: ${email}`);
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    console.log(`✅ User found. Current role: ${user.role}`);
    if (user.role !== UserRole.ADMIN) {
      await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN }
      });
      console.log('🚀 Role updated to ADMIN!');
    } else {
      console.log('✨ User is already an ADMIN.');
    }
  } else {
    console.log('❌ User not found in database.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
