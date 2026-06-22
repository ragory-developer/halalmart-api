import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addNavigationItems() {
  try {
    // Check if Categories already exists
    const categoriesExist = await prisma.navbarItem.findFirst({
      where: { url: '/categories' }
    });

    if (!categoriesExist) {
      await prisma.navbarItem.create({
        data: {
          title: 'Categories',
          url: '/categories',
          sortOrder: 3, // Put it after Groceries
          isActive: true,
          isSystem: false,
        }
      });
      console.log('Added Categories to Navbar');
    }

    // Check if Brands already exists
    const brandsExist = await prisma.navbarItem.findFirst({
      where: { url: '/brands' }
    });

    if (!brandsExist) {
      await prisma.navbarItem.create({
        data: {
          title: 'Brands',
          url: '/brands',
          sortOrder: 4, // Put it after Categories
          isActive: true,
          isSystem: false,
        }
      });
      console.log('Added Brands to Navbar');
    }

    // Adjust sort orders for everything else to make room
    // Current: Home(1), Halal Meat(2), Groceries(3), Weekly Specials(4), About Us(5), Contact(6)
    // New: Home(1), Halal Meat(2), Groceries(3), Categories(4), Brands(5), Weekly Specials(6), About Us(7), Contact(8)
    
    // We already added them. Let's just fix the sort orders cleanly.
    const items = await prisma.navbarItem.findMany({ orderBy: { sortOrder: 'asc' } });
    
    // Desired order
    const desiredOrder = ['Home', 'Halal Meat', 'Groceries', 'Categories', 'Brands', 'Weekly Specials', 'About Us', 'Contact'];
    
    for (let i = 0; i < desiredOrder.length; i++) {
      const title = desiredOrder[i];
      const item = items.find(x => x.title === title);
      if (item) {
        await prisma.navbarItem.update({
          where: { id: item.id },
          data: { sortOrder: i + 1 }
        });
      }
    }
    
    console.log('Successfully updated navigation items.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNavigationItems();
