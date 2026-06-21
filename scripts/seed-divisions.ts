import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const state = await prisma.state.findFirst({ where: { name: 'Rangpur Division' } });
  if (!state) { console.error('Rangpur Division not found!'); return; }
  console.log('Found Rangpur Division:', state.id);

  const cities = [
    'Dinajpur', 'Rangpur', 'Gaibandha', 'Kurigram',
    'Thakurgaon', 'Panchagarh', 'Nilphamari', 'Lalmonirhat',
  ];

  for (const name of cities) {
    const existing = await prisma.city.findFirst({ where: { name, stateId: state.id } });
    if (!existing) {
      await prisma.city.create({ data: { name, stateId: state.id, status: 'active' } });
      console.log('✅', name);
    } else {
      console.log('⏭️  Already exists:', name);
    }
  }

  console.log('\n🎉 Done! Inserted cities for Rangpur Division');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
