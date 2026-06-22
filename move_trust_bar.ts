import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveTrustBar() {
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
    
    // Find TrustBar
    const trustBarIndex = sections.findIndex(c => c.type === 'TrustBar');
    if (trustBarIndex === -1) {
      console.log('TrustBar not found in sections.');
      return;
    }

    const trustBarComponent = sections[trustBarIndex];
    sections.splice(trustBarIndex, 1);

    // Find HeroBanner
    const heroIndex = sections.findIndex(c => c.type === 'HeroBanner');
    
    if (heroIndex === -1) {
      // If no HeroBanner, just put it at the top
      sections.unshift(trustBarComponent);
      console.log('HeroBanner not found, moved TrustBar to top.');
    } else {
      // Insert TrustBar right after HeroBanner
      sections.splice(heroIndex + 1, 0, trustBarComponent);
      console.log(`Moved TrustBar below HeroBanner (index ${heroIndex}).`);
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

moveTrustBar();
