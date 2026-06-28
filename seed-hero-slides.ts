import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slides = [
  {
    title: `<span class="block text-gray-900 text-5xl md:text-7xl leading-tight font-black font-display tracking-tight">Farm Fresh Organic</span>\n<span class="block text-[var(--color-forest)] text-5xl md:text-7xl leading-tight font-black font-display tracking-tight mt-2">Direct To You.</span>`,
    description: "Experience the true taste of nature. We source the finest organic produce, premium halal meats, and artisan goods daily to guarantee unmatched freshness.",
    badgeText: "Harvested Daily",
    ctaText: "Shop Fresh Produce",
    ctaHref: "/products",
    offerText: "View Weekly Deals",
    offerSubtext: "100% Organic", 
    imageSrc: "https://pngimg.com/d/vegetables_PNG43.png",
    bgClass: "bg-emerald-50",
    imageBgClass: "bg-emerald-200"
  },
  {
    title: `<span class="block text-gray-900 text-5xl md:text-7xl leading-tight font-black font-display tracking-tight">Premium Quality</span>\n<span class="block text-[var(--color-brand-red)] text-5xl md:text-7xl leading-tight font-black font-display tracking-tight mt-2">Delivered Fast.</span>`,
    description: "Skip the lines. Shop our curated selection of ultra-fresh fruits, vegetables, and pantry essentials, delivered straight to your kitchen in minutes.",
    badgeText: "Lightning Delivery",
    ctaText: "Start Shopping",
    ctaHref: "/categories",
    offerText: "Delivery Info",
    offerSubtext: "Free Over $50",
    imageSrc: "https://pngimg.com/d/grocery_PNG42.png",
    bgClass: "bg-amber-50",
    imageBgClass: "bg-amber-200"
  },
  {
    title: `<span class="block text-gray-900 text-5xl md:text-7xl leading-tight font-black font-display tracking-tight">Wholesome & Pure</span>\n<span class="block text-red-600 text-5xl md:text-7xl leading-tight font-black font-display tracking-tight mt-2">Premium Halal Meat.</span>`,
    description: "From local farms to your table, enjoy a premium selection of natural and certified halal products you can trust.",
    badgeText: "Certified Quality",
    ctaText: "Explore Meats",
    ctaHref: "/categories/meat",
    offerText: "Our Standards",
    offerSubtext: "Zabiha Halal",
    imageSrc: "https://pngimg.com/d/meat_PNG4817.png",
    bgClass: "bg-red-50",
    imageBgClass: "bg-red-200"
  }
];

async function main() {
  await prisma.setting.upsert({
    where: { key: 'hero_slides' },
    update: { value: JSON.stringify(slides) },
    create: { key: 'hero_slides', value: JSON.stringify(slides) },
  });
  console.log("Hero slides seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
