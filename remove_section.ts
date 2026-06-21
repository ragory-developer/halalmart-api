import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeCategorySection() {
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
        
        // Filter out PromoBadgeGrid
        const originalLength = doc.sections.length;
        doc.sections = doc.sections.filter((s: any) => s.type !== 'PromoBadgeGrid');

        if (doc.sections.length < originalLength) {
          await prisma.builderPageVersion.update({
            where: { id: version.id },
            data: { document: doc }
          });
          console.log('Successfully removed PromoBadgeGrid from home page.');
        } else {
          console.log('PromoBadgeGrid not found in home page layout.');
        }
      } else {
        console.log('Published version document not found.');
      }
    } else {
      console.log('Home page or published version not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeCategorySection();
