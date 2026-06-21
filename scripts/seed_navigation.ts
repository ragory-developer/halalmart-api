import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default navigation data...");

  // Seed Navbar
  const navItems = [
    { title: "Home", url: "/", sortOrder: 1 },
    { title: "Store", url: "/products", sortOrder: 2 },
    { title: "Category", url: "/categories", sortOrder: 3 },
    { title: "About Us", url: "/about", sortOrder: 4 },
    { title: "Contact Us", url: "/contact", sortOrder: 5 },
  ];

  for (const item of navItems) {
    const existing = await prisma.navbarItem.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.navbarItem.create({ data: item });
    }
  }

  // Seed Footer Sections & Links
  const footerData = [
    {
      title: "Quick Links",
      sortOrder: 1,
      links: [
        { title: "Home", url: "/", sortOrder: 1 },
        { title: "All Products", url: "/products", sortOrder: 2 },
        { title: "Categories", url: "/categories", sortOrder: 3 },
        { title: "Your Cart", url: "/cart", sortOrder: 4 },
      ]
    },
    {
      title: "Customer Service",
      sortOrder: 2,
      links: [
        { title: "Help Center / FAQ", url: "#", sortOrder: 1 },
        { title: "Delivery Options", url: "#", sortOrder: 2 },
        { title: "Returns & Refunds", url: "#", sortOrder: 3 },
        { title: "Terms of Service", url: "#", sortOrder: 4 },
      ]
    }
  ];

  for (const section of footerData) {
    let sec = await prisma.footerSection.findFirst({ where: { title: section.title } });
    if (!sec) {
      sec = await prisma.footerSection.create({
        data: { title: section.title, sortOrder: section.sortOrder }
      });
      for (const link of section.links) {
        await prisma.footerLink.create({
          data: { ...link, sectionId: sec.id }
        });
      }
    }
  }

  console.log("Navigation seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
