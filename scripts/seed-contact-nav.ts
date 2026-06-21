import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.navbarItem.findFirst({
    where: { url: '/contact' }
  });

  if (!existing) {
    const highestOrder = await prisma.navbarItem.findFirst({
      where: { parentId: null },
      orderBy: { sortOrder: 'desc' }
    });

    const newSortOrder = (highestOrder?.sortOrder || 0) + 1;

    await prisma.navbarItem.create({
      data: {
        title: 'Contact Us',
        url: '/contact',
        sortOrder: newSortOrder,
        isActive: true
      }
    });

    console.log('✅ Contact Us navigation item added successfully.');
  } else {
    console.log('ℹ️ Contact Us navigation item already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
