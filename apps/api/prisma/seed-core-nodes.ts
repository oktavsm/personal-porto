/**
 * seed-core-nodes.ts
 *
 * Safe to run on prod: uses upsert-by-label, only touches CoreServerNode table.
 * All other data (projects, experiences, music, etc.) is NOT affected.
 */
import { PrismaClient } from "@prisma/client";
import { coreServerNodes } from "../../../src/data/coreServerNodes.js";

const prisma = new PrismaClient();

async function seedCoreNodes() {
  console.log("Seeding Core Server Nodes...");

  for (const [index, node] of coreServerNodes.entries()) {
    const existing = await prisma.coreServerNode.findFirst({
      where: { label: node.label },
    });

    if (existing) {
      await prisma.coreServerNode.update({
        where: { id: existing.id },
        data: {
          description: node.description,
          href: node.href,
          positionX: node.position.x,
          positionY: node.position.y,
          sortOrder: index + 1,
          isPublished: true,
        },
      });
      console.log(`  updated: ${node.label}`);
    } else {
      await prisma.coreServerNode.create({
        data: {
          label: node.label,
          description: node.description,
          href: node.href,
          positionX: node.position.x,
          positionY: node.position.y,
          sortOrder: index + 1,
          isPublished: true,
        },
      });
      console.log(`  created: ${node.label}`);
    }
  }

  console.log("Done seeding Core Server Nodes.");
}

seedCoreNodes()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
