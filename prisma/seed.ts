import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // --- Clean up existing data ---
  console.log('🧹 Cleaning up existing data...');

  // Delete orders first due to foreign keys
  await prisma.orderNote.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // Delete reviews, carts and wishlists
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});

  // Delete variant attributes and variants
  await prisma.variantAttribute.deleteMany({});
  await prisma.productVariant.deleteMany({});

  // Delete products, categories, and brands
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});

  // Delete builder pages and builder page versions
  await prisma.builderPageVersion.deleteMany({});
  await prisma.builderPage.deleteMany({});
  await prisma.builderTemplate.deleteMany({});
  await prisma.builderComponentContent.deleteMany({});
  await prisma.builderComponent.deleteMany({});

  // Delete navigation, footer, settings, and addresses
  await prisma.navbarItem.deleteMany({});
  await prisma.footerLink.deleteMany({});
  await prisma.footerSection.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.userAddress.deleteMany({});

  // Delete locations
  await prisma.area.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.state.deleteMany({});

  // Delete users
  await prisma.user.deleteMany({});

  console.log('✅ Clean up completed.');

  // --- Seed Users ---
  console.log('👤 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@halalmart.com',
      password: hashedPassword,
      name: 'System Administrator',
      phone: '01700000000',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Super Admin created: admin@halalmart.com / password123');

  // Customer
  const customer = await prisma.user.create({
    data: {
      email: 'customer@halalmart.com',
      password: hashedPassword,
      name: 'Jane Doe',
      phone: '01800000000',
      role: 'USER',
    },
  });
  // Create cart for customer
  const customerCart = await prisma.cart.create({
    data: {
      userId: customer.id,
    },
  });
  console.log('✅ Customer created: customer@halalmart.com / password123');

  // --- Bangladesh Divisions (States) ---
  console.log('🗺️ Seeding locations...');
  const stateDhaka = await prisma.state.upsert({
    where: { name: 'Dhaka Division' },
    update: {},
    create: { name: 'Dhaka Division', status: 'active' },
  });

  const stateChittagong = await prisma.state.upsert({
    where: { name: 'Chittagong Division' },
    update: {},
    create: { name: 'Chittagong Division', status: 'active' },
  });

  const cityDhaka = await prisma.city.create({
    data: { name: 'Dhaka City', stateId: stateDhaka.id, status: 'active' },
  });

  const cityChittagong = await prisma.city.create({
    data: { name: 'Chittagong Area', stateId: stateChittagong.id, status: 'active' },
  });

  const areaGulshan = await prisma.area.create({
    data: { name: 'Gulshan', cityId: cityDhaka.id, status: 'active' },
  });

  const areaBanani = await prisma.area.create({
    data: { name: 'Banani', cityId: cityDhaka.id, status: 'active' },
  });

  // Seed Customer Address
  await prisma.userAddress.create({
    data: {
      userId: customer.id,
      label: 'Home',
      address: 'House 42, Road 11, Banani',
      city: 'Dhaka City',
      area: 'Banani',
      state: 'Dhaka Division',
      stateId: stateDhaka.id,
      cityId: cityDhaka.id,
      areaId: areaBanani.id,
      isDefault: true,
      recipientName: 'Jane Doe',
      recipientPhone: '01800000000',
    },
  });
  console.log('✅ Locations & customer address seeded');

  // --- Seed Brands ---
  console.log('🏷️ Seeding brands...');
  const brandOrdinary = await prisma.brand.create({
    data: { name: 'The Ordinary', slug: 'the-ordinary', content: 'Clinical formulations with integrity.' },
  });
  const brandCerave = await prisma.brand.create({
    data: { name: 'CeraVe', slug: 'cerave', content: 'Dermatologist developed skincare.' },
  });
  const brandLoreal = await prisma.brand.create({
    data: { name: "L'Oreal", slug: 'loreal', content: 'World leader in beauty.' },
  });
  const brandMac = await prisma.brand.create({
    data: { name: 'MAC Cosmetics', slug: 'mac-cosmetics', content: 'Professional quality makeup.' },
  });
  console.log('✅ Brands seeded');

  // --- Seed Categories ---
  console.log('🗂️ Seeding categories...');
  const catSkincare = await prisma.category.create({
    data: { name: 'Organic Skincare', slug: 'organic-skincare', content: 'Natural skin health products' },
  });
  const catHaircare = await prisma.category.create({
    data: { name: 'Premium Haircare', slug: 'premium-haircare', content: 'Salon grade haircare products' },
  });
  const catMakeup = await prisma.category.create({
    data: { name: 'Makeup Essentials', slug: 'makeup-essentials', content: 'Professional cosmetic selections' },
  });
  const catFragrance = await prisma.category.create({
    data: { name: 'Fragrances', slug: 'fragrances', content: 'Luxury scents and perfumes' },
  });
  console.log('✅ Categories seeded');

  // --- Seed Products & Variants ---
  console.log('🛍️ Seeding products & variants...');

  // 1. Aloe Vera Gel
  const prodAloe = await prisma.product.create({
    data: {
      name: 'Aloe Vera Soothing Gel',
      slug: 'aloe-vera-soothing-gel',
      description: 'Pure cooling organic aloe vera gel for body and face hydration. Soothes sunburns and moisturizes dry skin.',
      shortDescription: '100% Organic Aloe Vera Soothing Gel.',
      price: 450,
      stock: 100,
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
      images: '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80"]',
      unit: 'tube',
      weight: '150ml',
      featured: true,
      brandId: brandCerave.id,
      categories: { connect: [{ id: catSkincare.id }] },
      variants: {
        create: [
          {
            sku: 'ALOE-150',
            price: 450,
            stock: 60,
            isDefault: true,
            attributes: {
              create: [{ name: 'Size', value: '150ml' }]
            }
          },
          {
            sku: 'ALOE-300',
            price: 750,
            stock: 40,
            isDefault: false,
            attributes: {
              create: [{ name: 'Size', value: '300ml' }]
            }
          }
        ]
      }
    },
    include: { variants: true }
  });

  // 2. Vitamin C Serum
  const prodVitC = await prisma.product.create({
    data: {
      name: 'Vitamin C Glow Serum',
      slug: 'vitamin-c-glow-serum',
      description: 'Highly effective daily vitamin C serum for brighter, radiant skin. Helps reduce dark spots and hyperpigmentation.',
      shortDescription: 'Brightening and anti-aging daily facial serum.',
      price: 1200,
      specialPrice: 990,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      images: '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"]',
      unit: 'bottle',
      weight: '30ml',
      featured: true,
      brandId: brandOrdinary.id,
      categories: { connect: [{ id: catSkincare.id }] },
      variants: {
        create: [
          {
            sku: 'VITC-30',
            price: 1200,
            specialPrice: 990,
            stock: 30,
            isDefault: true,
            attributes: {
              create: [{ name: 'Size', value: '30ml' }]
            }
          },
          {
            sku: 'VITC-50',
            price: 1800,
            specialPrice: 1550,
            stock: 20,
            isDefault: false,
            attributes: {
              create: [{ name: 'Size', value: '50ml' }]
            }
          }
        ]
      }
    },
    include: { variants: true }
  });

  // 3. MAC Matte Lipstick
  const prodMacLip = await prisma.product.create({
    data: {
      name: 'MAC Matte Lipstick',
      slug: 'mac-matte-lipstick',
      description: 'Professional high-pigment matte finish lipstick. Long wearing and non-drying formulation.',
      shortDescription: 'Iconic matte lipstick from MAC.',
      price: 2200,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
      images: '["https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80"]',
      unit: 'piece',
      weight: '3g',
      featured: true,
      brandId: brandMac.id,
      categories: { connect: [{ id: catMakeup.id }] },
      variants: {
        create: [
          {
            sku: 'MAC-RUBY',
            price: 2200,
            stock: 25,
            isDefault: true,
            attributes: {
              create: [{ name: 'Shade', value: 'Ruby Woo' }]
            }
          },
          {
            sku: 'MAC-TEDDY',
            price: 2200,
            stock: 20,
            isDefault: false,
            attributes: {
              create: [{ name: 'Shade', value: 'Velvet Teddy' }]
            }
          }
        ]
      }
    },
    include: { variants: true }
  });

  // 4. L'Oreal Hair Serum
  const prodHairSerum = await prisma.product.create({
    data: {
      name: "L'Oreal Extraordinary Hair Oil",
      slug: 'loreal-extraordinary-hair-oil',
      description: 'Luxury nourishing hair serum that hydrates frizzy hair and provides brilliant shine.',
      shortDescription: 'Nourishing oil for all hair types.',
      price: 850,
      stock: 80,
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
      images: '["https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80"]',
      unit: 'bottle',
      weight: '100ml',
      featured: false,
      brandId: brandLoreal.id,
      categories: { connect: [{ id: catHaircare.id }] },
    }
  });

  // 5. Tea Tree Foam
  const prodTeaTree = await prisma.product.create({
    data: {
      name: 'Tea Tree Cleansing Foam',
      slug: 'tea-tree-cleansing-foam',
      description: 'Refreshing foam wash with natural tea tree extract for acne control and oil balance.',
      shortDescription: 'Deep cleansing acne-control face wash.',
      price: 650,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&w=800&q=80',
      images: '["https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&w=800&q=80"]',
      unit: 'bottle',
      weight: '120ml',
      featured: true,
      brandId: brandOrdinary.id,
      categories: { connect: [{ id: catSkincare.id }] },
    }
  });

  console.log('✅ Products & variants seeded successfully.');

  // --- Seed Reviews ---
  console.log('💬 Seeding product reviews...');
  await prisma.review.createMany({
    data: [
      {
        productId: prodAloe.id,
        rating: 5,
        content: 'Absolutely incredible! I use this aloe gel as a nighttime soothing pack and it works wonders.',
        reviewer: 'Sarah J.',
        reviewerEmail: 'sarah@test.com',
      },
      {
        productId: prodVitC.id,
        rating: 5,
        content: 'This Vitamin C serum helped fade my hyperpigmentation in just 2 weeks. Highly recommended!',
        reviewer: 'Emily C.',
        reviewerEmail: 'emily@test.com',
      },
      {
        productId: prodMacLip.id,
        rating: 4,
        content: 'Stays on all day. Ruby Woo is the perfect red shade.',
        reviewer: 'Aisha R.',
        reviewerEmail: 'aisha@test.com',
      }
    ]
  });
  console.log('✅ Reviews seeded.');

  // --- Seed Orders ---
  console.log('📦 Seeding customer orders...');

  // 1. Delivered Order
  const deliveredOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      customerName: 'Jane Doe',
      customerPhone: '01800000000',
      status: 'DELIVERED',
      subtotal: 1440, // 1x Aloe(150ml - 450) + 1x VitC(30ml - 990)
      deliveryFee: 60,
      total: 1500,
      deliveryAddress: 'House 42, Road 11, Banani',
      deliveryCity: 'Dhaka City',
      deliveryArea: 'Banani',
      deliveryState: 'Dhaka Division',
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            productId: prodAloe.id,
            variantId: prodAloe.variants[0].id,
            quantity: 1,
            price: 450,
          },
          {
            productId: prodVitC.id,
            variantId: prodVitC.variants[0].id,
            quantity: 1,
            price: 990,
          }
        ]
      }
    }
  });

  // 2. Pending Order
  const pendingOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      customerName: 'Jane Doe',
      customerPhone: '01800000000',
      status: 'PENDING',
      subtotal: 2200, // 1x MAC Lipstick (Ruby Woo - 2200)
      deliveryFee: 60,
      total: 2260,
      deliveryAddress: 'House 42, Road 11, Banani',
      deliveryCity: 'Dhaka City',
      deliveryArea: 'Banani',
      deliveryState: 'Dhaka Division',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      items: {
        create: [
          {
            productId: prodMacLip.id,
            variantId: prodMacLip.variants[0].id,
            quantity: 1,
            price: 2200,
          }
        ]
      }
    }
  });

  // 3. Cancelled Order
  const cancelledOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      customerName: 'Jane Doe',
      customerPhone: '01800000000',
      status: 'CANCELLED',
      subtotal: 650, // 1x Tea Tree (650)
      deliveryFee: 60,
      total: 710,
      deliveryAddress: 'House 42, Road 11, Banani',
      deliveryCity: 'Dhaka City',
      deliveryArea: 'Banani',
      deliveryState: 'Dhaka Division',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      items: {
        create: [
          {
            productId: prodTeaTree.id,
            quantity: 1,
            price: 650,
          }
        ]
      }
    }
  });

  console.log('✅ Customer orders seeded successfully.');

  // --- Seed Global Store Settings ---
  console.log('⚙️ Seeding store settings...');
  const settingsData = [
    { key: 'store_name', value: 'HalalMart' },
    { key: 'store_logo', value: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=150&q=80' },
    { key: 'footer_about_text', value: 'HalalMart is your premium destination for organic beauty, skincare essentials, and natural wellness products delivered to your door in Dhaka.' },
    { key: 'footer_address', value: 'House 42, Road 11, Banani, Dhaka 1213' },
    { key: 'footer_phone', value: '+880 1800-000000' },
    { key: 'footer_email', value: 'support@halalmart.test' },
    { key: 'footer_copyright', value: 'HalalMart. All rights reserved.' },
    { key: 'currency', value: '৳' },
    // Global Styling Configuration
    { key: 'permalink_structure', value: 'flat' },
    { key: 'productCardVariant', value: 'classic' },
    { key: 'productCardRadius', value: '3xl' },
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
  console.log('⛵ Seeding Navigation links...');
  const navItems = [
    { title: "Home", url: "/", sortOrder: 1, isActive: true },
    { title: "Products", url: "/products", sortOrder: 2, isActive: true },
    { title: "Categories", url: "/categories", sortOrder: 3, isActive: true },
    { title: "Eid Special", url: "/eid-campaign", sortOrder: 4, isActive: true },
    { title: "About Us", url: "/about", sortOrder: 5, isActive: true },
    { title: "Contact Us", url: "/contact", sortOrder: 6, isActive: true },
  ];

  for (const item of navItems) {
    await prisma.navbarItem.create({ data: item });
  }

  const footerSec = await prisma.footerSection.create({
    data: { title: "Quick Information", sortOrder: 1 }
  });

  const footerLinks = [
    { title: "About Our Story", url: "/about", sortOrder: 1, sectionId: footerSec.id },
    { title: "Shop Collections", url: "/products", sortOrder: 2, sectionId: footerSec.id },
    { title: "Special Eid Sale", url: "/eid-campaign", sortOrder: 3, sectionId: footerSec.id },
    { title: "Contact Us", url: "/contact", sortOrder: 4, sectionId: footerSec.id },
  ];

  for (const link of footerLinks) {
    await prisma.footerLink.create({ data: link });
  }
  console.log('✅ Navigation seeded.');

  // --- Seed Page Builder Components ---
  console.log('🧱 Seeding Page Builder template definitions...');
  const defaultComponents = [
    { name: 'HeroBanner', label: 'Hero Banner', category: 'Hero' },
    { name: 'PromoBadgeGrid', label: 'Feature Badges', category: 'Marketing' },
    { name: 'HotDealsSection', label: 'Countdown Deals', category: 'Commerce' },
    { name: 'ProductShowcase', label: 'Product Grid', category: 'Commerce' },
    { name: 'ConsultationBanner', label: 'Consultation Banner', category: 'Marketing' },
    { name: 'RoutineBanner', label: 'Skincare Routine', category: 'Marketing' },
    { name: 'TestimonialSection', label: 'Customer Reviews', category: 'Content' },
  ];

  for (const comp of defaultComponents) {
    await prisma.builderComponent.create({
      data: {
        name: comp.name,
        label: comp.label,
        category: comp.category,
      }
    });
  }

  // --- Seed Page Builder Pages ---
  console.log('📄 Seeding Builder dynamic page structures...');

  // Helper function to seed builder page and its versions
  async function seedBuilderPage(key: string, slug: string, title: string, sections: any[]) {
    const documentJson = {
      schemaVersion: 1,
      page: { key, slug, title },
      sections,
    };

    const page = await prisma.builderPage.upsert({
      where: { key },
      update: { slug, title, type: 'builder', status: 'published' },
      create: {
        key,
        slug,
        title,
        type: 'builder',
        status: 'published',
      }
    });

    const version = await prisma.builderPageVersion.upsert({
      where: {
        pageId_version: {
          pageId: page.id,
          version: 1
        }
      },
      update: {
        status: 'published',
        document: documentJson,
        publishedAt: new Date(),
      },
      create: {
        pageId: page.id,
        version: 1,
        status: 'published',
        document: documentJson,
        publishedAt: new Date(),
      }
    });

    await prisma.builderPage.update({
      where: { id: page.id },
      data: { publishedVersionId: version.id }
    });
  }

  // 1. HOME Page Document Layout
  const homeSections = [
    {
      id: "hero_banner_home",
      type: "HeroBanner",
      variant: "default",
      props: {
        title: "Dermatologist Approved Organic Care",
        subtitle: "Experience natural, glowing beauty with our 100% botanical extract formulas.",
        ctaText: "Shop Skincare",
        ctaHref: "/products?category=organic-skincare",
        imageSrc: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80",
        textAlign: "left"
      }
    },
    {
      id: "promo_badges_home",
      type: "PromoBadgeGrid",
      variant: "default",
      props: {
        badges: [
          {
            title: "Free Skin Doctor",
            subtitle: "Consultation online",
            iconName: "UserCheck",
            bgColor: "from-emerald-500 to-teal-700",
            href: "/builder/about"
          },
          {
            title: "100% Certified Organic",
            subtitle: "Safe for sensitive skin",
            iconName: "Leaf",
            bgColor: "from-green-500 to-emerald-600",
            href: "/products"
          },
          {
            title: "Fast Local Delivery",
            subtitle: "Within 30 minutes",
            iconName: "Truck",
            bgColor: "from-blue-500 to-indigo-600",
            href: "/checkout"
          }
        ]
      }
    },
    {
      id: "hot_deals_home",
      type: "HotDealsSection",
      variant: "default",
      props: {
        title: "Flash Deals on Glow Serums",
        subtitle: "Grab these exclusive discounts before the timer runs out!",
        deals: [
          {
            name: "Vitamin C Serum Duo",
            originalPrice: "৳2,400",
            salePrice: "৳1,800",
            discount: "25% OFF",
            image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
            endsIn: "2d 6h"
          },
          {
            name: "Hydrating Aloe gel Pack",
            originalPrice: "৳900",
            salePrice: "৳750",
            discount: "16% OFF",
            image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80",
            endsIn: "1d 18h"
          }
        ]
      }
    },
    {
      id: "product_showcase_home",
      type: "ProductShowcase",
      variant: "default",
      props: {
        title: "Our Best Sellers",
        subtitle: "Shop our most popular skincare and makeup lines.",
        showcaseCategoryId: "all",
        showCategoryFilter: true,
        textAlign: "center"
      }
    },
    {
      id: "consultation_home",
      type: "ConsultationBanner",
      variant: "default",
      props: {
        title: "Talk to a Skin Specialist Today",
        subtitle: "Receive a personalized analysis of your skin type and concerns from clinical experts.",
        badgeText: "Free 15-Min Consultation",
        ctaText: "Book Appointment",
        ctaHref: "/builder/about",
        imageSrc: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80",
        imageAlign: "right"
      }
    },
    {
      id: "testimonials_home",
      type: "TestimonialSection",
      variant: "default",
      props: {
        title: "Loved by Thousands",
        subtitle: "Read genuine feedback from our beautiful community.",
        textAlign: "center",
        testimonials: [
          {
            name: "Aisha Begum",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            rating: 5,
            review: "HalalMart's Vitamin C serum is the first product that actually worked for my dark circles. Amazing!",
            product: "Vitamin C Glow Serum"
          },
          {
            name: "Tariqul Islam",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            rating: 5,
            review: "Super fast delivery! Aloe Vera gel arrived cool and fresh. Very impressed with the quality.",
            product: "Aloe Vera Soothing Gel"
          }
        ]
      }
    }
  ];
  await seedBuilderPage('home', '/', 'Home', homeSections);

  // 2. ABOUT US Page Document Layout
  const aboutSections = [
    {
      id: "hero_banner_about",
      type: "HeroBanner",
      variant: "default",
      props: {
        title: "Our Sourcing Promise",
        subtitle: "We believe skincare should be safe, pure, and transparent. We work with fair-trade organic growers to source ingredients that benefit both you and the earth.",
        ctaText: "Read Sourcing Standards",
        ctaHref: "/products",
        imageSrc: "https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&w=800&q=80",
        textAlign: "left"
      }
    },
    {
      id: "promo_badges_about",
      type: "PromoBadgeGrid",
      variant: "default",
      props: {
        badges: [
          {
            title: "Cruelty Free",
            subtitle: "No animal testing",
            iconName: "Heart",
            bgColor: "from-rose-500 to-pink-600",
            href: "/products"
          },
          {
            title: "Zero Toxins",
            subtitle: "Paraben & Sulfate free",
            iconName: "ShieldAlert",
            bgColor: "from-amber-500 to-orange-600",
            href: "/products"
          },
          {
            title: "Carbon Neutral",
            subtitle: "Eco friendly packaging",
            iconName: "Globe",
            bgColor: "from-teal-500 to-emerald-600",
            href: "/products"
          }
        ]
      }
    },
    {
      id: "routine_about",
      type: "RoutineBanner",
      variant: "default",
      props: {
        title: "Clean Beauty Standard",
        subtitle: "Every item is checked against a database of 120 banned chemical ingredients to ensure safety for sensitive skin profiles.",
        badgeText: "HalalMart Quality Seal",
        ctaText: "Learn More",
        ctaHref: "/products",
        imageSrc: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
        imageAlign: "left"
      }
    }
  ];
  await seedBuilderPage('about', '/about', 'About Us', aboutSections);

  // 3. EID CAMPAIGN Page Document Layout
  const eidSections = [
    {
      id: "hero_banner_eid",
      type: "HeroBanner",
      variant: "default",
      props: {
        title: "Eid Mubarak: Festive Glow Sale",
        subtitle: "Look your absolute best this Eid with up to 40% off on MAC Makeup & Organic Serums.",
        ctaText: "Shop Eid Collection",
        ctaHref: "/products?category=makeup-essentials",
        imageSrc: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
        textAlign: "center"
      }
    },
    {
      id: "hot_deals_eid",
      type: "HotDealsSection",
      variant: "default",
      props: {
        title: "Eid Special Gift Combos",
        subtitle: "Specially packaged hampers to gift your loved ones.",
        deals: [
          {
            name: "Eid Skincare Glow Hamper",
            originalPrice: "৳3,500",
            salePrice: "৳2,600",
            discount: "25% OFF",
            image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80",
            endsIn: "4d 10h"
          },
          {
            name: "MAC Matte Glam Kit",
            originalPrice: "৳4,400",
            salePrice: "৳3,600",
            discount: "18% OFF",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80",
            endsIn: "4d 10h"
          }
        ]
      }
    },
    {
      id: "product_showcase_eid",
      type: "ProductShowcase",
      variant: "default",
      props: {
        title: "Exclusive Eid Makeup Collections",
        subtitle: "Perfect shades for Eid morning and evening events.",
        showcaseCategoryId: "all",
        showCategoryFilter: false,
        textAlign: "center"
      }
    }
  ];
  await seedBuilderPage('eid-campaign', '/eid-campaign', 'Eid Special', eidSections);

  console.log('✅ Dynamic Builder dynamic pages seeded.');

  // --- Seed Builder System Templates ---
  console.log('📋 Seeding Builder page templates...');
  await prisma.builderTemplate.upsert({
    where: { key: 'default-home' },
    update: {
      name: 'Default Home Layout',
      scope: 'page',
      pageType: 'home',
      isSystem: true,
      document: {
        schemaVersion: 1,
        page: { key: "home", slug: "/", title: "Home" },
        sections: homeSections,
      },
    },
    create: {
      key: 'default-home',
      name: 'Default Home Layout',
      scope: 'page',
      pageType: 'home',
      isSystem: true,
      document: {
        schemaVersion: 1,
        page: { key: "home", slug: "/", title: "Home" },
        sections: homeSections,
      },
    },
  });
  console.log('✅ Templates seeded.');

  console.log('\n🎉 Database seeding process completed successfully!');
}

void main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
