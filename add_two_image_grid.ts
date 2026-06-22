import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTwoImageGrid() {
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
    if (sections.some(s => s.type === 'TwoImageGridBanner')) {
      console.log('TwoImageGridBanner already exists. Removing old ones.');
      sections = sections.filter(s => s.type !== 'TwoImageGridBanner');
    }

    const newComponent = {
      id: `two-image-grid-${Date.now()}`,
      type: 'TwoImageGridBanner',
      props: {}
    };

    // Find "Halal Meat" section by checking props.title or props.showcaseCategoryId
    const halalIndex = sections.findIndex(c => 
      c.type === 'ProductShowcase' && 
      (c.props?.title?.toLowerCase().includes('halal') || c.props?.showcaseCategoryId === 'halal-meat')
    );

    if (halalIndex !== -1) {
      // Insert BEFORE Halal Meat
      sections.splice(halalIndex, 0, newComponent);
      console.log(`Inserted TwoImageGridBanner before Halal Meat (at index ${halalIndex}).`);
    } else {
      // If Halal Meat not found, try to find Featured Products and insert AFTER it
      const featuredIndex = sections.findIndex(c => 
        c.type === 'ProductShowcase' && 
        c.props?.title?.toLowerCase().includes('feature')
      );
      
      if (featuredIndex !== -1) {
        sections.splice(featuredIndex + 1, 0, newComponent);
        console.log(`Inserted TwoImageGridBanner after Featured Products (at index ${featuredIndex + 1}).`);
      } else {
        // Just put it at the bottom
        sections.push(newComponent);
        console.log('Inserted TwoImageGridBanner at the bottom.');
      }
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

addTwoImageGrid();
