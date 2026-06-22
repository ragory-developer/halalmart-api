import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const homePage = await prisma.builderPage.findUnique({
    where: { key: 'home' }
  });

  if (!homePage || !homePage.publishedVersionId) {
    console.error('Home page or published version not found');
    return;
  }

  const version = await prisma.builderPageVersion.findUnique({
    where: { id: homePage.publishedVersionId }
  });

  if (!version || !version.document) {
    console.error('Version document not found');
    return;
  }

  const document: any = version.document;
  
  if (!document.sections || !Array.isArray(document.sections)) {
    console.error('Document has no sections array');
    return;
  }

  const sections = [...document.sections];
  const brandIndex = sections.findIndex(s => s.type === 'BrandShowcase');
  
  if (brandIndex === -1) {
    console.error('BrandShowcase not found');
    return;
  }
  
  const brandSection = sections[brandIndex];
  
  // Also update its props to match CategoryShowcase alignment
  brandSection.props.textAlign = "left";
  brandSection.props.eyebrow = "Top Rated";
  
  sections.splice(brandIndex, 1);
  
  const categoryIndex = sections.findIndex(s => s.type === 'CategoryShowcase');
  
  if (categoryIndex === -1) {
    console.error('CategoryShowcase not found');
    return;
  }
  
  sections.splice(categoryIndex + 1, 0, brandSection);
  document.sections = sections;
  
  await prisma.builderPageVersion.update({
    where: { id: homePage.publishedVersionId },
    data: { document }
  });
  
  console.log('Moved BrandShowcase to immediately after CategoryShowcase.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
