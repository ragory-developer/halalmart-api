import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeBentoBanner() {
  try {
    const page = await prisma.builderPage.findUnique({
      where: { key: 'home' }
    });

    if (page && page.publishedVersionId) {
      const version = await prisma.builderPageVersion.findUnique({
        where: { id: page.publishedVersionId }
      });

      if (version && version.document) {
        const doc = version.document as any;
        
        // Remove BentoBannerGrid
        const newSections = doc.sections.filter((s: any) => s.type !== 'BentoBannerGrid');
        
        if (newSections.length !== doc.sections.length) {
          doc.sections = newSections;

          await prisma.builderPageVersion.update({
            where: { id: version.id },
            data: { document: doc }
          });
          console.log('Successfully removed BentoBannerGrid from home page.');
        } else {
          console.log('BentoBannerGrid not found in home page layout.');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeBentoBanner();
