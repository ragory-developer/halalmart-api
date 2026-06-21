import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({ take: 20 });
  const productIds = products.map(p => p.id);
  
  if (productIds.length < 5) return console.log('Not enough products');
  
  for (let i = 0; i < products.length; i++) {
    const upsells = [
      productIds[(i + 1) % productIds.length],
      productIds[(i + 2) % productIds.length],
      productIds[(i + 3) % productIds.length],
      productIds[(i + 4) % productIds.length]
    ];
    
    const downsells = [
      productIds[(i + 2) % productIds.length],
      productIds[(i + 3) % productIds.length]
    ];
    
    await prisma.product.update({
      where: { id: products[i].id },
      data: {
        upsellProducts: JSON.stringify(upsells),
        downsellProducts: JSON.stringify(downsells)
      }
    });
  }
  console.log('Seeded upsell and downsell products!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
