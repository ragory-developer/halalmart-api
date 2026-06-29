import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allMedia = await prisma.media.findMany({ take: 3 });
  
  if (allMedia.length < 3) {
    console.error("Not enough media in the database to update 3 hero slides.");
    return;
  }

  // Find the 'home' builder page
  const homePage = await prisma.builderPage.findUnique({
    where: { key: 'home' }
  });

  if (!homePage) {
    console.error("Home page not found in BuilderPage");
    return;
  }

  // Update the draft
  if (homePage.draftVersionId) {
    const draftVersion = await prisma.builderPageVersion.findUnique({ where: { id: homePage.draftVersionId } });
    if (draftVersion) {
      const draftDoc = draftVersion.document as any;
      if (draftDoc.sections) {
        for (const section of draftDoc.sections) {
          if (section.type === 'HeroBanner' && section.props?.slides) {
            if (section.props.slides.length > 0) section.props.slides[0].imageSrc = allMedia[0].urlFull;
            if (section.props.slides.length > 1) section.props.slides[1].imageSrc = allMedia[1].urlFull;
            if (section.props.slides.length > 2) section.props.slides[2].imageSrc = allMedia[2].urlFull;
          }
        }
        await prisma.builderPageVersion.update({
          where: { id: draftVersion.id },
          data: { document: draftDoc }
        });
      }
    }
  }

  // Update the published version
  if (homePage.publishedVersionId) {
    const pubVersion = await prisma.builderPageVersion.findUnique({ where: { id: homePage.publishedVersionId } });
    if (pubVersion) {
      const pubDoc = pubVersion.document as any;
      if (pubDoc.sections) {
        for (const section of pubDoc.sections) {
          if (section.type === 'HeroBanner' && section.props?.slides) {
            if (section.props.slides.length > 0) section.props.slides[0].imageSrc = allMedia[0].urlFull;
            if (section.props.slides.length > 1) section.props.slides[1].imageSrc = allMedia[1].urlFull;
            if (section.props.slides.length > 2) section.props.slides[2].imageSrc = allMedia[2].urlFull;
          }
        }
        await prisma.builderPageVersion.update({
          where: { id: pubVersion.id },
          data: { document: pubDoc }
        });
      }
    }
  }

  console.log("Hero slides in BuilderPage updated successfully with media images from the database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
