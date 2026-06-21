import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  console.log('Sidebar seeder skipped (no categories, brands, or attributes)');
}
seed().then(() => console.log('Seeded successfully.')).catch(console.error);
