import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addThreeProductBanner() {
  try {
    const page = await prisma.builderPage.findUnique({
      where: { key: 'home' }
    });

    if (!page || !page.publishedVersionId) {
      console.log('No published version found for home page.');
      return;
    }

    const pageVersion = await prisma.builderPageVersion.findUnique({
      where: { id: page.publishedVersionId }
    });

    if (!pageVersion) {
      console.log('Published version record not found.');
      return;
    }

    const doc = pageVersion.document as any;
    if (!doc || !Array.isArray(doc.sections)) {
      console.log('Document sections not found.');
      return;
    }

    let sections = [...doc.sections];
    
    // Check if it already exists
    if (sections.some(s => s.type === 'ThreeProductBanner')) {
      console.log('ThreeProductBanner already exists. Removing old ones.');
      sections = sections.filter(s => s.type !== 'ThreeProductBanner');
    }

    const newComponent = {
      id: `three-product-banner-${Date.now()}`,
      type: 'ThreeProductBanner',
      props: {}
    };

    // Find OfferMarquee
    const targetIndex = sections.findIndex(c => c.type === 'OfferMarquee');

    if (targetIndex !== -1) {
      // Insert after OfferMarquee
      sections.splice(targetIndex + 1, 0, newComponent);
      console.log(`Inserted ThreeProductBanner after OfferMarquee (at index ${targetIndex + 1}).`);
    } else {
      // Just put it at the bottom
      sections.push(newComponent);
      console.log('Inserted ThreeProductBanner at the bottom.');
    }

    doc.sections = sections;

    await prisma.builderPageVersion.update({
      where: { id: pageVersion.id },
      data: { document: doc }
    });

    console.log('Successfully updated builder page document.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addThreeProductBanner();
