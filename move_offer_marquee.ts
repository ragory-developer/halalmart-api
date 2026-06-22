import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveOfferMarquee() {
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
    
    // Find OfferMarquee
    const offerIndex = sections.findIndex(c => c.type === 'OfferMarquee');
    if (offerIndex === -1) {
      console.log('OfferMarquee not found.');
      return;
    }

    const offerComponent = sections[offerIndex];
    sections.splice(offerIndex, 1); // remove from current pos

    // Find SpecialOffersBanner
    const specialIndex = sections.findIndex(c => c.type === 'SpecialOffersBanner');
    
    if (specialIndex === -1) {
      // Put at bottom if not found
      sections.push(offerComponent);
      console.log('SpecialOffersBanner not found, added OfferMarquee to bottom.');
    } else {
      // Insert OfferMarquee right after SpecialOffersBanner
      sections.splice(specialIndex + 1, 0, offerComponent);
      console.log(`Moved OfferMarquee below SpecialOffersBanner (inserted at index ${specialIndex + 1}).`);
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

moveOfferMarquee();
