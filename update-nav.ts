import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const item = await prisma.navbarItem.findFirst({
      where: { url: '/halal-meat-market' }
    });
    if (item) {
      await prisma.navbarItem.update({
        where: { id: item.id },
        data: { url: '/products?category=halal-meat' }
      });
      console.log('✅ Updated navbar item URL');
    } else {
      console.log('Navbar item not found');
    }
  } catch(err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
