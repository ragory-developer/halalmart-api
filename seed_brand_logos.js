const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const customBrands = [
  {
    "brand": "Pran",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/pran.png?q=low&webp=1"
  },
  {
    "brand": "Reckitt",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/reckitt.png?q=low&webp=1"
  },
  {
    "brand": "Nestle",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/nestle.png?q=low&webp=1"
  },
  {
    "brand": "Unilever",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/uniliver.png?q=low&webp=1"
  },
  {
    "brand": "Marico",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/marico.png?q=low&webp=1"
  },
  {
    "brand": "Godrej",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/godrej-seeklogo.png?q=low&webp=1"
  },
  {
    "brand": "Coca Cola",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/coca-cola.png?q=low&webp=1"
  },
  {
    "brand": "Fresh",
    "image": "https://chaldn.com/asset/egg-chaldal-web-release-id-29483/https/Default/stores/chaldal/components/landingPage2/LandingPage/images/fresh.png?q=low&webp=1"
  }
];

async function seedBrandLogos() {
    console.log('Seeding custom BD brands into database...');
    
    let updatedCount = 0;
    for (const item of customBrands) {
        const slug = item.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        await prisma.brand.upsert({
            where: { slug },
            update: { logo: item.image, name: item.brand },
            create: {
                name: item.brand,
                slug,
                logo: item.image
            }
        });
        updatedCount++;
    }
    
    console.log(`Successfully seeded/updated ${updatedCount} brands in the database.`);
}

seedBrandLogos()
    .catch(e => console.error('Error seeding brand logos:', e))
    .finally(() => prisma.$disconnect());
