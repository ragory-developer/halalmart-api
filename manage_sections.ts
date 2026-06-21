import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function manageSections() {
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
        console.log("Current Sections:", doc.sections.map((s: any) => s.type));

        // Check if PromoBanner exists
        const hasPromo = doc.sections.some((s: any) => s.type === 'PromoBanner');
        
        if (!hasPromo) {
          console.log("PromoBanner not found. Adding it...");
          
          const newPromoSection = {
            id: "promo_banner_home_new",
            type: "PromoBanner",
            variant: "default",
            props: {}
          };

          // Insert after HeroBanner or at beginning
          doc.sections.splice(1, 0, newPromoSection);

          await prisma.builderPageVersion.update({
            where: { id: version.id },
            data: { document: doc }
          });
          console.log("Added PromoBanner.");
        } else {
          console.log("PromoBanner already exists.");
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

manageSections();
