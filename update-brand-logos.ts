import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const brandLogos: Record<string, string> = {
  'shan': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Shan_Foods_Logo.png',
  'mdh': 'https://upload.wikimedia.org/wikipedia/en/9/90/Mahashian_Di_Hatti_logo.png',
  'national': 'https://nfoods.com/wp-content/uploads/2018/12/logo-national-foods.png',
  'pran': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/PRAN_Logo.svg',
  'haldirams': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Haldiram%27s_Logo.svg',
  'amul': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Amul_Logo.svg',
  'tilda': 'https://upload.wikimedia.org/wikipedia/en/1/11/Tilda_Rice_logo.png',
  'daawat': 'https://www.daawat.com/assets/images/logo.png',
  'kohinoor': 'https://upload.wikimedia.org/wikipedia/en/2/23/Kohinoor_Foods_Logo.png',
  'maggi': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Maggi_logo.svg',
  'knorr': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Knorr_logo.svg',
  'bombay-sweets': 'https://bombaysweetsbd.com/wp-content/uploads/2021/04/bombay-sweets-logo-1.png',
  'laziza': 'https://lazizafoods.com/wp-content/uploads/2021/04/Laziza-Logo.png',
  'al-islami': 'https://upload.wikimedia.org/wikipedia/en/d/df/Al_Islami_Foods_logo.jpg',
  'sadia': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Sadia_logo.svg',
  'doux': 'https://upload.wikimedia.org/wikipedia/en/9/93/Doux_logo.png',
  'seara': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Seara_logo.svg',
  'almarai': 'https://upload.wikimedia.org/wikipedia/en/9/93/Almarai_logo.svg',
  'lipton': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Lipton_logo_2014.svg',
  'brooke-bond': 'https://upload.wikimedia.org/wikipedia/en/4/41/Brooke_Bond_logo.png',
  'taj-mahal': 'https://upload.wikimedia.org/wikipedia/en/5/5a/Brooke_Bond_Taj_Mahal_logo.png',
  'rooh-afza': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Rooh_Afza_logo.svg',
  'hemani': 'https://hemanitrading.com/images/logo.png',
  'dabur': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Dabur_Logo.svg',
  'himalaya': 'https://upload.wikimedia.org/wikipedia/en/2/2b/Himalaya_Drug_Company_logo.png',
  'parachute': 'https://upload.wikimedia.org/wikipedia/en/6/6b/Parachute_Logo.png',
  'patanjali': 'https://upload.wikimedia.org/wikipedia/en/3/36/Patanjali_Ayurved_logo.svg',
  'aashirvaad': 'https://upload.wikimedia.org/wikipedia/en/4/43/Aashirvaad_logo.png',
  'ziyad': 'https://ziyad.com/wp-content/uploads/2021/09/ziyad-logo-main.svg',
  'midamar': 'https://midamarhalal.com/images/logo.png',
  'al-safa': 'https://alsafahalal.com/wp-content/uploads/2020/12/logo-al-safa.png',
  'ahmed-foods': 'https://ahmedfood.com/wp-content/uploads/2020/12/logo-ahmed-food.png',
};

async function main() {
  console.log('Updating brand logos...');

  for (const [slug, logo] of Object.entries(brandLogos)) {
    try {
      await prisma.brand.updateMany({
        where: { slug },
        data: { logo },
      });
      console.log(`Updated logo for brand: ${slug}`);
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  // Set any remaining placehold.co logos to a nicer default
  const remainingBrands = await prisma.brand.findMany({
    where: {
      logo: {
        contains: 'placehold.co'
      }
    }
  });

  for (const brand of remainingBrands) {
    const backupUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=0D8ABC&color=fff&size=200&bold=true`;
    await prisma.brand.update({
      where: { id: brand.id },
      data: { logo: backupUrl }
    });
    console.log(`Set fallback logo for: ${brand.slug}`);
  }

  console.log('✅ All brand logos updated.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
