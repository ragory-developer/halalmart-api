import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('1234', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@halalmart.com' },
    update: { 
      password: adminPassword, 
      role: 'SUPER_ADMIN' 
    },
    create: {
      email: 'admin@halalmart.com',
      password: adminPassword,
      name: 'System Admin',
      phone: '01900000000', // Dummy phone
      role: 'SUPER_ADMIN',
    },
  });
  
  console.log('✅ Admin user admin@halalmart.com created successfully with password 1234!');
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
