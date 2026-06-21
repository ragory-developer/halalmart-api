import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding for City Halal Market...');

  // --- Clean up existing data ---
  console.log('🧹 Cleaning up existing data...');

  await prisma.orderNote.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.variantAttribute.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.builderPageVersion.deleteMany({});
  await prisma.builderPage.deleteMany({});
  await prisma.builderTemplate.deleteMany({});
  await prisma.builderComponentContent.deleteMany({});
  await prisma.builderComponent.deleteMany({});
  await prisma.navbarItem.deleteMany({});
  await prisma.footerLink.deleteMany({});
  await prisma.footerSection.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Clean up completed.');

  // --- Seed Users ---
  console.log('👤 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@cityhalalmarket.com',
      password: hashedPassword,
      name: 'Store Manager',
      phone: '3050000000',
      role: 'SUPER_ADMIN',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@cityhalalmarket.com',
      password: hashedPassword,
      name: 'Aisha Khan',
      phone: '7860000000',
      role: 'USER',
    },
  });
  const customerCart = await prisma.cart.create({
    data: { userId: customer.id },
  });

  // --- Florida Regions ---
  console.log('🗺️ Seeding locations...');
  const stateFlorida = await prisma.state.upsert({
    where: { name: 'Florida' },
    update: {},
    create: { name: 'Florida', status: 'active' },
  });

  const cityMiami = await prisma.city.create({
    data: { name: 'Miami', stateId: stateFlorida.id, status: 'active' },
  });
  const cityFortLauderdale = await prisma.city.create({
    data: { name: 'Fort Lauderdale', stateId: stateFlorida.id, status: 'active' },
  });

  const areaMiamiGardens = await prisma.area.create({
    data: { name: 'Miami Gardens', cityId: cityMiami.id, status: 'active' },
  });

  // Seed Customer Address
  await prisma.userAddress.create({
    data: {
      userId: customer.id,
      label: 'Home',
      address: '1234 Halal Way, Apt 2B',
      city: 'Miami',
      area: 'Miami Gardens',
      state: 'Florida',
      stateId: stateFlorida.id,
      cityId: cityMiami.id,
      areaId: areaMiamiGardens.id,
      isDefault: true,
      recipientName: 'Aisha Khan',
      recipientPhone: '7860000000',
    },
  });

  // --- Seed Brands ---
  console.log('🏷️ Seeding brands...');
  const brandPran = await prisma.brand.create({ data: { name: 'Pran', slug: 'pran' } });
  const brandMDH = await prisma.brand.create({ data: { name: 'MDH', slug: 'mdh' } });
  const brandShan = await prisma.brand.create({ data: { name: 'Shan', slug: 'shan' } });
  const brandTilda = await prisma.brand.create({ data: { name: 'Tilda', slug: 'tilda' } });
  const brandHaldirams = await prisma.brand.create({ data: { name: "Haldiram's", slug: 'haldirams' } });
  const brandAmul = await prisma.brand.create({ data: { name: 'Amul', slug: 'amul' } });

  // --- Seed Categories ---
  console.log('🗂️ Seeding categories...');
  const categories = [
    { name: 'Halal Meat', slug: 'halal-meat' },
    { name: 'Fresh Produce', slug: 'fresh-produce' },
    { name: 'Rice', slug: 'rice' },
    { name: 'Flour & Bread', slug: 'flour-bread' },
    { name: 'Lentils & Dal', slug: 'lentils-dal' },
    { name: 'Spices', slug: 'spices' },
    { name: 'Frozen Foods', slug: 'frozen-foods' },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
    { name: 'Drinks', slug: 'drinks' },
    { name: 'Snacks & Sweets', slug: 'snacks-sweets' },
    { name: 'Bangladeshi', slug: 'bangladeshi' },
    { name: 'Indian', slug: 'indian' },
    { name: 'Pakistani', slug: 'pakistani' },
    { name: 'Middle Eastern', slug: 'middle-eastern' },
    { name: 'Household', slug: 'household' },
    { name: 'Catering / Bulk', slug: 'catering-bulk' },
  ];
  
  const createdCats: any = {};
  for (const cat of categories) {
    createdCats[cat.slug] = await prisma.category.create({ data: cat });
  }

  // --- Seed Products & Variants ---
  console.log('🛍️ Seeding products from S3 mapped images...');

  // 1. Pre-defined manual products for specific UI elements
  // We keep the old ones for specific components, or we can just use dynamic ones.
  // We'll keep the chicken and dates for specific showcase references
  const prodChicken = await prisma.product.create({
    data: {
      name: 'Fresh Halal Whole Chicken',
      slug: 'fresh-halal-whole-chicken',
      description: 'Hand-slaughtered, Zabiha certified fresh whole chicken. Cut to your preference.',
      shortDescription: 'Fresh Zabiha Halal Chicken',
      price: 12.99,
      stock: 50,
      image: '/assets/01.Coming soon 10_x3_-1.png', // Fallback, will be overwritten if available
      images: '["/assets/01.Coming soon 10_x3_-1.png"]',
      unit: 'bird',
      isHalal: true,
      featured: true,
      categories: { connect: [{ id: createdCats['halal-meat'].id }] },
      variants: {
        create: [
          { sku: 'CHK-WH', price: 12.99, stock: 20, isDefault: true, attributes: { create: [{ name: 'Cut', value: 'Whole' }] } },
          { sku: 'CHK-8PC', price: 13.99, stock: 30, isDefault: false, attributes: { create: [{ name: 'Cut', value: 'Cut in 8 Pieces' }] } }
        ]
      }
    },
    include: { variants: true }
  });

  const mapFilePath = path.resolve(__dirname, 's3_image_map.json');
  if (fs.existsSync(mapFilePath)) {
    const s3Images = JSON.parse(fs.readFileSync(mapFilePath, 'utf8'));
    console.log(`Found ${s3Images.length} images mapped from S3.`);
    
    // Ensure all categories from map exist
    const uniqueCategories = [...new Set(s3Images.map((img: any) => img.categorySlug))];
    for (const catSlug of uniqueCategories as string[]) {
      if (!createdCats[catSlug]) {
        createdCats[catSlug] = await prisma.category.create({
          data: { name: catSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), slug: catSlug }
        });
      }
    }

    let i = 0;
    for (const img of s3Images) {
      i++;
      const price = Math.floor(Math.random() * 20) + 1.99; // Random price between 1.99 and 21.99
      const stock = Math.floor(Math.random() * 100) + 10;
      
      const p = await prisma.product.create({
        data: {
          name: img.name,
          slug: img.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + i,
          description: `Premium quality ${img.name} available at City Halal Market.`,
          shortDescription: img.name,
          price: price,
          stock: stock,
          image: img.s3Url,
          images: JSON.stringify([img.s3Url]),
          unit: 'pcs',
          featured: i % 5 === 0, // feature every 5th product
          categories: { connect: [{ id: createdCats[img.categorySlug].id }] },
        }
      });
    }
    console.log('✅ Dynamic S3 products seeded.');
  } else {
    console.warn('⚠️ s3_image_map.json not found, skipping dynamic S3 products seeding.');
  }

  // --- Seed Global Store Settings ---
  console.log('⚙️ Seeding store settings...');
  const settingsData = [
    { key: 'store_name', value: 'City Halal Market' },
    { key: 'store_logo', value: '/assets/02.logo 24_x20_-1.png' },
    { key: 'footer_about_text', value: "South Florida's premier halal supermarket serving Bangladeshi, Indian, Pakistani, Middle Eastern and Muslim communities." },
    { key: 'footer_address', value: 'Suite 170, South Florida' },
    { key: 'footer_phone', value: '(555) 123-4567' },
    { key: 'footer_email', value: 'contact@cityhalalmarket.com' },
    { key: 'footer_copyright', value: '© 2026 City Halal Market. All rights reserved.' },
    { key: 'currency', value: '$' },
    { key: 'permalink_structure', value: 'flat' },
    { key: 'productCardVariant', value: 'classic' },
    { key: 'productCardRadius', value: '2xl' },
    { key: 'productCardShowBadge', value: 'true' },
    { key: 'productCardShowRating', value: 'true' },
    { key: 'productCardShowAddToCart', value: 'true' },
    { key: 'productCardBadgeStyle', value: 'pill' },
  ];

  for (const setting of settingsData) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  // --- Seed Navbar & Footer Navigation ---
  const navItems = [
    { title: "Home", url: "/", sortOrder: 1, isActive: true },
    { title: "Halal Meat", url: "/halal-meat-market", sortOrder: 2, isActive: true },
    { title: "Groceries", url: "/products", sortOrder: 3, isActive: true },
    { title: "Weekly Specials", url: "/weekly-specials", sortOrder: 4, isActive: true },
    { title: "About Us", url: "/about", sortOrder: 5, isActive: true },
    { title: "Contact", url: "/contact", sortOrder: 6, isActive: true },
  ];

  for (const item of navItems) {
    await prisma.navbarItem.create({ data: item });
  }

  const footerSec = await prisma.footerSection.create({
    data: { title: "Quick Links", sortOrder: 1 }
  });

  const footerLinks = [
    { title: "About Us", url: "/about", sortOrder: 1, sectionId: footerSec.id },
    { title: "Our Products", url: "/products", sortOrder: 2, sectionId: footerSec.id },
    { title: "Halal Promise", url: "/promise", sortOrder: 3, sectionId: footerSec.id },
    { title: "Contact", url: "/contact", sortOrder: 4, sectionId: footerSec.id },
  ];

  for (const link of footerLinks) {
    await prisma.footerLink.create({ data: link });
  }

  // --- Seed Page Builder Components & Pages ---
  const defaultComponents = [
    { name: 'HeroBanner', label: 'Hero Banner', category: 'Hero' },
    { name: 'PromoBadgeGrid', label: 'Feature Badges', category: 'Marketing' },
    { name: 'HotDealsSection', label: 'Countdown Deals', category: 'Commerce' },
    { name: 'ProductShowcase', label: 'Product Grid', category: 'Commerce' },
    { name: 'TestimonialSection', label: 'Customer Reviews', category: 'Content' },
    { name: 'TrustBar', label: 'Trust Bar', category: 'Marketing' },
    { name: 'WhyUsSection', label: 'Why Us Section', category: 'Content' },
    { name: 'PromoBanner', label: 'Promo Banner', category: 'Marketing' },
    { name: 'SpecialOffersBanner', label: 'Special Offers', category: 'Marketing' },
    { name: 'CategoryShowcase', label: 'Category Grid', category: 'Commerce' },
    { name: 'BrandShowcase', label: 'Brand Grid', category: 'Commerce' },
  ];

  for (const comp of defaultComponents) {
    await prisma.builderComponent.create({ data: comp });
  }

  async function seedBuilderPage(key: string, slug: string, title: string, sections: any[]) {
    const documentJson = { schemaVersion: 1, page: { key, slug, title }, sections };
    const page = await prisma.builderPage.upsert({
      where: { key },
      update: { slug, title, type: 'builder', status: 'published' },
      create: { key, slug, title, type: 'builder', status: 'published' }
    });
    const version = await prisma.builderPageVersion.upsert({
      where: { pageId_version: { pageId: page.id, version: 1 } },
      update: { status: 'published', document: documentJson, publishedAt: new Date() },
      create: { pageId: page.id, version: 1, status: 'published', document: documentJson, publishedAt: new Date() }
    });
    await prisma.builderPage.update({
      where: { id: page.id },
      data: { publishedVersionId: version.id }
    });
  }

  const homeSections = [
    {
      id: "hero_banner_home",
      type: "HeroBanner",
      variant: "default",
      props: {}
    },
    {
      id: "trust_bar_home",
      type: "TrustBar",
      variant: "default",
      props: {}
    },
    {
      id: "promo_banner_home",
      type: "PromoBanner",
      variant: "default",
      props: {}
    },
    {
      id: "category_showcase_home",
      type: "CategoryShowcase",
      variant: "default",
      props: {
        eyebrow: "Browse the aisles",
        title: "Shop by Category.",
        subtitle: "Explore our wide range of categories.",
        textAlign: "left"
      }
    },
    {
      id: "promo_badges_home",
      type: "PromoBadgeGrid",
      variant: "default",
      props: {}
    },
    {
      id: "product_showcase_featured",
      type: "ProductShowcase",
      variant: "default",
      props: {
        eyebrow: "Our Best Sellers",
        title: "Featured Products.",
        subtitle: "",
        showCategoryFilter: false,
        textAlign: "left"
      }
    },
    {
      id: "product_showcase_meat",
      type: "ProductShowcase",
      variant: "default",
      props: {
        eyebrow: "The Core of Our Promise",
        title: "Halal Meat Spotlight.",
        subtitle: "Cut to Order. Free of Charge.",
        showCategoryFilter: false,
        textAlign: "left",
        builderClassName: "bg-[var(--color-off-white)] border-y border-[var(--color-card-border)]"
      }
    },
    {
      id: "special_offers_home",
      type: "SpecialOffersBanner",
      variant: "default",
      props: {}
    },
    {
      id: "why_us_home",
      type: "WhyUsSection",
      variant: "default",
      props: {}
    },
    {
      id: "brand_showcase_home",
      type: "BrandShowcase",
      variant: "default",
      props: {
        eyebrow: "Trusted Partners",
        title: "Our Brands.",
        subtitle: "Shop from top quality brands.",
        textAlign: "center"
      }
    }
  ];
  await seedBuilderPage('home', '/', 'Home', homeSections);

  console.log('✅ DB Seeding completely successful for City Halal Market!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
