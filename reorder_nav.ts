import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const navs = await prisma.navbarItem.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  
  console.log("Current Navigation:");
  navs.forEach(n => console.log(`${n.sortOrder}: ${n.title} (${n.id})`));

  const explore = navs.find(n => n.title === "Explore");
  if (!explore) {
    console.log("Explore not found!");
    return;
  }

  // Remove explore from array
  const otherNavs = navs.filter(n => n.id !== explore.id);
  
  // Insert it at position 1 (which is 2nd position, after position 0)
  otherNavs.splice(1, 0, explore);

  console.log("\nNew Navigation Order:");
  
  // Update in DB
  for (let i = 0; i < otherNavs.length; i++) {
    const newOrder = i + 1;
    console.log(`${newOrder}: ${otherNavs[i].title}`);
    await prisma.navbarItem.update({
      where: { id: otherNavs[i].id },
      data: { sortOrder: newOrder }
    });
  }
  console.log("\nUpdated successfully.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
