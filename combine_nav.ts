import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const categoriesItem = await prisma.navbarItem.findFirst({
      where: { url: '/categories' }
    });
    if (categoriesItem) {
      await prisma.navbarItem.update({
        where: { id: categoriesItem.id },
        data: { title: 'Explore', url: '/explore' }
      });
      console.log('✅ Updated Categories to Explore');
    }
    
    const brandsItem = await prisma.navbarItem.findFirst({
      where: { url: '/brands' }
    });
    if (brandsItem) {
      await prisma.navbarItem.update({
        where: { id: brandsItem.id },
        data: { isActive: false }
      });
      console.log('✅ Disabled Brands nav item');
    }
  } catch(err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
