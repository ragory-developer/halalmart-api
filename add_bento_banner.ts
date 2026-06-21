import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBentoBanner() {
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
        
        // Check if already exists
        const hasBento = doc.sections.some((s: any) => s.type === 'BentoBannerGrid');
        
        if (!hasBento) {
          const bentoSection = {
            id: "bento_banner_grid_home",
            type: "BentoBannerGrid",
            variant: "default",
            props: {}
          };

          // Find PromoBanner index to insert after it
          const promoIndex = doc.sections.findIndex((s: any) => s.type === 'PromoBanner');
          
          if (promoIndex !== -1) {
            doc.sections.splice(promoIndex + 1, 0, bentoSection);
          } else {
            // Fallback: append
            doc.sections.push(bentoSection);
          }

          await prisma.builderPageVersion.update({
            where: { id: version.id },
            data: { document: doc }
          });
          console.log('Successfully added BentoBannerGrid to home page.');
        } else {
          console.log('BentoBannerGrid already exists in home page layout.');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBentoBanner();
