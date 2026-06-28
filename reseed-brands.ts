import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newBrands = [
  { name: 'Fresh Valley', slug: 'fresh-valley', logo: 'https://ui-avatars.com/api/?name=FV&background=4CAF50&color=fff&size=200' },
  { name: 'Nature Choice', slug: 'nature-choice', logo: 'https://ui-avatars.com/api/?name=NC&background=8BC34A&color=fff&size=200' },
  { name: 'Pure Foods', slug: 'pure-foods', logo: 'https://ui-avatars.com/api/?name=PF&background=03A9F4&color=fff&size=200' },
  { name: 'Halal Farms', slug: 'halal-farms', logo: 'https://ui-avatars.com/api/?name=HF&background=F44336&color=fff&size=200' },
  { name: 'Golden Harvest', slug: 'golden-harvest', logo: 'https://ui-avatars.com/api/?name=GH&background=FFC107&color=000&size=200' },
  { name: 'Premium Cuts', slug: 'premium-cuts', logo: 'https://ui-avatars.com/api/?name=PC&background=E91E63&color=fff&size=200' },
  { name: 'Ocean Catch', slug: 'ocean-catch', logo: 'https://ui-avatars.com/api/?name=OC&background=3F51B5&color=fff&size=200' },
  { name: 'Spice Route', slug: 'spice-route', logo: 'https://ui-avatars.com/api/?name=SR&background=FF5722&color=fff&size=200' },
  { name: 'Desi Kitchen', slug: 'desi-kitchen', logo: 'https://ui-avatars.com/api/?name=DK&background=795548&color=fff&size=200' },
  { name: 'Organica', slug: 'organica', logo: 'https://ui-avatars.com/api/?name=OG&background=009688&color=fff&size=200' },
  { name: 'Daily Dairy', slug: 'daily-dairy', logo: 'https://ui-avatars.com/api/?name=DD&background=607D8B&color=fff&size=200' },
  { name: 'Sweet Tooth', slug: 'sweet-tooth', logo: 'https://ui-avatars.com/api/?name=ST&background=9C27B0&color=fff&size=200' }
];

async function main() {
  console.log('Starting brand replacement process...');

  // 1. Remove brandId from all products to prevent foreign key constraint failures
  await prisma.product.updateMany({
    data: { brandId: null }
  });
  console.log('Cleared brand references from all products.');

  // 2. Delete all existing brands
  await prisma.brand.deleteMany({});
  console.log('Deleted all existing brands.');

  // 3. Create new brands
  const createdBrands = [];
  for (const brandData of newBrands) {
    const brand = await prisma.brand.create({
      data: brandData
    });
    createdBrands.push(brand);
  }
  console.log(`Created ${createdBrands.length} new brands.`);

  // 4. Randomly assign new brands to products
  const products = await prisma.product.findMany({ select: { id: true } });
  let assignedCount = 0;
  
  for (const product of products) {
    // 70% chance to have a brand
    if (Math.random() > 0.3) {
      const randomBrand = createdBrands[Math.floor(Math.random() * createdBrands.length)];
      await prisma.product.update({
        where: { id: product.id },
        data: { brandId: randomBrand.id }
      });
      assignedCount++;
    }
  }
  
  console.log(`Re-assigned brands to ${assignedCount} products.`);
  console.log('✅ Brand replacement complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
