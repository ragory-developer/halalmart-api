import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allMedia = await prisma.media.findMany({ take: 10 });
  
  if (allMedia.length < 3) {
    console.error("Not enough media in the database to update 3 hero slides.");
    return;
  }

  // Get the current hero slides
  const setting = await prisma.setting.findUnique({ where: { key: 'hero_slides' } });
  if (!setting) {
    console.error("hero_slides setting not found");
    return;
  }

  const slides = JSON.parse(setting.value);
  
  // Update imageSrc for the 3 slides using the first 3 media URLs
  slides[0].imageSrc = allMedia[3].urlFull;
  slides[1].imageSrc = allMedia[4].urlFull;
  if (slides.length > 2) {
    slides[2].imageSrc = allMedia[5].urlFull;
  }

  await prisma.setting.update({
    where: { key: 'hero_slides' },
    data: { value: JSON.stringify(slides) }
  });

  console.log("Hero slides updated successfully with media images from the database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
