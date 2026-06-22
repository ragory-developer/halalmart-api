import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPromoBadgeGrid() {
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
        const hasPromoBadgeGrid = doc.sections.some((s: any) => s.type === 'PromoBadgeGrid');
        
        if (!hasPromoBadgeGrid) {
          const promoBadgeGridSection = {
            id: "promo_badge_grid_home_" + Date.now(),
            type: "PromoBadgeGrid",
            variant: "default",
            props: {}
          };

          // Find HeroBanner or PromoBanner index to insert after it
          const insertIndex = doc.sections.findIndex((s: any) => s.type === 'HeroBanner' || s.type === 'PromoBanner');
          
          if (insertIndex !== -1) {
            doc.sections.splice(insertIndex + 1, 0, promoBadgeGridSection);
          } else {
            // Fallback: prepend
            doc.sections.unshift(promoBadgeGridSection);
          }

          await prisma.builderPageVersion.update({
            where: { id: version.id },
            data: { document: doc }
          });
          console.log('Successfully added PromoBadgeGrid to home page.');
        } else {
          console.log('PromoBadgeGrid already exists in home page layout.');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPromoBadgeGrid();
