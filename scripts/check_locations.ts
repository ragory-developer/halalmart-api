import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const states = await prisma.state.findMany({ where: { name: 'Barisal' } });
  console.log('States:', JSON.stringify(states, null, 2));

  const cities = await prisma.city.findMany({ 
    where: { name: 'Borguna' },
    include: { state: true }
  });
  console.log('Cities:', JSON.stringify(cities, null, 2));

  const areas = await prisma.area.findMany({ 
    where: { name: 'Amtali' },
    include: { city: true }
  });
  console.log('Areas:', JSON.stringify(areas, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
