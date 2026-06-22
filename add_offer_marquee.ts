import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addOfferMarquee() {
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
    const existingIndex = sections.findIndex(c => c.type === 'OfferMarquee');
    if (existingIndex !== -1) {
      console.log('OfferMarquee already exists in layout. Removing it to reposition...');
      sections.splice(existingIndex, 1);
    }

    const newComponent = {
      id: `offer_marquee_home_${Date.now()}`,
      type: "OfferMarquee",
      variant: "default",
      props: {}
    };

    // Find Featured Products
    const featuredIndex = sections.findIndex(c => c.id === 'product_showcase_featured' || c.type === 'ProductShowcase');
    
    if (featuredIndex === -1) {
      // Put at bottom if not found
      sections.push(newComponent);
      console.log('Featured products not found, added OfferMarquee to bottom.');
    } else {
      // Insert OfferMarquee right before Featured Products
      sections.splice(featuredIndex, 0, newComponent);
      console.log(`Inserted OfferMarquee above Featured Products (index ${featuredIndex}).`);
    }

    doc.sections = sections;

    await prisma.builderPageVersion.update({
      where: { id: pageVersion.id },
      data: { document: doc }
    });

    console.log('Successfully updated builder page document with OfferMarquee.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addOfferMarquee();
