import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'rahat.ete@gmail.com';
  const password = '1234';
  const name = 'Rahat';

  const existing = await prisma.user.findUnique({ where: { email } });

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
      permissions: JSON.stringify(['ALL']),
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
      permissions: JSON.stringify(['ALL']),
      balance: 1000,
    },
  });

  console.log('Admin user synced successfully');
  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
