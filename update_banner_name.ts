import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const versions = await prisma.builderPageVersion.findMany();

  for (const v of versions) {
    if (!v.document || typeof v.document !== "object") continue;

    const doc = v.document as any;
    if (!doc.sections || !Array.isArray(doc.sections)) continue;

    let changed = false;
    for (const section of doc.sections) {
      if (section.type === "ThreeProductBanner") {
        section.type = "BestBuyBanner";
        changed = true;
      }
    }

    if (changed) {
      await prisma.builderPageVersion.update({
        where: { id: v.id },
        data: { document: doc }
      });
      console.log(`Updated page version ${v.id}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
