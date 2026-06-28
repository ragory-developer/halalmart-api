import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realCategories = [
  { name: 'Fresh Produce', slug: 'fresh-produce', image: null },
  { name: 'Meat & Poultry', slug: 'meat-poultry', image: null },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', image: null },
  { name: 'Beverages', slug: 'beverages', image: null },
  { name: 'Bakery', slug: 'bakery', image: null },
  { name: 'Spices', slug: 'spices', image: null },
];

const realBrands = [
  { name: 'Nestlé', slug: 'nestle', logo: null },
  { name: 'Coca-Cola', slug: 'coca-cola', logo: null },
  { name: 'Pepsi', slug: 'pepsi', logo: null },
  { name: 'Unilever', slug: 'unilever', logo: null },
  { name: 'Knorr', slug: 'knorr', logo: null },
  { name: 'Lays', slug: 'lays', logo: null },
  { name: 'Kelloggs', slug: 'kelloggs', logo: null },
  { name: 'Kraft', slug: 'kraft', logo: null },
];

async function main() {
  console.log('Seeding real categories...');
  for (const cat of realCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image },
      create: { name: cat.name, slug: cat.slug, image: cat.image },
    });
  }

  console.log('Seeding real brands...');
  for (const brand of realBrands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, logo: brand.logo },
      create: { name: brand.name, slug: brand.slug, logo: brand.logo },
    });
  }

  console.log('Successfully seeded real grocery brands and categories!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
