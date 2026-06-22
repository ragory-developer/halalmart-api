import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const homePage = await prisma.builderPage.findUnique({
    where: { slug: "home" },
    include: { versions: { where: { status: "published" } } }
  });

  if (!homePage || !homePage.versions.length) {
    console.log("Home page or published version not found");
    return;
  }

  const version = homePage.versions[0];
  const doc = version.document as any;

  console.log("Current components:");
  console.log(doc.components.map((c: any) => c.type).join(", "));

  let updated = false;
  doc.components = doc.components.map((c: any) => {
    if (c.type === "ThreeProductBanner") {
      c.type = "BestBuyBanner";
      updated = true;
      console.log("Found ThreeProductBanner, changing to BestBuyBanner");
    }
    return c;
  });

  // If there's no BestBuyBanner, let's add it right after CategoryShowcase or HeroBanner
  const hasBestBuy = doc.components.some((c: any) => c.type === "BestBuyBanner");
  if (!hasBestBuy) {
    console.log("BestBuyBanner not found in layout, adding it...");
    const newComponent = {
      id: "best-buy-banner-1",
      type: "BestBuyBanner",
      props: {
        title: "Deal of the Day",
        subtitle: "Featured Pick",
      }
    };
    
    // Insert after PromoBanner or at index 1
    const insertIndex = doc.components.findIndex((c: any) => c.type === "PromoBanner") + 1;
    if (insertIndex > 0) {
      doc.components.splice(insertIndex, 0, newComponent);
    } else {
      doc.components.splice(1, 0, newComponent);
    }
    updated = true;
  }

  if (updated) {
    await prisma.builderPageVersion.update({
      where: { id: version.id },
      data: { document: doc }
    });
    console.log("Successfully updated home page document.");
    console.log("New components:");
    console.log(doc.components.map((c: any) => c.type).join(", "));
  } else {
    console.log("No changes needed. BestBuyBanner is already there.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
